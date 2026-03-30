# LevelUp Waterloo - Opportunity Management Guide

This guide explains how to continuously manage opportunities in your app: adding new ones, updating existing ones, and removing expired ones.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Adding New Opportunities](#adding-new-opportunities)
3. [Updating Existing Opportunities](#updating-existing-opportunities)
4. [Removing/Inactivating Opportunities](#removinginactivating-opportunities)
5. [Automated Expiration System](#automated-expiration-system)
6. [Admin Dashboard (Coming Soon)](#admin-dashboard-coming-soon)
7. [Best Practices](#best-practices)

---

## Quick Start

There are **three ways** to manage opportunities:

| Method | Best For | Difficulty | Time |
|--------|----------|-----------|------|
| **Direct Database** | Quick updates, bulk operations | Medium | 5-10 min |
| **Admin Dashboard** | Regular management, user-friendly | Easy | 2-5 min |
| **Automated System** | Hands-off expiration | Easy | Set once |

---

## Adding New Opportunities

### Method 1: Using a Script (Recommended)

Create a new script to add opportunities programmatically:

**File: `scripts/add-opportunity.ts`**

```typescript
import "dotenv/config";
import { db } from "../server/db";
import { opportunities } from "../backend/drizzle/schema";

async function addOpportunity() {
  const newOpportunity = {
    title: "Waterloo Youth Mentorship Program",
    description: "Mentor younger students in academics and personal development.",
    category: "volunteering" as const,
    level: "high_school" as const,
    type: "in_person" as const,
    duration: "long" as const,
    deadline: new Date("2026-06-30"),
    link: "https://www.waterlooyouthmentorship.ca/volunteer",
    organization: "Waterloo Youth Services",
    approved: true,
  };

  try {
    const result = await db.insert(opportunities).values(newOpportunity);
    console.log("✅ Opportunity added successfully!");
    console.log("ID:", result.insertId);
  } catch (error) {
    console.error("❌ Error adding opportunity:", error);
  }
}

addOpportunity();
```

**Run it:**
```bash
cd /path/to/level-up-waterloo
npx tsx scripts/add-opportunity.ts
```

### Method 2: Direct Database Insert

If you have database access, run SQL directly:

```sql
INSERT INTO opportunities (
  title,
  description,
  category,
  level,
  type,
  duration,
  deadline,
  link,
  organization,
  approved,
  created_at
) VALUES (
  'Waterloo Community Garden Volunteer',
  'Help maintain community gardens and teach sustainable gardening practices.',
  'volunteering',
  'both',
  'in_person',
  'long',
  '2026-08-31',
  'https://www.waterloocommunitygardens.ca',
  'Waterloo Community Gardens',
  true,
  NOW()
);
```

### Method 3: Admin Dashboard (Future)

Once the admin dashboard is built, you'll be able to add opportunities through a web form without any coding.

---

## Updating Existing Opportunities

### Update Deadline

```typescript
import { db } from "../server/db";
import { opportunities } from "../backend/drizzle/schema";
import { eq } from "drizzle-orm";

async function updateDeadline(opportunityId: number, newDeadline: Date) {
  try {
    await db
      .update(opportunities)
      .set({ deadline: newDeadline })
      .where(eq(opportunities.id, opportunityId));
    
    console.log("✅ Deadline updated!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Usage
updateDeadline(1, new Date("2026-07-15"));
```

### Update Description or Link

```typescript
async function updateOpportunity(
  opportunityId: number,
  updates: {
    description?: string;
    link?: string;
    organization?: string;
  }
) {
  try {
    await db
      .update(opportunities)
      .set(updates)
      .where(eq(opportunities.id, opportunityId));
    
    console.log("✅ Opportunity updated!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Usage
updateOpportunity(1, {
  description: "New description here",
  link: "https://newlink.com"
});
```

### Bulk Update (Multiple Opportunities)

```typescript
async function updateMultiple(
  opportunityIds: number[],
  updates: Record<string, any>
) {
  try {
    for (const id of opportunityIds) {
      await db
        .update(opportunities)
        .set(updates)
        .where(eq(opportunities.id, id));
    }
    console.log(`✅ Updated ${opportunityIds.length} opportunities!`);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Usage
updateMultiple([1, 2, 3], { approved: true });
```

---

## Removing/Inactivating Opportunities

### Option 1: Soft Delete (Recommended)

Instead of deleting, mark as inactive:

```typescript
async function inactivateOpportunity(opportunityId: number) {
  try {
    await db
      .update(opportunities)
      .set({ approved: false })
      .where(eq(opportunities.id, opportunityId));
    
    console.log("✅ Opportunity inactivated!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Usage
inactivateOpportunity(5);
```

**Why soft delete?**
- ✅ Preserves data history
- ✅ Can be reactivated later
- ✅ No data loss
- ✅ Better for analytics

### Option 2: Hard Delete (Permanent)

```typescript
async function deleteOpportunity(opportunityId: number) {
  try {
    await db
      .delete(opportunities)
      .where(eq(opportunities.id, opportunityId));
    
    console.log("✅ Opportunity permanently deleted!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Usage
deleteOpportunity(5);
```

### Option 3: Bulk Inactivate Expired

```typescript
async function inactivateExpired() {
  try {
    const result = await db
      .update(opportunities)
      .set({ approved: false })
      .where(lt(opportunities.deadline, new Date()));
    
    console.log("✅ Expired opportunities inactivated!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Usage
inactivateExpired();
```

---

## Automated Expiration System

### Set Up Automatic Expiration

Add this to your backend server to automatically inactivate expired opportunities:

**File: `backend/server/_core/expiration.ts`**

```typescript
import { db } from "../db";
import { opportunities } from "../../drizzle/schema";
import { lt } from "drizzle-orm";

/**
 * Inactivate opportunities that have passed their deadline
 * Run this periodically (e.g., daily via cron job)
 */
export async function inactivateExpiredOpportunities() {
  try {
    const result = await db
      .update(opportunities)
      .set({ approved: false })
      .where(lt(opportunities.deadline, new Date()));

    console.log(`[Expiration] Inactivated ${result.rowsAffected} expired opportunities`);
    return result.rowsAffected;
  } catch (error) {
    console.error("[Expiration] Error:", error);
    throw error;
  }
}

/**
 * Get count of expiring soon (within 7 days)
 */
export async function getExpiringOpportunities() {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  try {
    const expiring = await db
      .select()
      .from(opportunities)
      .where(
        and(
          gte(opportunities.deadline, new Date()),
          lte(opportunities.deadline, sevenDaysFromNow),
          eq(opportunities.approved, true)
        )
      );

    return expiring;
  } catch (error) {
    console.error("[Expiration] Error fetching expiring:", error);
    throw error;
  }
}
```

### Run Expiration Daily

Add to your backend server startup:

**File: `backend/server/_core/index.ts`**

```typescript
import { inactivateExpiredOpportunities } from "./expiration";

async function startServer() {
  // ... existing code ...

  // Run expiration check daily at 2 AM
  const scheduleExpiration = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0);

    const timeUntilExpiration = tomorrow.getTime() - now.getTime();

    setTimeout(async () => {
      await inactivateExpiredOpportunities();
      // Run again every 24 hours
      setInterval(inactivateExpiredOpportunities, 24 * 60 * 60 * 1000);
    }, timeUntilExpiration);
  };

  scheduleExpiration();
  console.log("[Server] Expiration scheduler started");

  // ... rest of server code ...
}
```

---

## Admin Dashboard (Coming Soon)

A dedicated admin dashboard will allow you to:

- ✅ View all opportunities in a table
- ✅ Add new opportunities via form
- ✅ Edit existing opportunities
- ✅ Bulk actions (inactivate, approve, etc.)
- ✅ Search and filter
- ✅ See expiration status
- ✅ View analytics

**To build this, we would:**

1. Create an admin authentication system
2. Build a React admin panel
3. Add CRUD endpoints to the backend
4. Add permission checks

---

## Best Practices

### 1. **Use Soft Delete**
- Always inactivate instead of deleting
- Preserves data history and analytics
- Can reactivate if needed

### 2. **Set Realistic Deadlines**
- Add opportunities 2-4 weeks before they start
- Set deadline to actual application deadline
- Leave 1-2 week buffer for students to apply

### 3. **Keep Descriptions Updated**
- Update descriptions if requirements change
- Add notes about changes in the description
- Keep links current

### 4. **Regular Maintenance Schedule**
- Check for expired opportunities weekly
- Update deadlines monthly
- Review and refresh descriptions quarterly

### 5. **Track Changes**
- Consider adding `updated_at` timestamp to schema
- Log who made changes and when
- Useful for auditing and debugging

### 6. **Bulk Operations**
- When adding many opportunities, use bulk insert
- When updating many, batch them in groups of 10-20
- Reduces database load

### 7. **Validation**
- Always validate deadline is in the future
- Check that links are valid
- Ensure descriptions are not empty
- Verify organization names are spelled correctly

---

## Common Tasks

### Task: Add 5 New Opportunities

```typescript
const newOpportunities = [
  {
    title: "Opportunity 1",
    description: "...",
    // ... other fields
  },
  // ... more opportunities
];

for (const opp of newOpportunities) {
  await db.insert(opportunities).values(opp);
}
```

### Task: Inactivate All Expired Opportunities

```bash
npx tsx scripts/inactivate-expired.ts
```

### Task: Update All Waterloo Food Bank Opportunities

```typescript
await db
  .update(opportunities)
  .set({ organization: "Waterloo Food Bank - Updated" })
  .where(like(opportunities.organization, "%Waterloo Food Bank%"));
```

### Task: Get Statistics

```typescript
// Count by category
const byCategory = await db
  .select({ category: opportunities.category, count: count() })
  .from(opportunities)
  .where(eq(opportunities.approved, true))
  .groupBy(opportunities.category);

// Count expiring soon
const expiringSoon = await getExpiringOpportunities();
```

---

## Troubleshooting

### Issue: Script won't run
**Solution:** Make sure you're in the right directory and have `.env` configured

### Issue: Database connection error
**Solution:** Check DATABASE_URL in `.env` is correct

### Issue: Opportunity not showing up
**Solution:** Make sure `approved: true` is set

### Issue: Deadline not updating
**Solution:** Check date format - should be `new Date("YYYY-MM-DD")`

---

## Next Steps

1. **Create scripts** for your common tasks
2. **Set up automation** for expiration
3. **Build admin dashboard** for easy management
4. **Add notifications** for expiring opportunities
5. **Create backup system** for data safety

---

**Questions?** Refer to the backend README or check the database schema in `backend/drizzle/schema.ts`
