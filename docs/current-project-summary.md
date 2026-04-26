# Current Project Summary

Last reviewed: 2026-04-18

## Overview

This repository is a `Next.js 16` App Router frontend for a product now most consistently branded in the UI as `SocialMetrics`.

The project is no longer just an analytics dashboard. It now has two distinct layers:

- a production-oriented analytics core already wired to backend APIs
- a newer operations layer with advanced SaaS workflows implemented in the frontend and currently backed by realistic mocked state

Today, the app includes:

- a shared authenticated dashboard shell with sidebar, topbar, theme toggle, sync overlay, and global AI assistant trigger
- production-oriented analytics for web traffic, social reporting, and revenue
- settings and Meta integration flows
- new operational product surfaces for scheduling, inbox, insights, campaigns, automation, AI assistance, and team management

The repository is not a blank scaffold. Several areas are clearly backend-integrated and operational. Several newer modules are intentionally designed as production-grade frontend workflows, but still need backend implementation to become fully real.

## Stack

- Framework: `Next.js 16.1.6`
- React: `19.2.3`
- Styling: `Tailwind CSS v4`
- Data fetching/cache: `@tanstack/react-query`
- Charts: `recharts`
- HTTP client: `axios`
- Icons: `lucide-react`
- Language: `TypeScript`

## App Structure

## Shell and routing

- Root route redirects to `/dashboard`.
- `src/app/layout.tsx` wraps the app with:
  - `ThemeProvider`
  - React Query provider
  - `AppLayoutWrapper`
- `AppLayoutWrapper`:
  - applies auth checks via `useAuth`
  - renders sidebar/topbar for authenticated pages
  - allows `/login`, `/privacy`, and `/terms` to render without app chrome
  - mounts a global floating AI assistant panel on authenticated pages
- Shared navigation currently exposes:
  - Dashboard
  - Web Traffic
  - Reports
  - Revenue
  - Schedule
  - Smart Inbox
  - Insights
  - Campaigns
  - Automation
  - Team
  - Settings

## Backend integration pattern

- `next.config.ts` rewrites frontend routes to a backend service:
  - `/api/*`
  - `/v1/*`
  - `/page-mappings/*`
  - `/health`
- `src/lib/api.ts` centralizes much of the analytics and mapping API access through a shared Axios client.
- The client sends `withCredentials: true`, so the app expects cookie-based auth.
- A `401` response redirects most pages to `/login`.

Important distinction:

- existing analytics and settings pages already rely on backend APIs
- the new operations modules live primarily in `src/features/ops/*` and are currently frontend-first with realistic mocked data and interactions

## Runtime configuration

The app expects runtime env configuration for:

- `NEXT_PUBLIC_API_URL`
- `BACKEND_URL`
- `NEXT_PUBLIC_META_APP_ID`
- `NEXT_PUBLIC_ANALYTICS_API_KEY`

Note: `.env` is populated locally, but sensitive values should not be copied into documentation shared outside the team.

## What Is Already Built

## 1. Authentication shell

Implemented:

- Login page UI at `/login`
- Client-side auth guard in `src/hooks/useAuth.ts`
- Logout flow in Settings
- Public legal pages for privacy and terms

Current limitation:

- The actual login API call is still bypassed in `src/app/login/page.tsx`.
- `loginUser(...)` is imported but commented out, and the page pushes directly to `/dashboard`.
- This means the login screen is visually complete, but auth is not fully enforced from the login form itself.

## 2. Dashboard

Route: `/dashboard`

Implemented:

- Dashboard overview cards for web traffic and social media
- Fetches headline web traffic metrics via `fetchHeadlines()`
- Fetches profile list and aggregate social metrics from backend endpoints
- Loading states and deep links into `/traffic` and `/reports`

Status:

- Real data-backed page
- Some supporting content is still static or presentation-oriented

## 3. Web Traffic analytics

Route: `/traffic`

This remains one of the strongest implemented modules in the project.

Implemented:

- Date filtering with presets
- Platform switching between Facebook and Threads
- Aggregated web traffic metrics:
  - sessions
  - users
  - pageviews
  - engagement
  - recurring users
  - identified users
- Headline summary metrics
- Country stats
- Campaign filtering
- Trend chart and metric distribution chart
- Detailed grouped table
- CSV export from the table
- Manual sync trigger
- React Query caching and invalidation

Data model/features:

- Uses aggregated analytics endpoints instead of raw row-heavy analytics where possible
- Merges analytics data with page mapping metadata
- Supports grouping by category and by team
- Supports team-level and page-level traffic analysis

Status:

- Real data-backed module

## 4. Web Traffic mappings management

Routes:

- Embedded inside `/traffic`
- Dedicated page at `/traffic/mappings`

Implemented:

- Fetch page mappings
- Create mapping entries
- Delete mapping entries
- Update mapping team assignments
- Batch update teams
- Upload page mappings CSV
- Upload legacy analytics CSV
- Create teams from unassigned pages
- Deduped page-level view for pages that have multiple UTM medium rows

Status:

- Data-backed and operational
- Some interactions still use browser `alert`, `confirm`, and `prompt`

## 5. Reports module

Route: `/reports`

This module is substantially implemented and uses backend data.

Implemented:

- Platform switch between Facebook and Instagram
- Profile selection with search and multi-select
- Page Insights tab set:
  - Overview
  - Profiles
  - Compare
- Post Insights view
- Error state surfacing for failed profile syncs

### Reports: Overview tab

Implemented:

- Aggregated metrics fetch for selected profiles and date range
- Metric cards and charts
- Custom date range picker
- CSV export
- Aggregated demographics fetch and display

### Reports: Profiles tab

Implemented:

- Single-profile analysis
- Comparison period handling
- Profile-level demographic fetch
- Charts and profile-specific metric breakdowns

### Reports: Compare tab

Implemented:

- Single-profile current vs comparison-period analysis
- Comparison modes
- Export support

### Reports: Post Insights

Implemented:

- Fetches post-level analytics from backend
- Grid/list modes
- Sorting
- Filtering by source, type, status, and author
- Pagination
- Multi-select UI

Status:

- Real data-backed module

## 6. Revenue analytics

Route: `/revenue`

This module is also significantly implemented.

Implemented:

- Revenue metric fetch by date range
- Team-wise and page-wise grouping
- Source-level revenue breakdown:
  - bonus
  - photo
  - reel
  - story
  - text
- Summary cards
- Pivot-style revenue tables
- CSV export
- Revenue charts with team/page progression views
- Filtering/search interactions

Status:

- Real data-backed analytics module

## 7. Revenue mappings management

Route: `/revenue/mappings`

Implemented:

- Fetch revenue mappings
- Update a page’s team
- Batch unassign/remove team relationships
- Create local team labels in UI
- Team and unassigned counts

Status:

- Backed by API
- Team creation is primarily a UI labeling workflow; team membership persists once assigned to pages

## 8. Schedule module

Route: `/schedule`

This route has been rebuilt into a much more serious operations module.

Implemented in the frontend:

- Monthly, weekly, and daily calendar modes
- Drag-and-drop post rescheduling
- Post detail side panel
- Modal-based post composer
- Draft vs scheduled save flows
- Multi-platform post model
- Approval owner and owner assignment
- Visual status states:
  - draft
  - review
  - approved
  - scheduled
  - published
  - failed
- Queue recommendation UI
- Retry and edit affordances

Status:

- High-fidelity frontend module
- Realistic workflows and state transitions exist
- Still using mocked data in `src/features/ops/data.ts`
- Backend persistence, approvals, publishing jobs, and Meta publishing are still pending

## 9. Smart Inbox module

Route: `/smart-box`

The old prototype inbox has been replaced with a more complete unified inbox experience.

Implemented in the frontend:

- Unified conversation list
- Search and filtering by:
  - platform
  - status
  - assigned user
  - priority
- Threaded conversation view
- Reply composer
- Internal notes
- Resolve and pending state transitions
- Right-rail customer context
- Quick reply templates
- AI reply affordance in UI

Status:

- High-fidelity frontend module
- Realistic support and engagement workflow
- Still using mocked thread and customer data
- Real thread ingestion, replies, assignment persistence, and webhook/polling backend are still pending

## 10. Alerts & Insights module

Route: `/insights`

Implemented in the frontend:

- Insight feed cards with severity and trend signals
- Alert rule list
- Create alert rule modal
- Toggle rule enabled state
- Notification channel UI for in-app and email

Status:

- High-fidelity frontend module
- Product direction is clear and UI is in place
- Still using mocked insight cards and rules
- Real rule evaluation, anomaly detection, notifications, and persistence are still pending

## 11. Campaign Management module

Route: `/campaigns`

Implemented in the frontend:

- Campaign list and detail drill-down
- Campaign creation modal
- Objective, budget, status, and date fields
- Campaign metric summary cards
- Timeline chart visualization
- Linked post display
- Asset list UI

Status:

- High-fidelity frontend module
- Strong structure for campaign lifecycle management
- Still using mocked campaigns and timeline data
- Real campaign persistence, asset storage, post linking, and performance aggregation are still pending

## 12. Automation module

Route: `/automation`

Implemented in the frontend:

- Template list
- Node-based workflow canvas
- Draggable nodes
- Visual connections between trigger, condition, and action nodes
- Save, simulate, and publish controls in UI

Status:

- High-fidelity frontend module
- Strong visual builder concept is implemented
- Still using mocked templates and local state only
- Real workflow persistence, versioning, trigger execution, and run logs are still pending

## 13. AI Assistant

Routes and entry points:

- Global floating assistant on authenticated pages
- Dedicated route at `/ai-assistant`

Implemented in the frontend:

- Contextual suggestions based on current route
- Chat-like panel UI
- Prompt submission
- Page-aware answer simulation
- Suggested-question shortcuts

Status:

- High-fidelity frontend module
- Strong UX pattern for contextual product assistance
- Currently returns simulated answers only
- Real grounded AI orchestration, context retrieval, and action execution are still pending

## 14. Team & Roles management

Route: `/team`

Implemented in the frontend:

- Member list
- Invite teammate modal
- Role selection:
  - Admin
  - Analyst
  - Content Manager
- Permission badge display
- Invite/active state display
- Audit log UI

Status:

- High-fidelity frontend module
- Good enterprise admin surface in the UI
- Still using mocked members and audit data
- Real invites, RBAC, workspace membership, and audit log persistence are still pending

## 15. Settings and integrations

Route: `/settings`

Implemented:

- Meta SDK bootstrap in the browser
- Connect Facebook Pages and Instagram accounts
- Fetch available pages/accounts from backend after Meta auth
- Confirm selected pages/accounts for import
- Check active connected profiles
- Manual sync handling and sync state display
- Disconnect flow with optional historical-data deletion
- Email report recipient management:
  - list recipients
  - add recipient
  - remove recipient
  - send test report
- Logout flow
- Links to privacy policy and terms

Status:

- Real integration-heavy settings page
- One of the most backend-dependent screens in the app

## 16. Debug utility

Route: `/debug`

Implemented:

- Lists Instagram profiles
- Fetches raw debug payload for a selected profile
- Displays returned JSON for inspection

Status:

- Internal utility page

## 17. Legal pages

Routes:

- `/privacy`
- `/terms`

Implemented:

- Full standalone legal content pages
- Accessible without authenticated app shell

## Shared Technical Notes

## State and caching

- React Query is set up globally in `src/app/providers.tsx`.
- Query defaults:
  - `staleTime`: 10 minutes
  - `refetchOnWindowFocus`: false
  - `retry`: 1
- The new operations modules currently manage most of their state locally in route-level components rather than through backend queries.

## Design system direction

- The app now has a more deliberate product-ops visual language for the new modules:
  - rounded surface cards
  - status chips
  - modal patterns
  - reusable UI primitives in `src/features/ops/components/primitives.tsx`
- Dark mode remains supported through `next-themes`.
- The newer modules are visually more cohesive than some older pages.

## Data processing

- `src/lib/api.ts` still contains substantial client-side shaping logic for analytics data.
- The new operations modules currently use seeded domain objects in `src/features/ops/data.ts`.

## Current Status by Area

Use this framing when describing the repo today:

- `production-oriented and backend-integrated`
  - Dashboard
  - Web Traffic
  - Traffic mappings
  - Reports
  - Revenue
  - Revenue mappings
  - Settings
  - Debug
- `high-fidelity frontend-first, backend still pending`
  - Schedule
  - Smart Inbox
  - Insights
  - Campaigns
  - Automation
  - AI Assistant
  - Team

## Current Gaps / Risks

These are the most important issues visible from the codebase right now:

1. Login is not fully connected.
   The login screen still bypasses the backend auth call and routes directly to `/dashboard`.

2. The new operations modules are not yet backed by real APIs.
   They look product-grade, but currently rely on mocked data and local state.

3. Analytics and operations are at different maturity levels.
   Existing analytics pages are far more backend-integrated than the new SaaS workflow modules.

4. Mixed implementation styles remain.
   Some pages use the shared Axios client in `src/lib/api.ts`, while others call `fetch(...)` directly.

5. Browser-native prompts still exist in older admin flows.
   Traffic and revenue mapping workflows still rely on `alert`, `confirm`, and `prompt`.

6. Documentation is in transition.
   The repo summary and backend planning docs now exist, but broader onboarding and API docs still need work.

7. The repo has a lint backlog outside the new modules.
   The newer ops files type-check cleanly, but the full repository still has many pre-existing lint issues in older code.

## Suggested Positioning When Sharing This Project

It is accurate to say the current project already includes:

- a working analytics dashboard shell
- web traffic analytics with mapping and import workflows
- social media reporting for Facebook and Instagram
- revenue analytics and page/team revenue grouping
- Meta connection and email report settings
- a substantial next-generation operations UI layer for scheduling, inbox, insights, campaigns, automation, AI, and team management

It is also accurate to clarify that:

- login completion is still pending
- the new operations modules are frontend-first and still need backend implementation
- some older admin interactions still need polish
- documentation is improving, but still catching up with the current product surface

## Recommended next documentation updates

If this repo is going to be shared with stakeholders or new developers, the next useful docs would be:

1. Replace the default `README.md` with product-specific setup and architecture notes.
2. Add an API contract summary for both the existing analytics endpoints and the planned `/api/ops/*` backend surface.
3. Add a route/status matrix marking each page as `production-backed`, `frontend-first`, or `internal`.
4. Document the required env vars without exposing local values.
5. Turn `docs/backend-ops-modules-plan.md` into a delivery backlog with schemas, DTOs, and milestone-level acceptance criteria.
