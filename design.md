# LevelUp Waterloo - App Design Document

## Overview

LevelUp Waterloo is a mobile/web app that centralizes extracurricular activities, grants, STEM competitions, sports, volunteering, and other opportunities for middle and high school students in the Waterloo region. The app helps students discover and engage with local opportunities that match their interests and skill levels.

## Screen List

1. **Home Screen** - Browse and filter opportunities by category
2. **Opportunity Detail Screen** - View full details of a specific opportunity
3. **Search Screen** - Search for opportunities by keyword
4. **Saved/Favorites Screen** - View bookmarked opportunities
5. **Profile Screen** - User profile and preferences

## Primary Content and Functionality

### Home Screen
- **Header**: App title "LevelUp Waterloo" with tagline
- **Category Filter**: Horizontal scrollable category pills
  - All
  - Closing Soon
  - Extracurricular
  - Sports
  - **Volunteering** (NEW)
  - Grants
  - STEM
  - Other
- **Opportunities List**: Vertical list of opportunity cards showing:
  - Title
  - Brief description
  - Level badge (Both, Middle School, High School)
  - Type badge (In-Person, Online, Hybrid)
  - Duration badge (Short, Medium, Long)
  - "Learn More" button linking to external resource

### Opportunity Detail Screen
- Full opportunity title and description
- Organization/provider information
- Level and type information
- Deadline (if applicable)
- External link to apply/learn more
- Share button
- Save/bookmark button

### Search Screen
- Search bar at top
- Recent searches
- Search results filtered by keyword
- Category filter applied to search results

### Saved Screen
- List of bookmarked opportunities
- Ability to remove from saved
- Filter by category
- Empty state if no saved opportunities

### Profile Screen
- User information (if logged in)
- Preferred categories/interests
- Saved opportunities count
- Settings and preferences

## Key User Flows

### Flow 1: Browse Opportunities
1. User opens app → Home Screen
2. User sees all opportunities
3. User taps category filter (e.g., "Volunteering")
4. App displays filtered opportunities
5. User taps opportunity card → Detail Screen
6. User reads full details
7. User taps "Learn More" → External link opens

### Flow 2: Search for Opportunities
1. User taps Search tab
2. User types keyword (e.g., "tutoring")
3. App shows matching opportunities
4. User filters by category if desired
5. User taps opportunity → Detail Screen

### Flow 3: Save Favorite Opportunity
1. User views opportunity detail
2. User taps bookmark/save button
3. Opportunity added to Saved list
4. User can access saved opportunities from Saved tab

## Color Choices

The app uses a professional, accessible color scheme aligned with iOS HIG:

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|----------|-------|
| **Primary** | #0a7ea4 | #0a7ea4 | Buttons, active states, highlights |
| **Background** | #ffffff | #151718 | Screen backgrounds |
| **Surface** | #f5f5f5 | #1e2022 | Cards, elevated surfaces |
| **Foreground** | #11181C | #ECEDEE | Primary text |
| **Muted** | #687076 | #9BA1A6 | Secondary text, descriptions |
| **Border** | #E5E7EB | #334155 | Dividers, card borders |
| **Success** | #22C55E | #4ADE80 | Success states |
| **Warning** | #F59E0B | #FBBF24 | Warning states |
| **Error** | #EF4444 | #F87171 | Error states |

## Typography

- **Headings**: Bold, large font (24-32pt)
- **Subheadings**: Semibold, medium font (18-20pt)
- **Body Text**: Regular, standard font (16pt)
- **Secondary Text**: Regular, smaller font (14pt)
- **Labels**: Medium, small font (12pt)

## Layout Principles

- **Mobile-First**: Designed for portrait orientation (9:16)
- **One-Handed Usage**: Interactive elements positioned within thumb reach
- **Spacing**: Consistent 4pt/8pt/16pt grid
- **Safe Area**: Content respects notches and home indicators
- **Scrolling**: Vertical scrolling for lists, horizontal for category filters

## Interaction Design

- **Category Filters**: Tap to filter, visual feedback with color change
- **Opportunity Cards**: Tap to view details, subtle opacity change on press
- **Buttons**: Scale feedback (0.97) on press with haptic feedback
- **Lists**: Smooth scrolling with FlatList for performance
- **Badges**: Non-interactive labels showing metadata

## Accessibility

- All text has sufficient contrast ratios
- Interactive elements have minimum 44pt touch targets
- Color is not the only indicator (uses text labels + colors)
- Semantic HTML/React Native components used
- Support for dark mode

## Technical Notes

- Built with React Native, Expo SDK 54
- Styled with NativeWind (Tailwind CSS)
- Database: MySQL with Drizzle ORM
- API: tRPC for type-safe backend communication
- State: React Context + useState for local state
- Data: 12 volunteering opportunities seeded in database
