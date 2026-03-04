export interface WikiPage {
  id: string;
  title: string;
  content: string | null;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  sort_order: number;
  guild_id: string | null;
  min_skill_level: string | null;
  skill_level_type: string | null;
  created_by: string;
  created_at: string;
}

export interface WikiComment {
  id: string;
  page_id: string;
  content: string;
  created_by: string;
  created_at: string;
}

export interface WikiReaction {
  id: string;
  comment_id: string;
  emoji: string;
  created_by: string;
}

export interface TreeNode {
  page: WikiPage;
  children: TreeNode[];
  expanded: boolean;
}
