# Backend Plan for New Product Operations Modules

Last reviewed: 2026-04-17

## Purpose

This document defines the backend work required to support the newly added frontend modules that expand SocialMetrics from a reporting dashboard into an operational platform.

These modules are:

- `/schedule`
- `/smart-box`
- `/insights`
- `/campaigns`
- `/automation`
- `/ai-assistant`
- `/team`

This document is intentionally scoped to backend requirements for the new modules only. It does not re-specify the existing traffic, reports, revenue, page mapping, or Meta connection backend that already exists.

## Why this backend work is needed

The frontend currently implements realistic mocked workflows for:

- content planning and approvals
- campaign management
- team membership and role-based collaboration
- unified inbox operations
- alert rules and insight feeds
- no-code automation templates
- contextual AI guidance

To make these modules production-grade, the backend must provide:

- persistent domain entities
- list/detail/query APIs
- workflow/state transitions
- background jobs
- event ingestion and event-driven automation
- permissions and audit logging
- notifications
- AI orchestration endpoints

## High-level backend goals

The new backend layer should:

1. Persist work objects created by operators, not just analytics facts.
2. Reuse the existing analytics and revenue data to power alerts, insights, and AI answers.
3. Be event-driven where possible so scheduling, inbox updates, and automations do not depend on page refreshes.
4. Support tenant/workspace isolation from day one.
5. Be designed so phase 1 can ship quickly with mocked external publishing/reply actions where needed.

## Core domain model

The frontend changes imply these new backend domains.

### 1. Workspace users and roles

Entities:

- `workspace_users`
- `workspace_invites`
- `roles`
- `permissions`
- `audit_logs`

Core fields:

- user id
- workspace id
- name
- email
- role
- status: `invited | active | suspended`
- permission set
- last active at
- invited by
- accepted at

### 2. Content scheduling

Entities:

- `content_posts`
- `content_post_platforms`
- `content_media_assets`
- `content_post_approvals`
- `content_publish_attempts`
- `content_queue_slots`

Core fields:

- post id
- workspace id
- title
- caption
- hashtags
- platforms
- media type
- media asset reference
- owner user id
- approval owner user id
- campaign id nullable
- scheduled at
- status: `draft | review | approved | scheduled | published | failed`
- published external ids per platform
- publish error details

### 3. Smart inbox

Entities:

- `inbox_contacts`
- `inbox_threads`
- `inbox_messages`
- `inbox_notes`
- `inbox_assignments`
- `inbox_tags`
- `inbox_message_events`

Core fields:

- thread id
- workspace id
- platform
- external thread id
- contact id
- assigned user id
- status: `open | pending | resolved`
- priority: `low | medium | high | urgent`
- tags
- last message at
- last response at
- last sentiment nullable
- source metadata such as comment, mention, DM

### 4. Insights and alerts

Entities:

- `alert_rules`
- `alert_deliveries`
- `insight_cards`
- `insight_runs`
- `notification_preferences`
- `in_app_notifications`

Core fields:

- rule id
- workspace id
- metric family
- condition operator
- threshold value
- time window
- notification channels
- enabled
- last evaluated at
- last triggered at
- insight type
- severity: `positive | warning | critical | neutral`
- payload and explanation

### 5. Campaign management

Entities:

- `campaigns`
- `campaign_assets`
- `campaign_post_links`
- `campaign_metrics_snapshots`

Core fields:

- campaign id
- workspace id
- name
- objective
- status: `draft | active | completed`
- platforms
- budget
- spend
- start and end dates
- linked post ids
- metrics snapshot by date

### 6. Automation workflows

Entities:

- `automation_workflows`
- `automation_workflow_versions`
- `automation_nodes`
- `automation_edges`
- `automation_runs`
- `automation_run_logs`
- `automation_templates`

Core fields:

- workflow id
- workspace id
- name
- status: `draft | active | paused`
- graph definition
- trigger type
- condition config
- action config
- version
- published at
- last run status

### 7. AI assistant

Entities:

- `ai_conversations`
- `ai_messages`
- `ai_context_snapshots`
- `ai_action_logs`

Core fields:

- conversation id
- workspace id
- user id
- page context
- prompt
- response
- cited source data references
- requested actions
- execution status

## Cross-cutting backend requirements

These are required across multiple modules.

### Authentication and authorization

Required changes:

- complete the login flow already stubbed in the frontend
- add workspace-aware identity to every new route
- implement role-based permission checks for:
  - content approvals
  - campaign management
  - inbox reply/resolve
  - automation publishing
  - team invites and role updates

Suggested permission keys:

- `schedule.read`
- `schedule.write`
- `schedule.approve`
- `inbox.read`
- `inbox.reply`
- `inbox.assign`
- `campaigns.read`
- `campaigns.write`
- `alerts.read`
- `alerts.write`
- `automation.read`
- `automation.write`
- `team.read`
- `team.manage`
- `ai.assist`

### Tenant isolation

Every new table and endpoint should be keyed by `workspace_id`.

This matters because:

- campaigns and schedules are workspace-specific
- inbox threads must not leak across clients/accounts
- alerts depend on workspace analytics sources
- AI answers must only use the current workspace context

### Audit logging

Audit events should be emitted for:

- post create/update/delete
- approval transitions
- publish retries
- inbox assignment/status changes
- manual replies and notes
- alert rule create/update/delete
- campaign create/update/status change
- workflow publish/pause
- team invite/role change

### Realtime or near-realtime delivery

Preferred:

- WebSocket or SSE for:
  - inbox thread updates
  - in-app notifications
  - publish status changes
  - automation run results

Fallback for phase 1:

- polling endpoints with `updated_since`

### Background jobs

A job runner is required for:

- scheduled publishing
- publish retries
- alert evaluation
- insight generation
- automation trigger handling
- email notifications
- AI precomputation or summarization jobs

If the backend does not already have a queue system, this should be introduced before building beyond CRUD.

## Module-by-module backend requirements

## 1. Content Scheduling Module

### Frontend behaviors that need backend support

- list posts for month/week/day calendar views
- drag-and-drop rescheduling
- create post in modal composer
- draft vs scheduled save modes
- multi-platform posts
- approval owner and owner assignment
- retry failed publish
- queue recommendation surface

### Required APIs

Suggested endpoints:

- `GET /api/ops/schedule/posts`
  - filters: `start`, `end`, `status`, `platform`, `ownerId`, `campaignId`
- `GET /api/ops/schedule/posts/:id`
- `POST /api/ops/schedule/posts`
- `PATCH /api/ops/schedule/posts/:id`
- `PATCH /api/ops/schedule/posts/:id/reschedule`
- `PATCH /api/ops/schedule/posts/:id/status`
- `POST /api/ops/schedule/posts/:id/approve`
- `POST /api/ops/schedule/posts/:id/request-review`
- `POST /api/ops/schedule/posts/:id/publish`
- `POST /api/ops/schedule/posts/:id/retry`
- `GET /api/ops/schedule/queue/recommendations`
- `POST /api/ops/schedule/queue/bulk-assign`

### Required backend logic

- validate that scheduled time is in the future for scheduled posts
- enforce approval workflow if workspace settings require it
- persist per-platform publish targets and publish attempts
- support optimistic rescheduling without losing approval state
- create publish jobs for scheduled items

### External integrations

- Meta publishing for Facebook and Instagram
- media asset storage and retrieval

### Phase 1 simplification

- support full CRUD and status transitions
- store publish intent and simulate publish jobs if Meta publishing is not ready

## 2. Smart Inbox Module

### Frontend behaviors that need backend support

- list filtered threads
- view full thread
- reply to thread
- add internal notes
- mark resolved/pending
- assign user
- quick customer history panel
- future AI-assisted reply generation

### Required APIs

- `GET /api/ops/inbox/threads`
  - filters: `platform`, `status`, `assignedTo`, `priority`, `search`, `updatedSince`
- `GET /api/ops/inbox/threads/:id`
- `PATCH /api/ops/inbox/threads/:id`
  - status, priority, assignee
- `POST /api/ops/inbox/threads/:id/replies`
- `POST /api/ops/inbox/threads/:id/notes`
- `POST /api/ops/inbox/threads/:id/resolve`
- `POST /api/ops/inbox/threads/:id/reopen`
- `GET /api/ops/inbox/contacts/:id`
- `GET /api/ops/inbox/templates`
- `POST /api/ops/inbox/ai/suggest-reply`

### Required backend logic

- normalize incoming events from Facebook and Instagram into one thread model
- maintain unread/open/resolved state
- maintain assignment and SLA timestamps
- expose derived customer history fields used in the right rail

### External integrations

- Meta messaging/comment webhooks
- outbound reply APIs

### Phase 1 simplification

- ingest from polling job or manual sync if webhooks are not ready
- allow replies only where platform permissions already exist
- treat unsupported channels as read-only threads

## 3. Alerts & Insights Module

### Frontend behaviors that need backend support

- list insight cards
- create and toggle alert rules
- track notification channels
- visually mark severity and trend

### Required APIs

- `GET /api/ops/insights/feed`
  - filters: `severity`, `type`, `start`, `end`
- `GET /api/ops/alerts/rules`
- `POST /api/ops/alerts/rules`
- `PATCH /api/ops/alerts/rules/:id`
- `DELETE /api/ops/alerts/rules/:id`
- `POST /api/ops/alerts/rules/:id/toggle`
- `GET /api/ops/notifications`
- `POST /api/ops/notifications/preferences`

### Required backend logic

- evaluate rules against existing analytics and revenue aggregates
- generate insight cards from:
  - traffic deltas
  - revenue anomalies
  - engagement changes
  - missed scheduled posts
  - top-performing content
- deduplicate repeat alerts
- persist notification delivery state

### Dependencies on existing backend

- current traffic aggregates
- current revenue aggregates
- current reports/profile aggregates
- future schedule publish outcomes

### Phase 1 simplification

- run rule evaluation on a scheduled interval
- create daily or hourly insight snapshots instead of fully streaming insights

## 4. Campaign Management Module

### Frontend behaviors that need backend support

- create campaigns
- list and select campaigns
- view summary stats
- link posts to campaigns
- attach assets
- show timeline metrics

### Required APIs

- `GET /api/ops/campaigns`
- `GET /api/ops/campaigns/:id`
- `POST /api/ops/campaigns`
- `PATCH /api/ops/campaigns/:id`
- `PATCH /api/ops/campaigns/:id/status`
- `POST /api/ops/campaigns/:id/assets`
- `POST /api/ops/campaigns/:id/posts`
- `DELETE /api/ops/campaigns/:id/posts/:postId`
- `GET /api/ops/campaigns/:id/metrics`

### Required backend logic

- join campaigns to scheduled/published posts
- compute campaign-level performance from:
  - linked social posts
  - traffic campaign data where available
  - revenue attribution where available
- snapshot metrics by day or week to keep dashboard queries fast

### Dependency question to resolve

We need to decide whether campaign attribution is:

1. manually linked only
2. inferred from UTM campaign names
3. hybrid manual plus inferred

Recommended:

- phase 1 use hybrid linking

## 5. Automation Workflows Module

### Frontend behaviors that need backend support

- save workflow graph
- publish workflow
- run simulation
- apply templates
- execute triggers, conditions, and actions

### Required APIs

- `GET /api/ops/automation/templates`
- `GET /api/ops/automation/workflows`
- `GET /api/ops/automation/workflows/:id`
- `POST /api/ops/automation/workflows`
- `PATCH /api/ops/automation/workflows/:id`
- `POST /api/ops/automation/workflows/:id/publish`
- `POST /api/ops/automation/workflows/:id/pause`
- `POST /api/ops/automation/workflows/:id/simulate`
- `GET /api/ops/automation/workflows/:id/runs`

### Required backend logic

- store node graph and version it
- validate allowed trigger-condition-action combinations
- subscribe workflows to event bus topics
- execute actions idempotently
- record per-step logs for debugging

### Example trigger sources

- new inbox message
- new comment
- post published
- engagement threshold crossed
- alert rule fired

### Example actions

- assign inbox thread
- create in-app notification
- create scheduled task/post
- link post to campaign
- send email

### Phase 1 simplification

- support a constrained automation catalog instead of arbitrary scripting
- only allow supported node types from a whitelist

## 6. AI Assistant Module

### Frontend behaviors that need backend support

- ask free-form questions
- send page context
- return recommendations
- eventually trigger actions like reschedule, boost, notify, assign

### Required APIs

- `POST /api/ops/ai/query`
- `GET /api/ops/ai/conversations`
- `GET /api/ops/ai/conversations/:id`
- `POST /api/ops/ai/conversations/:id/messages`
- optional later: `POST /api/ops/ai/actions/:actionKey/execute`

### Required backend orchestration

- accept the current route or module context
- gather supporting data from existing analytics services and new ops entities
- format a grounded prompt
- return:
  - answer text
  - suggested actions
  - source references
  - optional structured follow-up actions

### Strong recommendation

Do not let the assistant query raw databases directly from the model layer.

Instead:

- create backend tool functions or service methods for:
  - traffic summary
  - reports summary
  - revenue summary
  - schedule gaps
  - inbox risk threads
  - campaign performance
  - alert rule health

This keeps answers auditable and safe.

### Phase 1 simplification

- read-only answers first
- no auto-executed actions until permissions and audit logging are proven

## 7. Team & Roles Module

### Frontend behaviors that need backend support

- list members
- invite user
- assign roles
- view audit log
- show role permission summaries

### Required APIs

- `GET /api/ops/team/members`
- `POST /api/ops/team/invites`
- `PATCH /api/ops/team/members/:id/role`
- `PATCH /api/ops/team/members/:id/status`
- `GET /api/ops/team/roles`
- `GET /api/ops/team/audit-log`

### Required backend logic

- invite token flow
- role assignment and permission propagation
- audit log query filters
- workspace-level membership enforcement

### Dependency on current auth

This module should not ship fully until login/auth is properly completed.

## Suggested API shape

To keep the new surface consistent, all new modules should live under one namespace:

- `/api/ops/...`

This avoids mixing them into older analytics endpoints and keeps ownership clear.

Suggested service breakdown:

- `OpsScheduleModule`
- `OpsInboxModule`
- `OpsInsightsModule`
- `OpsCampaignsModule`
- `OpsAutomationModule`
- `OpsAiModule`
- `OpsTeamModule`

## Suggested event bus topics

The backend will benefit from an internal event model.

Suggested events:

- `content.post.created`
- `content.post.updated`
- `content.post.status_changed`
- `content.post.publish_succeeded`
- `content.post.publish_failed`
- `inbox.thread.created`
- `inbox.thread.updated`
- `inbox.reply.sent`
- `alert.rule.triggered`
- `campaign.created`
- `campaign.updated`
- `automation.workflow.published`
- `automation.run.completed`

These events should feed:

- notifications
- automation execution
- audit logs
- insight generation
- AI context summaries

## Data storage recommendations

Recommended persistence split:

- relational DB for core entities and workflow state
- object storage for uploaded media and creative assets
- queue system for jobs
- cache for short-lived insight or AI context aggregates

Suggested tables that can be added first:

- `workspace_users`
- `workspace_invites`
- `audit_logs`
- `content_posts`
- `content_post_approvals`
- `content_publish_attempts`
- `campaigns`
- `campaign_post_links`
- `alert_rules`
- `in_app_notifications`

Then later:

- inbox entities
- automation entities
- AI conversation entities

## Security and compliance concerns

Important backend concerns:

- inbox data may contain personally identifiable information
- audit logs must be immutable enough for admin review
- AI responses must not leak data across workspaces
- media uploads need validation and access control
- role changes should be restricted to admins
- outbound publishing/reply actions must be idempotent and traceable

## Recommended implementation order

This is the order that matches the frontend and reduces backend risk.

### Phase 0: Foundation

- finish login/auth integration
- add workspace membership model
- add role and permission checks
- add audit log framework
- add `/api/ops` namespace

### Phase 1: Lowest-friction persistence

- schedule CRUD and status transitions
- campaign CRUD and post linking
- team members, invites, and audit log

Why first:

- these are mostly internal state models
- they do not require real-time external ingestion to feel useful

### Phase 2: Signals layer

- alert rules
- insight feed generation
- in-app notifications

Why second:

- it leverages already existing analytics data
- it increases stickiness quickly

### Phase 3: Inbox

- thread/contact/message persistence
- assignment/status/note/reply APIs
- polling-based sync
- later webhook ingestion

Why third:

- inbox has the most external integration complexity

### Phase 4: Automation

- workflow persistence
- limited template execution
- run logs and simulation

Why fourth:

- automation becomes much more valuable once schedule, alerts, and inbox events exist

### Phase 5: AI Assistant

- grounded query endpoint
- page-aware context assembly
- suggested actions
- later safe action execution

Why fifth:

- AI should sit on top of stable operational primitives, not replace them

## Recommended first implementation slice

If we want a practical first milestone that matches the current frontend, I recommend this exact backend slice:

1. Team and role foundation
2. Schedule post CRUD plus approval/status transitions
3. Campaign CRUD plus post linking
4. Alert rules CRUD plus basic insight feed

That slice would make the following routes partially real very quickly:

- `/schedule`
- `/campaigns`
- `/insights`
- `/team`

It also lays the base for `/automation` and `/ai-assistant`.

## Open product and backend decisions

These should be resolved before implementation starts.

1. Should scheduled publishing actually execute in phase 1, or should phase 1 only persist publish intent and simulated job status?
2. For Smart Inbox, do we want true webhook ingestion immediately, or is polling-based ingestion acceptable for first release?
3. Should campaign performance be manually linked, UTM-derived, or hybrid?
4. Do we want role-permission management to be fixed presets at first, or fully customizable permissions?
5. Should the AI assistant be read-only at launch?
6. Which backend stack component will run scheduled jobs and event processing?

## Proposed next planning step

After approving this document, the next useful step is to convert it into an implementation backlog with:

- concrete database schemas
- DTOs and validation rules
- endpoint contracts
- module-by-module delivery phases
- acceptance criteria for the first backend milestone

That backlog should be created before code implementation begins.
