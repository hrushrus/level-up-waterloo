# LevelUp Waterloo - Project TODO

## Database & Schema
- [x] Create opportunities table with category enum
- [x] Create submissions table with category enum
- [x] Create userInterests table with category enum
- [x] Add "volunteering" to all category enums
- [x] Run database migration (pnpm db:push)

## Volunteering Opportunities Data
- [x] Create seed script with 12 volunteering opportunities
- [x] Seed Waterloo Food Bank - Youth Volunteer Program
- [x] Seed Waterloo Public Library - Teen Volunteer
- [x] Seed Kitchener-Waterloo Humane Society - Animal Care Volunteer
- [x] Seed Waterloo Region Habitat for Humanity - Youth Build
- [x] Seed Waterloo Community Tutoring - Student Tutor
- [x] Seed Waterloo Region Youth Mentorship Program
- [x] Seed Waterloo Environmental Action - Trail Maintenance
- [x] Seed Waterloo Community Health Centre - Volunteer
- [x] Seed Waterloo Seniors' Support Program - Teen Volunteer
- [x] Seed Waterloo Youth Crisis Line - Peer Support Volunteer
- [x] Seed Waterloo Community Garden - Garden Volunteer
- [x] Seed Waterloo Sports for All - Volunteer Coach

## Home Screen UI
- [x] Add "Volunteering" to category filter list
- [x] Display all categories in horizontal scrollable filter
- [x] Implement category filtering functionality
- [x] Display opportunities as cards with metadata
- [x] Show level, type, and duration badges
- [x] Add "Learn More" button with external link support
- [x] Handle empty state when no opportunities match filter

## Testing
- [x] Create volunteering opportunities test suite
- [x] Test that 12 volunteering opportunities were seeded
- [x] Test that all opportunities have required fields
- [x] Test that specific opportunities exist
- [x] Test level assignments (both, middle_school, high_school)
- [x] Test type assignments (in_person, online, hybrid)
- [x] Run all tests and verify passing

## Documentation
- [x] Create design.md with screen list and user flows
- [x] Document color choices and typography
- [x] Document layout principles and interaction design
- [x] Create this todo.md file

## Future Features (Not in Scope)
- [ ] User authentication and profiles
- [ ] Save/bookmark opportunities
- [ ] Search functionality
- [ ] Push notifications
- [ ] Advanced filtering and sorting
- [ ] User submissions/applications
- [ ] Admin panel for opportunity management
- [ ] Analytics and tracking


## Backend API (tRPC)
- [x] Create tRPC procedure to list all opportunities
- [x] Create tRPC procedure to filter opportunities by category
- [x] Create tRPC procedure to search opportunities by keyword
- [x] Add database query helpers in server/db.ts
- [x] Test tRPC procedures

## Search Functionality
- [x] Create search screen component
- [x] Implement search input with debouncing
- [x] Add search results display
- [x] Integrate search with tRPC backend
- [x] Add recent searches tracking
- [x] Test search functionality

## Home Screen Integration
- [x] Replace mock data with tRPC queries
- [x] Add loading states
- [x] Add error handling
- [x] Test home screen with real data


## Opportunity Detail Screen
- [x] Create detail screen component
- [x] Display full opportunity information
- [x] Show deadline countdown
- [x] Add "Learn More" button with external link
- [x] Add share button
- [x] Test detail screen

## Save/Bookmark Feature
- [x] Create bookmark context/state management
- [x] Add heart icon to opportunity cards
- [x] Implement save to AsyncStorage
- [x] Create Saved tab screen
- [x] Display saved opportunities
- [x] Add remove from saved functionality
- [x] Test bookmark feature

## Advanced Filtering & Sorting
- [x] Add filter panel to home screen
- [x] Implement level filter (both, middle_school, high_school)
- [x] Implement type filter (in_person, online, hybrid)
- [x] Implement duration filter (short, medium, long)
- [x] Add sorting options (newest, deadline, alphabetical)
- [x] Update home screen to use filters
- [x] Test filtering and sorting

## Admin Dashboard
- [ ] Create admin tRPC procedures (add, edit, inactivate, list all opportunities)
- [ ] Build admin authentication/authorization
- [ ] Create admin dashboard React components
- [ ] Implement opportunity form (add/edit)
- [ ] Implement opportunities list with actions
- [ ] Add inactivate/delete functionality
- [ ] Create admin dashboard page
- [ ] Test admin dashboard
- [ ] Document admin dashboard usage

## Admin Dashboard (Completed)
- [x] Create admin tRPC procedures (add, edit, inactivate, list all opportunities)
- [x] Build admin dashboard React components
- [x] Implement opportunity form (add/edit)
- [x] Implement opportunities list with actions
- [x] Add inactivate/delete functionality
- [x] Create admin dashboard page
- [x] Test admin dashboard

## Admin Dashboard Authentication (Completed)
- [x] Implement adminProcedure middleware for protected endpoints
- [x] Add authentication checks to admin dashboard UI
- [x] Show error messages for unauthorized access
- [x] Redirect unauthenticated users
- [x] Display user info in admin dashboard
- [x] Only enable queries for admin users


## Deadline Reminder Emails
- [x] Create email notification tracking table
- [x] Design email template for deadline reminders
- [x] Create email service for sending notifications
- [x] Build scheduler to find expiring bookmarked opportunities
- [x] Implement email sending logic
- [x] Add tests for email notification system
- [x] Document email setup and configuration


## Programmatic Data Import
- [x] Create CSV import utility
- [x] Build bulk import API endpoint
- [x] Create seed data script for development
- [x] Add validation for imported data
- [x] Document import procedures
- [x] Test import with sample data


## Search and Bookmarking Features
- [x] Add search bar to home screen
- [x] Implement search filtering by title and description
- [x] Enhance bookmark persistence with AsyncStorage
- [x] Create bookmarks/saved opportunities tab
- [x] Add bookmark count display
- [x] Test search and bookmark functionality


## Opportunity Sharing
- [x] Create opportunity detail screen
- [x] Add share button to opportunity cards and detail screen
- [x] Implement native sharing with Expo Sharing API
- [x] Add deep link support for shared opportunities
- [x] Test sharing on iOS and Android


## Advanced Filtering & Search
- [ ] Create filter context and state management
- [ ] Build filter UI components (deadline, commitment, location, pay, level)
- [ ] Implement filter logic in API
- [ ] Add saved filter presets
- [ ] Create filter UI on home screen
- [ ] Test filtering functionality
