# Wiki - User Guide

## Creating Pages

Click **"New Page"** at the top of the tree sidebar to create a root-level page. To create a subpage, right-click an existing page and select **"Add subpage"**.

Each page has:
- **Icon** - An emoji or ASCII character displayed in the tree (e.g. 📖, ⚙, ★)
- **Title** - The page name shown in the tree and as a heading
- **Description** - An optional subtitle shown below the title
- **Content** - The main body, written in markdown

## Editing Pages

Click the **edit button** (pencil icon) on a page to open the editor. The editor provides a toolbar with formatting options:

- **Text**: Bold, italic, strikethrough, inline code
- **Structure**: Paragraphs, headings (H1-H3)
- **Lists**: Bullet lists, numbered lists
- **Blocks**: Code blocks, blockquotes

Click **Save** when done, or **Cancel** to discard changes.

## Organizing Pages

Pages are arranged in a tree structure. You can:

- **Move a page** - Right-click a page and select "Move", or use the parent page dropdown in the editor
- **Reorder** - Set the sort order in the editor to control the position among siblings
- **Show subpages** - Toggle "Show subpages list below content" in the editor to display a list of child pages at the bottom of the page

The **breadcrumb trail** at the top of each page shows the full path from root to the current page. Click any breadcrumb to navigate up.

## Private vs Public Pages

All pages you create start as **private** - only you can see them. They are stored in your personal guild.

To **publish** a page (make it public):
- Right-click the page in the tree and select "Publish"
- Or click the globe/lock icon on the page viewer

Published pages have `guild_id` set to `null`, making them visible to everyone. You can still edit your own published pages. To make a page private again, select "Unpublish".

Switch between the **"My Pages"** and **"Public"** tabs to browse private and public pages separately.

## Comments and Reactions

Below each page, there is a comments section where users can:

- **Write comments** - Type in the text area and click "Comment"
- **React with emojis** - Click an existing reaction to toggle yours, or click the "+" button to pick from: 👍 ❤️ 😄 🎉 🤔 👀
- **Delete comments** - You can delete your own comments using the trash icon

## Sidebar

The Wiki sidebar provides quick navigation. Open it from the side panel to browse:

- **My Pages** tab - Your private pages
- **Public** tab - All published pages

Click any page to navigate to it in the main wiki view.

## Action Labels (Study Plan Integration)

Pages can be tagged with an **action label** in the editor. This makes the page triggerable as an exercise by the study plan. When the study plan assigns the page, users are navigated directly to it.

## Tips

- Use the tree context menu (right-click) for quick actions: add subpage, move, delete, publish/unpublish
- Assign meaningful icons to top-level pages for easier visual scanning
- Enable "Show subpages" on index/overview pages to help readers discover related content
- Page content is automatically translated using the platform's translation system
