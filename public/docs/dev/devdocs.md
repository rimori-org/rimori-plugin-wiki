# Wiki - Developer Documentation

## Architecture

The wiki plugin follows the standard Rimori plugin architecture with React, TipTap for markdown editing, and Supabase for data persistence.

### Plugin ID

`pl1410555270`

### Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/wiki` | `WikiPage` | Main layout with tree sidebar + content area |
| `/wiki/:pageId` | `WikiPage` | View a specific page |
| `/wiki/:pageId/edit` | `WikiPage` | Edit mode (handled internally) |
| `/wiki/action` | `WikiPage` | Action-triggered entry point |
| `/sidebar/browse` | `BrowseSidebar` | Sidebar with private/public tabs |
| `/settings` | `SettingsPage` | Plugin settings |

## Database Schema

### Table: `pages`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (auto) | Primary key |
| `title` | text | Page title |
| `content` | text (nullable) | Markdown content |
| `description` | text (nullable) | Short description |
| `icon` | text (nullable) | Emoji/ASCII icon character |
| `parent_id` | uuid (nullable, FK → pages) | Parent page for tree hierarchy |
| `sort_order` | integer (default 0) | Sort order among siblings |
| `show_children` | boolean (default false) | Show child page list below content |
| `action_label` | text (nullable) | Label for study plan triggering |
| `guild_id` | text (auto) | Guild scoping (not null = private, null = public) |
| `created_by` | text (auto) | Creator's user ID |
| `created_at` | timestamp (auto) | Creation timestamp |

**Permissions**: `read: GUILD`, `insert: OWN`, `update: OWN`, `delete: OWN`

### Table: `comments`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (auto) | Primary key |
| `page_id` | uuid (FK → pages, cascade) | Parent page |
| `content` | text | Comment text |
| `created_by` | text (auto) | Commenter's user ID |
| `created_at` | timestamp (auto) | Creation timestamp |

**Permissions**: `read: GUILD`, `insert: GUILD`, `update: OWN`, `delete: OWN`

### Table: `reactions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (auto) | Primary key |
| `comment_id` | uuid (FK → comments, cascade) | Parent comment |
| `emoji` | text | Emoji character |
| `created_by` | text (auto) | Reactor's user ID |

**Permissions**: `read: GUILD`, `insert: GUILD`, `update: OWN`, `delete: OWN`

## Guild ID Semantics

The `guild_id` column controls visibility:

- **`guild_id` is NOT null** → Page is **private**. It is scoped to the user's personal guild. Only the user (and guild members) can see it. Every user has a private guild by default, so newly created pages are private.
- **`guild_id` is null** → Page is **public**. It is visible to everyone.

To publish a page, set `guild_id` to `null`. To make it private again, set `guild_id` back to the user's guild ID (obtained via `onRimoriInfoUpdate`).

## Components

### `WikiTree` (`src/components/WikiTree.tsx`)
Recursive tree component with context menu actions. Renders `TreeNodeItem` for each node with expand/collapse, selection, and right-click context menu.

### `PageViewer` (`src/components/PageViewer.tsx`)
Read-only page display with breadcrumb trail, content rendered through `t()` for translation, status badge (private/public), and optional child page listing.

### `PageEditor` (`src/components/PageEditor.tsx`)
Edit form with icon picker, title/description inputs, parent page selector, show_children toggle, action label field, and the TipTap markdown editor.

### `MarkdownEditor` (`src/components/MarkdownEditor.tsx`)
TipTap-based rich text editor with markdown serialization. Same implementation as the flashcards plugin. Supports read-only and editable modes.

### `CommentsSection` (`src/components/CommentsSection.tsx`)
Comment list with add/delete functionality. Each comment renders a `ReactionBar`.

### `ReactionBar` (`src/components/ReactionBar.tsx`)
Emoji reaction display and picker. Available emojis: 👍 ❤️ 😄 🎉 🤔 👀. Users can toggle their own reactions.

## Hooks

### `useWikiPages(mode: 'private' | 'public')`
Fetches pages filtered by mode, builds the tree structure, and provides utility functions:
- `tree` - Built tree nodes
- `toggleExpanded(pageId)` - Toggle tree node
- `expandToPage(pageId)` - Expand all ancestors
- `getBreadcrumb(pageId)` - Get path from root to page
- `getPage(pageId)` - Find a page by ID
- `getChildren(pageId)` - Get child pages
- `refetch()` - Reload pages

## Action System

The plugin defines a triggerable action `wiki_page` with parameter `page_id`. When triggered (e.g. by the study plan), the `WikiPage` component listens via `onMainPanelAction` and navigates to the specified page.

Pages with an `action_label` set can be discovered by the study plan's AI to generate reading exercises.

## Content Translation

Page content is passed through the `t()` function from `useTranslation()` before rendering. This allows the platform's translation system to handle content localization.
