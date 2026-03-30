import nodemailer from "nodemailer";
import { getDb } from "../db";
import { emailNotifications, bookmarks, opportunities, users } from "../../drizzle/schema";
import { eq, and, lt, isNull } from "drizzle-orm";

/**
 * Email service for sending deadline reminder notifications
 */

// Initialize email transporter (configure with your email provider)
// For development, uses ethereal email (fake SMTP service)
// For production, configure with your actual email provider (SendGrid, AWS SES, etc.)
let transporter: nodemailer.Transporter | null = null;

async function initializeTransporter() {
  if (transporter) return transporter;

  // For development: use ethereal email
  if (process.env.NODE_ENV !== "production") {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } else {
    // For production: configure with your email provider
    // Example: SendGrid
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY not configured");
    }

    transporter = nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  return transporter;
}

/**
 * Generate HTML email template for deadline reminder
 */
function generateEmailTemplate(
  studentName: string,
  opportunityTitle: string,
  opportunityDescription: string,
  daysUntilDeadline: number,
  deadline: Date,
  opportunityLink: string
): string {
  const formattedDeadline = deadline.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0a7ea4; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .footer { background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; background-color: #0a7ea4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .alert { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
          h2 { color: #0a7ea4; }
          .opportunity-details { background-color: white; padding: 15px; border-left: 4px solid #0a7ea4; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LevelUp Waterloo</h1>
            <p>Opportunity Deadline Reminder</p>
          </div>

          <div class="content">
            <h2>Hi ${studentName},</h2>

            <p>This is a friendly reminder that an opportunity you bookmarked is expiring soon!</p>

            <div class="alert">
              <strong>⏰ Deadline in ${daysUntilDeadline} day${daysUntilDeadline === 1 ? "" : "s"}</strong>
              <p style="margin: 10px 0 0 0;">
                Don't miss this opportunity! The deadline is <strong>${formattedDeadline}</strong>.
              </p>
            </div>

            <div class="opportunity-details">
              <h3>${opportunityTitle}</h3>
              <p>${opportunityDescription}</p>
              <p style="margin-top: 15px;">
                <a href="${opportunityLink}" class="button">View Opportunity</a>
              </p>
            </div>

            <p>
              If you're interested in this opportunity, make sure to apply before the deadline passes.
              If you have any questions, feel free to reach out to the opportunity organizer.
            </p>

            <p>
              Best of luck with your applications!<br>
              <strong>The LevelUp Waterloo Team</strong>
            </p>
          </div>

          <div class="footer">
            <p>
              You received this email because you bookmarked this opportunity on LevelUp Waterloo.
              <br>
              <a href="#" style="color: #0a7ea4; text-decoration: none;">Manage preferences</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send deadline reminder email to a student
 */
export async function sendDeadlineReminderEmail(
  userId: number,
  opportunityId: number,
  studentEmail: string,
  studentName: string,
  opportunityTitle: string,
  opportunityDescription: string,
  deadline: Date,
  opportunityLink: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = await initializeTransporter();
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const htmlContent = generateEmailTemplate(
      studentName,
      opportunityTitle,
      opportunityDescription,
      daysUntilDeadline,
      deadline,
      opportunityLink
    );

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@levelupwaterloo.com",
      to: studentEmail,
      subject: `Reminder: "${opportunityTitle}" deadline in ${daysUntilDeadline} day${daysUntilDeadline === 1 ? "" : "s"}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    // Log preview URL for development
    if (process.env.NODE_ENV !== "production") {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to send email:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Find and send deadline reminders for bookmarked opportunities expiring within 7 days
 */
export async function sendDeadlineReminders(): Promise<{
  sent: number;
  failed: number;
  skipped: number;
}> {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return { sent: 0, failed: 0, skipped: 0 };
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  try {
    // Find opportunities expiring within 7 days
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiringOpportunities = await db
      .select()
      .from(opportunities)
      .where(
        and(
          // Deadline is within next 7 days
          lt(opportunities.deadline, new Date(sevenDaysFromNow)),
          // Deadline is in the future
          lt(opportunities.deadline, new Date(now)),
          // Opportunity is approved
          eq(opportunities.isApproved, true)
        )
      );

    console.log(`Found ${expiringOpportunities.length} opportunities expiring within 7 days`);

    // For each expiring opportunity, find bookmarked users
    for (const opp of expiringOpportunities) {
      const bookmarkedUsers = await db
        .select({
          userId: bookmarks.userId,
          email: users.email,
          name: users.name,
        })
        .from(bookmarks)
        .innerJoin(users, eq(bookmarks.userId, users.id))
        .where(eq(bookmarks.opportunityId, opp.id));

      console.log(
        `Found ${bookmarkedUsers.length} users who bookmarked "${opp.title}"`
      );

      // Send reminder to each user (if not already sent)
      for (const user of bookmarkedUsers) {
        try {
          // Check if we already sent a reminder for this user/opportunity
          const existingNotification = await db
            .select()
            .from(emailNotifications)
            .where(
              and(
                eq(emailNotifications.userId, user.userId),
                eq(emailNotifications.opportunityId, opp.id),
                eq(emailNotifications.type, "deadline_reminder"),
                eq(emailNotifications.status, "sent")
              )
            );

          if (existingNotification.length > 0) {
            console.log(
              `Skipping: Already sent reminder to user ${user.userId} for opportunity ${opp.id}`
            );
            skipped++;
            continue;
          }

          // Create notification record
          const [notification] = await db
            .insert(emailNotifications)
            .values({
              userId: user.userId,
              opportunityId: opp.id,
              type: "deadline_reminder",
              status: "pending",
            });

          // Send email
          const result = await sendDeadlineReminderEmail(
            user.userId,
            opp.id,
            user.email || "",
            user.name || "Student",
            opp.title,
            opp.description,
            opp.deadline || new Date(),
            opp.externalLink || `https://levelupwaterloo.com/opportunity/${opp.id}`
          );

          // Update notification status
          if (result.success) {
            await db
              .update(emailNotifications)
              .set({
                status: "sent",
                sentAt: new Date(),
              })
              .where(eq(emailNotifications.id, (notification as any).insertId));

            console.log(
              `✓ Sent reminder to ${user.email} for "${opp.title}"`
            );
            sent++;
          } else {
            await db
              .update(emailNotifications)
              .set({
                status: "failed",
                error: result.error,
              })
              .where(eq(emailNotifications.id, (notification as any).insertId));

            console.error(
              `✗ Failed to send reminder to ${user.email}: ${result.error}`
            );
            failed++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.error(`Error processing user ${user.userId}:`, errorMessage);
          failed++;
        }
      }
    }

    console.log(`Deadline reminder summary: ${sent} sent, ${failed} failed, ${skipped} skipped`);
    return { sent, failed, skipped };
  } catch (error) {
    console.error("Error in sendDeadlineReminders:", error);
    return { sent, failed, skipped };
  }
}

/**
 * Test email sending (for development)
 */
export async function testEmailSending(testEmail: string): Promise<boolean> {
  try {
    const result = await sendDeadlineReminderEmail(
      0,
      0,
      testEmail,
      "Test User",
      "Sample Opportunity",
      "This is a test opportunity to verify email sending is working correctly.",
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      "https://levelupwaterloo.com"
    );

    if (result.success) {
      console.log("✓ Test email sent successfully");
      if (process.env.NODE_ENV !== "production") {
        console.log("Preview URL: Check your console output above");
      }
      return true;
    } else {
      console.error("✗ Test email failed:", result.error);
      return false;
    }
  } catch (error) {
    console.error("Error sending test email:", error);
    return false;
  }
}
