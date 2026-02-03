import { RimoriPluginConfig } from "@rimori/client";

const config: RimoriPluginConfig = {
  id: "pl1410555270",
  info: {
    title: "Rimori Wiki",
    description: "A personal and shared wiki for organizing your knowledge. Create pages in a tree structure, write in markdown, and publish pages to share with your community.",
    logo: "logo.png",

  },
  pages: {
    main: [
      {
        id: "1",
        url: "#/wiki",
        name: "Wiki",
        show: true,
        root: "community",
        description: "Your personal and shared wiki",
      },
      {
        id: "2",
        url: "#/wiki/action",
        show: false,
        root: "community",
        name: "Wiki Action",
        description: "Wiki action",
        action: {
          key: "wiki_page",
          parameters: {
            page_id: {
              type: "string",
              description: "The ID of the wiki page to display",
            },
          },
        },
      },
    ],
    sidebar: [
      {
        id: "browse",
        url: "#/sidebar/browse",
        name: "Wiki",
        icon: "logo.png",
        description: "Browse wiki pages",
      },
    ],
    settings: "#/settings",
  },
  documentation: {
    overview_path: 'docs/overview.md',
    user_path: 'docs/user/userdocs.md',
    developer_path: 'docs/dev/devdocs.md',
  },
};

export default config;
