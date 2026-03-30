-- LevelUp Waterloo: Opportunity Management SQL Scripts
-- Use these queries to manage opportunities in the database

-- ============================================================================
-- VIEWING OPPORTUNITIES
-- ============================================================================

-- View all opportunities with basic info
SELECT id, title, category, level, deadline, isApproved 
FROM opportunities 
ORDER BY deadline DESC;

-- View active opportunities only
SELECT id, title, category, level, deadline 
FROM opportunities 
WHERE isApproved = true 
ORDER BY deadline ASC;

-- View inactive opportunities
SELECT id, title, category, level, deadline 
FROM opportunities 
WHERE isApproved = false 
ORDER BY createdAt DESC;

-- View expired opportunities (past deadline)
SELECT id, title, category, deadline 
FROM opportunities 
WHERE deadline < NOW() 
ORDER BY deadline DESC;

-- View opportunities expiring soon (within 7 days)
SELECT id, title, category, deadline, isApproved 
FROM opportunities 
WHERE deadline BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
  AND isApproved = true 
ORDER BY deadline ASC;

-- View opportunities by category
SELECT category, COUNT(*) as count, 
       SUM(CASE WHEN isApproved = true THEN 1 ELSE 0 END) as active,
       SUM(CASE WHEN isApproved = false THEN 1 ELSE 0 END) as inactive
FROM opportunities 
GROUP BY category;

-- View opportunities by level
SELECT level, COUNT(*) as count 
FROM opportunities 
GROUP BY level;

-- ============================================================================
-- ADDING OPPORTUNITIES
-- ============================================================================

-- Add a single opportunity
INSERT INTO opportunities (
  title, description, category, level, type, duration,
  deadline, externalLink, submittedBy, submitterEmail, isApproved
) VALUES (
  'Waterloo Regional Science Olympiad',
  'Compete in 23 science and engineering events at the regional level. Teams of 15 students represent their school.',
  'stem_competition',
  'both',
  'in_person',
  'long',
  '2026-04-15',
  'https://www.scioly.org/wiki/index.php/Waterloo_Regional',
  'Admin',
  'admin@levelup.local',
  true
);

-- ============================================================================
-- UPDATING OPPORTUNITIES
-- ============================================================================

-- Update opportunity deadline
UPDATE opportunities 
SET deadline = '2026-05-01' 
WHERE id = 5;

-- Update opportunity link
UPDATE opportunities 
SET externalLink = 'https://new-link.com' 
WHERE id = 5;

-- Update opportunity description
UPDATE opportunities 
SET description = 'Updated description with new details' 
WHERE id = 5;

-- Activate an opportunity
UPDATE opportunities 
SET isApproved = true 
WHERE id = 5;

-- Update multiple opportunities in a category
UPDATE opportunities 
SET duration = 'short' 
WHERE category = 'volunteering' AND duration IS NULL;

-- ============================================================================
-- INACTIVATING OPPORTUNITIES (Soft Delete)
-- ============================================================================

-- Inactivate a single opportunity
UPDATE opportunities 
SET isApproved = false 
WHERE id = 5;

-- Inactivate all expired opportunities
UPDATE opportunities 
SET isApproved = false 
WHERE deadline < NOW() AND isApproved = true;

-- Inactivate all opportunities in a category
UPDATE opportunities 
SET isApproved = false 
WHERE category = 'grant';

-- Inactivate opportunities from a specific submitter
UPDATE opportunities 
SET isApproved = false 
WHERE submittedBy = 'Old Organization';

-- ============================================================================
-- DELETING OPPORTUNITIES (Hard Delete - Use with caution!)
-- ============================================================================

-- Delete a single opportunity (permanent)
DELETE FROM opportunities 
WHERE id = 5;

-- Delete all expired opportunities (permanent)
DELETE FROM opportunities 
WHERE deadline < NOW();

-- Delete all inactive opportunities older than 6 months
DELETE FROM opportunities 
WHERE isApproved = false 
  AND createdAt < DATE_SUB(NOW(), INTERVAL 6 MONTH);

-- ============================================================================
-- STATISTICS & REPORTING
-- ============================================================================

-- Overall statistics
SELECT 
  COUNT(*) as total_opportunities,
  SUM(CASE WHEN isApproved = true THEN 1 ELSE 0 END) as active,
  SUM(CASE WHEN isApproved = false THEN 1 ELSE 0 END) as inactive,
  SUM(CASE WHEN deadline < NOW() THEN 1 ELSE 0 END) as expired
FROM opportunities;

-- Statistics by category
SELECT 
  category,
  COUNT(*) as total,
  SUM(CASE WHEN isApproved = true THEN 1 ELSE 0 END) as active,
  SUM(CASE WHEN isApproved = false THEN 1 ELSE 0 END) as inactive,
  SUM(CASE WHEN deadline < NOW() THEN 1 ELSE 0 END) as expired
FROM opportunities 
GROUP BY category 
ORDER BY total DESC;

-- Statistics by level
SELECT 
  level,
  COUNT(*) as total,
  SUM(CASE WHEN isApproved = true THEN 1 ELSE 0 END) as active
FROM opportunities 
GROUP BY level;

-- Statistics by type
SELECT 
  type,
  COUNT(*) as total,
  SUM(CASE WHEN isApproved = true THEN 1 ELSE 0 END) as active
FROM opportunities 
GROUP BY type;

-- Most recent opportunities
SELECT id, title, category, createdAt 
FROM opportunities 
ORDER BY createdAt DESC 
LIMIT 10;

-- Opportunities by submitter
SELECT 
  submittedBy,
  COUNT(*) as total,
  SUM(CASE WHEN isApproved = true THEN 1 ELSE 0 END) as active
FROM opportunities 
GROUP BY submittedBy 
ORDER BY total DESC;

-- ============================================================================
-- MAINTENANCE TASKS
-- ============================================================================

-- Find duplicate opportunities (same title)
SELECT title, COUNT(*) as count 
FROM opportunities 
GROUP BY title 
HAVING count > 1;

-- Find opportunities with missing required fields
SELECT id, title, 
  CASE WHEN description = '' THEN 'Missing description' END as issue
FROM opportunities 
WHERE description = '' OR externalLink = '';

-- Find opportunities with invalid URLs
SELECT id, title, externalLink 
FROM opportunities 
WHERE externalLink NOT LIKE 'http%' OR externalLink = '';

-- Find opportunities with very short descriptions
SELECT id, title, LENGTH(description) as desc_length 
FROM opportunities 
WHERE LENGTH(description) < 20 
ORDER BY desc_length ASC;

-- ============================================================================
-- BULK OPERATIONS
-- ============================================================================

-- Activate all opportunities from a specific submitter
UPDATE opportunities 
SET isApproved = true 
WHERE submittedBy = 'Verified Organization';

-- Update all opportunities to have a minimum deadline
UPDATE opportunities 
SET deadline = '2026-06-01' 
WHERE deadline IS NULL;

-- Copy opportunities from one category to another (for testing)
INSERT INTO opportunities (
  title, description, category, level, type, duration,
  deadline, externalLink, submittedBy, submitterEmail, isApproved
)
SELECT 
  CONCAT(title, ' (Copy)'),
  description,
  'other',
  level,
  type,
  duration,
  deadline,
  externalLink,
  submittedBy,
  submitterEmail,
  false
FROM opportunities 
WHERE category = 'volunteering' 
LIMIT 5;

-- ============================================================================
-- ARCHIVAL & CLEANUP
-- ============================================================================

-- Archive old inactive opportunities (set them to very old date)
UPDATE opportunities 
SET deadline = '2020-01-01' 
WHERE isApproved = false 
  AND createdAt < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- Clean up test opportunities
DELETE FROM opportunities 
WHERE title LIKE '%test%' 
  OR title LIKE '%demo%' 
  OR submittedBy = 'Test User';

-- ============================================================================
-- USEFUL QUERIES FOR MONITORING
-- ============================================================================

-- Show opportunities that need attention (expiring soon or expired)
SELECT 
  id, title, deadline,
  CASE 
    WHEN deadline < NOW() THEN 'EXPIRED'
    WHEN deadline < DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 'EXPIRING SOON'
    ELSE 'OK'
  END as status,
  isApproved
FROM opportunities 
WHERE deadline < DATE_ADD(NOW(), INTERVAL 30 DAY)
ORDER BY deadline ASC;

-- Show health metrics
SELECT 
  'Total Opportunities' as metric, COUNT(*) as value FROM opportunities
UNION ALL
SELECT 'Active', COUNT(*) FROM opportunities WHERE isApproved = true
UNION ALL
SELECT 'Expired', COUNT(*) FROM opportunities WHERE deadline < NOW()
UNION ALL
SELECT 'Expiring in 7 days', COUNT(*) FROM opportunities 
  WHERE deadline BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
UNION ALL
SELECT 'Added this month', COUNT(*) FROM opportunities 
  WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 1 MONTH);
