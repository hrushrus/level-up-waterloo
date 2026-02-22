import { getDb } from "../server/db";
import { opportunities } from "../drizzle/schema";

const volunteeringOpportunities: Array<{
  title: string;
  description: string;
  category: "volunteering";
  externalLink: string;
  submittedBy: string;
  submitterEmail: string;
  deadline: Date;
  isApproved: boolean;
  level: "both" | "middle_school" | "high_school";
  type: "in_person" | "online" | "hybrid";
  duration: "short" | "medium" | "long";
}> = [
  {
    title: "Waterloo Food Bank - Youth Volunteer Program",
    description: "Help sort, pack, and distribute food to families in need. Work with a team of dedicated volunteers to support food security in the Waterloo region. Great opportunity to develop teamwork and community service skills.",
    category: "volunteering" as const,
    externalLink: "https://www.waterloofoodbank.ca/volunteer",
    submittedBy: "Admin",
    submitterEmail: "admin@levelup.ca",
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isApproved: true,
    level: "both" as const,
    type: "in_person" as const,
    duration: "long" as const,
  },
  {
    title: "Waterloo Public Library - Teen Volunteer",
    description: "Assist with shelving books, helping patrons, and organizing library programs. Develop customer service skills while supporting your community's library. Flexible scheduling available for students.",
    category: "volunteering" as const,
    externalLink: "https://www.waterloopubliclibrary.ca/volunteer",
    submittedBy: "Admin",
    submitterEmail: "admin@levelup.ca",
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isApproved: true,
    level: "both" as const,
    type: "in_person" as const,
    duration: "long" as const,
  },
  {
    title: "Kitchener-Waterloo Humane Society - Animal Care Volunteer",
    description: "Care for animals, help with cleaning facilities, and assist with adoption events. Perfect for animal lovers who want to make a difference in the lives of pets in our community.",
    category: "volunteering" as const,
    externalLink: "https://www.kwhumanesociety.ca/volunteer",
    submittedBy: "Admin",
    submitterEmail: "admin@levelup.ca",
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isApproved: true,
    level: "both" as const,
    type: "in_person" as const,
    duration: "long" as const,
  },
  {
    title: "Waterloo Region Habitat for Humanity - Youth Build",
    description: "Join hands-on construction projects to build affordable housing for families in need. Learn valuable construction skills while making a tangible impact on housing security in our region.",
    category: "volunteering" as const,
    externalLink: "https://www.habitatwaterloo.ca/volunteer",
    submittedBy: "Admin",
    submitterEmail: "admin@levelup.ca",
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isApproved: true,
    level: "high_school" as const,
    type: "in_person" as const,
    duration: "long" as const,
  },
  {
    title: "Waterloo Community Tutoring - Student Tutor",
    description: "Tutor younger students in math, science, English, and other subjects. Build leadership and communication skills while helping peers succeed academically.",
    category: "volunteering" as const,
    externalLink: "https://www.waterloocommunity.ca/tutoring",
    submittedBy: "Admin",
    submitterEmail: "admin@levelup.ca",
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isApproved: true,
    level: "both" as const,
    type: "hybrid" as const,
    duration: "long" as const,
  },
  {
    title: "Waterloo Region Youth Mentorship Program",
    description: "Become a mentor to younger students and provide guidance on academics, career exploration, and personal development. Make a lasting impact on a young person's life.",
    category: "volunteering" as const,
    externalLink: "https://www.waterlooyouthmentorship.ca/volunteer",
    submittedBy: "Admin",
    submitterEmail: "admin@levelup.ca",
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isApproved: true,
    level: "high_school" as const,
    type: "hybrid" as const,
    duration: "long" as const,
  },
  {
    title: "Waterloo Environmental Action - Trail Maintenance",
    description: "Help maintain and improve local hiking trails and green spaces. Participate in conservation efforts to protect the natural beauty of the Waterloo region.",
    category: "volunteering" as const,
    externalLink: "https://www.waterlooenvironmental.ca/volunteer",
    submittedBy: "Admin",
    submitterEmail: "admin@levelup.ca",
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isApproved: true,
    level: "both" as const,
    type: "in_person" as const,
    duration: "long" as const,
  },
  {
    title: "Waterloo Community Health Centre - Volunteer",
    description: "Support healthcare workers by helping with patient care, administrative tasks, and community health programs. Gain valuable healthcare experience while serving your community.",
    category: "volunteering" as const,
    externalLink: "https://www.waterloohealthcentre.ca/volunteer",
    submittedBy: "Admin",
    submitterEmail: "admin@levelup.ca",
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isApproved: true,
    level: "high_school" as const,
    type: "in_person" as const,
    duration: "long" as const,
  },
  {
    title: "Waterloo Seniors' Support Program - Teen Volunteer",
    description: "Visit and support seniors in the community through companionship, tech help, and activity assistance. Make a difference in the lives of older adults while learning valuable interpersonal skills.",
    category: "volunteering" as const,
    externalLink: "https://www.waterlooseniorsupport.ca/volunteer",
    submittedBy: "Admin",
    submitterEmail: "admin@levelup.ca",
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isApproved: true,
    level: "both" as const,
    type: "in_person" as const,
    duration: "long" as const,
  },
  {
    title: "Waterloo Youth Crisis Line - Peer Support Volunteer",
    description: "Provide peer support to youth in crisis through phone and online chat. Receive training in active listening and mental health support. Help save lives in your community.",
    category: "volunteering" as const,
    externalLink: "https://www.waterlooyouthcrisis.ca/volunteer",
    submittedBy: "Admin",
    submitterEmail: "admin@levelup.ca",
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isApproved: true,
    level: "high_school" as const,
    type: "online" as const,
    duration: "long" as const,
  },
  {
    title: "Waterloo Community Garden - Garden Volunteer",
    description: "Help maintain community gardens, teach gardening workshops, and promote sustainable food production. Connect with nature while building community relationships.",
    category: "volunteering" as const,
    externalLink: "https://www.waterloocommunitygardens.ca/volunteer",
    submittedBy: "Admin",
    submitterEmail: "admin@levelup.ca",
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isApproved: true,
    level: "both" as const,
    type: "in_person" as const,
    duration: "long" as const,
  },
  {
    title: "Waterloo Sports for All - Volunteer Coach",
    description: "Coach youth sports teams and help make athletics accessible to all students. Share your passion for sports while developing leadership and coaching skills.",
    category: "volunteering" as const,
    externalLink: "https://www.waterloosportsforall.ca/volunteer",
    submittedBy: "Admin",
    submitterEmail: "admin@levelup.ca",
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isApproved: true,
    level: "high_school" as const,
    type: "in_person" as const,
    duration: "long" as const,
  },
];

async function seedVolunteeringOpportunities() {
  // Ensure DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }

    console.log("Seeding volunteering opportunities...");
    
    for (const opp of volunteeringOpportunities) {
      await db.insert(opportunities).values(opp);
      console.log(`✓ Added: ${opp.title}`);
    }

    console.log(`\n✅ Successfully seeded ${volunteeringOpportunities.length} volunteering opportunities!`);
  } catch (error) {
    console.error("Error seeding volunteering opportunities:", error);
    process.exit(1);
  }
}

seedVolunteeringOpportunities().then(() => process.exit(0));
