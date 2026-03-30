/**
 * Seed script for populating development database with sample opportunities
 * Run with: tsx scripts/seed-opportunities.ts
 */

import { importFromArray } from "../server/utils/import-opportunities";
import type { OpportunityImportRow } from "../server/utils/import-opportunities";

const sampleOpportunities: OpportunityImportRow[] = [
  {
    title: "Summer Internship Program",
    description:
      "Join our summer internship program and gain valuable experience in software development. Work with experienced mentors on real-world projects.",
    category: "extracurricular",
    externalLink: "https://example.com/internship",
    submittedBy: "Tech Company HR",
    submitterEmail: "hr@techcompany.com",
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    level: "high_school",
    type: "hybrid",
    duration: "long",
    isApproved: true,
  },
  {
    title: "STEM Competition 2026",
    description:
      "Compete with students from across the region in our annual STEM competition. Showcase your skills in robotics, coding, and engineering.",
    category: "stem_competition",
    externalLink: "https://example.com/stem-competition",
    submittedBy: "STEM Education Board",
    submitterEmail: "info@stemedboard.com",
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    level: "both",
    type: "in_person",
    duration: "short",
    isApproved: true,
  },
  {
    title: "Volunteer at Waterloo Food Bank",
    description:
      "Help sort and distribute food to families in need. Work with a dedicated team of volunteers to make a difference in our community.",
    category: "volunteering",
    externalLink: "https://example.com/foodbank",
    submittedBy: "Waterloo Food Bank",
    submitterEmail: "volunteer@waterloofoodb.org",
    deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    level: "middle_school",
    type: "in_person",
    duration: "medium",
    isApproved: true,
  },
  {
    title: "Youth Leadership Program",
    description:
      "Develop leadership skills through workshops, mentoring, and community projects. Perfect for students interested in making an impact.",
    category: "extracurricular",
    externalLink: "https://example.com/leadership",
    submittedBy: "Community Development",
    submitterEmail: "programs@commdev.org",
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    level: "high_school",
    type: "hybrid",
    duration: "medium",
    isApproved: true,
  },
  {
    title: "Science Fair 2026",
    description:
      "Showcase your scientific research and innovation at our annual science fair. Win prizes and recognition for outstanding projects.",
    category: "stem_competition",
    externalLink: "https://example.com/sciencefair",
    submittedBy: "Science Education Center",
    submitterEmail: "sciencefair@secedu.org",
    deadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    level: "both",
    type: "in_person",
    duration: "medium",
    isApproved: true,
  },
  {
    title: "Coding Bootcamp Summer 2026",
    description:
      "Intensive 8-week coding bootcamp covering web development, mobile apps, and cloud technologies. Perfect for beginners and intermediate learners.",
    category: "extracurricular",
    externalLink: "https://example.com/bootcamp",
    submittedBy: "Tech Academy",
    submitterEmail: "admissions@techacademy.com",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    level: "high_school",
    type: "online",
    duration: "long",
    isApproved: true,
  },
  {
    title: "Community Sports League",
    description:
      "Join our community sports league and compete in various sports throughout the year. Build friendships and stay active.",
    category: "sports",
    externalLink: "https://example.com/sports-league",
    submittedBy: "Parks & Recreation",
    submitterEmail: "sports@parksrec.org",
    deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    level: "both",
    type: "in_person",
    duration: "long",
    isApproved: true,
  },
  {
    title: "Environmental Conservation Project",
    description:
      "Help protect our local environment through conservation projects, tree planting, and habitat restoration.",
    category: "volunteering",
    externalLink: "https://example.com/conservation",
    submittedBy: "Green Earth Initiative",
    submitterEmail: "volunteer@greenearth.org",
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    level: "middle_school",
    type: "in_person",
    duration: "medium",
    isApproved: true,
  },
  {
    title: "Scholarship Opportunity - STEM Excellence",
    description:
      "Annual scholarship for students excelling in STEM subjects. Award up to $5,000 for tuition and educational expenses.",
    category: "grant",
    externalLink: "https://example.com/stem-scholarship",
    submittedBy: "Education Foundation",
    submitterEmail: "scholarships@edfoundation.org",
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    level: "high_school",
    type: "online",
    duration: "short",
    isApproved: true,
  },
  {
    title: "Debate Club - Competitive Debate",
    description:
      "Join our competitive debate club and develop public speaking and critical thinking skills. Compete at regional and provincial levels.",
    category: "extracurricular",
    externalLink: "https://example.com/debate",
    submittedBy: "Debate Association",
    submitterEmail: "info@debateassoc.org",
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    level: "both",
    type: "in_person",
    duration: "long",
    isApproved: true,
  },
  {
    title: "Art Exhibition - Student Showcase",
    description:
      "Display your artwork in our annual student art exhibition. Open to all mediums including painting, sculpture, photography, and digital art.",
    category: "extracurricular",
    externalLink: "https://example.com/art-exhibition",
    submittedBy: "Arts Council",
    submitterEmail: "exhibitions@artscouncil.org",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    level: "both",
    type: "in_person",
    duration: "short",
    isApproved: true,
  },
  {
    title: "Music Festival - Waterloo Sounds",
    description:
      "Perform at Waterloo Sounds, our annual music festival celebrating local talent. All genres and skill levels welcome.",
    category: "extracurricular",
    externalLink: "https://example.com/music-festival",
    submittedBy: "Music Society",
    submitterEmail: "bookings@musicsociety.org",
    deadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    level: "both",
    type: "in_person",
    duration: "short",
    isApproved: true,
  },
];

async function seedDatabase() {
  console.log("🌱 Starting database seed...");
  console.log(`📋 Importing ${sampleOpportunities.length} sample opportunities...`);

  const result = await importFromArray(sampleOpportunities);

  console.log("\n✅ Seed completed!");
  console.log(`📊 Results: ${result.imported} imported, ${result.failed} failed`);

  if (result.errors.length > 0) {
    console.log("\n❌ Errors:");
    result.errors.forEach((err) => {
      console.log(`   Row ${err.row}: ${err.error}`);
    });
  }

  console.log(`\n📝 Message: ${result.message}`);
  process.exit(result.success ? 0 : 1);
}

seedDatabase().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
