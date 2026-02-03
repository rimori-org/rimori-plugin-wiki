import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { WikiReaction } from '../types/wiki';

const AVAILABLE_EMOJIS = ['👍', '❤️', '😄', '🎉', '🤔', '👀'];

interface ReactionBarProps {
  reactions: WikiReaction[];
  currentUserId: string | null;
  onAdd: (emoji: string) => void;
  onRemove: (reactionId: string) => void;
}

export const ReactionBar = ({ reactions, currentUserId, onAdd, onRemove }: ReactionBarProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  const grouped = reactions.reduce(
    (acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = [];
      acc[r.emoji].push(r);
      return acc;
    },
    {} as Record<string, WikiReaction[]>,
  );

  const handleEmojiClick = (emoji: string) => {
    const existing = reactions.find((r) => r.emoji === emoji && r.created_by === currentUserId);
    if (existing) {
      onRemove(existing.id);
    } else {
      onAdd(emoji);
    }
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Object.entries(grouped).map(([emoji, emojiReactions]) => {
        const hasOwn = emojiReactions.some((r) => r.created_by === currentUserId);
        return (
          <button
            key={emoji}
            onClick={() => handleEmojiClick(emoji)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
              hasOwn
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <span>{emoji}</span>
            <span>{emojiReactions.length}</span>
          </button>
        );
      })}
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Plus size={12} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top">
          <div className="flex gap-1">
            {AVAILABLE_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  handleEmojiClick(emoji);
                  setPickerOpen(false);
                }}
                className="text-lg hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
