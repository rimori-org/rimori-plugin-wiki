import { DbTableDefinition } from '@rimori/client';

export const pages: DbTableDefinition = {
  type: 'table',
  table_name: 'pages',
  description: 'Wiki pages with markdown content organized in a tree structure',
  permissions: {
    user: {
      read: 'LANG',
      insert: 'OWN',
      update: 'OWN',
      delete: 'OWN',
    },
  },
  columns: {
    title: {
      type: 'text',
      description: 'Page title',
      nullable: false,
    },
    content: {
      type: 'markdown',
      description: 'Markdown content of the page',
      nullable: true,
    },
    description: {
      type: 'text',
      description: 'Short description shown under the title',
      nullable: true,
    },
    icon: {
      type: 'text',
      description: 'ASCII character or emoji used as the page icon',
      nullable: true,
    },
    parent_id: {
      type: 'uuid',
      description: 'Parent page ID for tree hierarchy (null = root page)',
      nullable: true,
    },
    sort_order: {
      type: 'integer',
      description: 'Sort order among sibling pages',
      nullable: true,
      default_value: 0,
    },
    min_skill_level: {
      type: 'text',
      description: 'Minimum CEFR skill level required to see this page (e.g. A2, B1). Null means no restriction.',
      nullable: true,
    },
    skill_level_type: {
      type: 'text',
      description: 'Which skill category the min_skill_level applies to: reading, writing, grammar, speaking, listening, or understanding.',
      nullable: true,
    },
    embedding: {
      type: 'vector',
      description: 'Vector embedding for semantic search over wiki pages',
      nullable: true,
      source_column: 'content',
    },
  },
};

export const comments: DbTableDefinition = {
  type: 'table',
  table_name: 'comments',
  description: 'Comments on wiki pages',
  permissions: {
    user: {
      read: 'ALL',
      insert: 'OWN',
      update: 'OWN',
      delete: 'OWN',
    },
  },
  columns: {
    page_id: {
      type: 'uuid',
      description: 'The wiki page this comment belongs to',
      nullable: false,
      foreign_key: {
        references_table: 'pages',
        references_column: 'id',
        on_delete_cascade: true,
      },
    },
    content: {
      type: 'text',
      description: 'Comment text',
      nullable: false,
    },
  },
};

export const reactions: DbTableDefinition = {
  type: 'table',
  table_name: 'reactions',
  description: 'Emoji reactions on comments',
  permissions: {
    user: {
      read: 'ALL',
      insert: 'OWN',
      update: 'OWN',
      delete: 'OWN',
    },
  },
  columns: {
    comment_id: {
      type: 'uuid',
      description: 'The comment this reaction belongs to',
      nullable: false,
      foreign_key: {
        references_table: 'comments',
        references_column: 'id',
        on_delete_cascade: true,
      },
    },
    emoji: {
      type: 'text',
      description: 'The emoji character for this reaction',
      nullable: false,
    },
  },
};
