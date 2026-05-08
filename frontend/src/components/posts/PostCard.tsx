'use client';

import { useState } from 'react';
import { User, MessageCircle, Heart, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Post, Comment } from '@/services/post.service';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  isLiked?: boolean;
  comments?: Comment[];
  onAddComment?: (postId: string, content: string) => void;
  onCommentExpand?: (postId: string) => void;
}

export default function PostCard({
  post,
  onLike,
  isLiked,
  comments,
  onAddComment,
  onCommentExpand,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleExpandComments = async () => {
    if (!showComments) {
      onCommentExpand?.(post.id);
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async () => {
    if (!commentInput.trim()) return;
    setIsSubmittingComment(true);
    try {
      await onAddComment?.(post.id, commentInput.trim());
      setCommentInput('');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const categoryLabel = post.category?.replace(/_/g, ' ') || 'Sin categoría';
  const authorAreaLabel = post.author?.area?.replace(/_/g, ' ') || 'Sin área';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-red to-brand-navy flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-brand-navy font-semibold truncate">{post.author?.name || 'Autor desconocido'}</h4>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <Badge variant="default" className="text-xs">{authorAreaLabel}</Badge>
              <Badge variant="secondary" className="text-xs">{categoryLabel}</Badge>
              <span className="text-brand-navy/50 text-xs">{formatTime(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <p className="text-brand-text whitespace-pre-wrap break-words leading-relaxed mb-3">
          {post.content}
        </p>

        {/* Image */}
        {post.imageUrl && (
          <div className="mt-3 rounded-lg overflow-hidden border border-brand-gray mb-3">
            <img
              src={post.imageUrl}
              alt="Post image"
              className="w-full max-h-96 object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Footer - Interactions */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-brand-gray">
          <button
            onClick={() => onLike?.(post.id)}
            className="flex items-center gap-1.5 text-brand-navy/60 hover:text-brand-red transition-colors text-sm"
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-brand-red text-brand-red' : ''}`} />
            <span>{post._count?.likes || 0}</span>
          </button>
          <button
            onClick={handleExpandComments}
            className="flex items-center gap-1.5 text-brand-navy/60 hover:text-brand-navy transition-colors text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post._count?.comments || 0}</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-brand-gray space-y-3">
            {/* Comments List */}
            {comments && comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="text-sm">
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-navy/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-brand-navy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-brand-navy text-xs">
                          {comment.author?.name || 'Anónimo'}
                        </div>
                        <p className="text-brand-navy/80 text-xs mt-0.5 break-words">
                          {comment.content}
                        </p>
                        <div className="text-brand-navy/40 text-xs mt-1">
                          {new Date(comment.createdAt).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-brand-navy/50 text-xs text-center py-2">
                Sin comentarios aún
              </p>
            )}

            {/* Add Comment Input */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmitComment()}
                placeholder="Añade un comentario..."
                disabled={isSubmittingComment}
                maxLength={300}
                className="flex-1 bg-brand-bg border border-brand-gray rounded-lg px-3 py-2 text-xs text-brand-navy placeholder-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-brand-red/30 disabled:opacity-50"
              />
              <button
                onClick={handleSubmitComment}
                disabled={isSubmittingComment || !commentInput.trim()}
                className="px-3 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                {isSubmittingComment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <MessageCircle className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
