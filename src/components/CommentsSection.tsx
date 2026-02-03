import { useState, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { useRimori, useTranslation } from '@rimori/react-client';
import { WikiComment, WikiReaction } from '../types/wiki';
import { ReactionBar } from './ReactionBar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CommentsSectionProps {
  pageId: string;
}

export const CommentsSection = ({ pageId }: CommentsSectionProps) => {
  const plugin = useRimori();
  const { t } = useTranslation();
  const [comments, setComments] = useState<WikiComment[]>([]);
  const [reactions, setReactions] = useState<WikiReaction[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const currentUserId = plugin.plugin.getUserInfo()?.user_id || null;

  const fetchComments = useCallback(async () => {
    const { data } = await plugin.db
      .from('comments')
      .select('*')
      .eq('page_id', pageId)
      .order('created_at', { ascending: true });
    if (data) setComments(data as WikiComment[]);
  }, [plugin.db, pageId]);

  const fetchReactions = useCallback(async () => {
    const commentIds = comments.map((c) => c.id);
    if (commentIds.length === 0) {
      setReactions([]);
      return;
    }
    const { data } = await plugin.db.from('reactions').select('*').in('comment_id', commentIds);
    if (data) setReactions(data as WikiReaction[]);
  }, [plugin.db, comments]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    await plugin.db.from('comments').insert({ page_id: pageId, content: newComment.trim() });
    setNewComment('');
    setSubmitting(false);
    await fetchComments();
  };

  const handleDelete = async (commentId: string) => {
    await plugin.db.from('comments').delete().eq('id', commentId);
    await fetchComments();
  };

  const handleAddReaction = async (commentId: string, emoji: string) => {
    await plugin.db.from('reactions').insert({ comment_id: commentId, emoji });
    await fetchReactions();
  };

  const handleRemoveReaction = async (reactionId: string) => {
    await plugin.db.from('reactions').delete().eq('id', reactionId);
    await fetchReactions();
  };

  return (
    <div className="mt-8 pt-6">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
        {t('wiki.comments.title')}
      </h3>

      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground mb-4 italic">{t('wiki.comments.noComments')}</p>
      )}

      <div className="space-y-3 mb-5">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(comment.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {comment.created_by === currentUserId && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-muted-foreground/50 hover:text-destructive ml-3 transition-colors p-1 rounded-md hover:bg-destructive/10"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-border/50">
              <ReactionBar
                reactions={reactions.filter((r) => r.comment_id === comment.id)}
                currentUserId={currentUserId}
                onAdd={(emoji) => handleAddReaction(comment.id, emoji)}
                onRemove={handleRemoveReaction}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 items-center">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t('wiki.comments.placeholder')}
          className="flex-1 min-h-[60px] rounded-xl resize-none"
        />
        <Button
          onClick={handleSubmit}
          disabled={!newComment.trim() || submitting}
          size="sm"
          className="rounded-xl px-5 h-10"
        >
          {t('wiki.comments.submit')}
        </Button>
      </div>
    </div>
  );
};
