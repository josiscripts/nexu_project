'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MessageCircle, Trash2, Heart } from 'lucide-react';
import { deletePost, replyToPost } from '@/app/actions/posts';
import { useAuthStore } from '@/store/authStore';

interface Author {
  id: string;
  name: string;
}

interface Reply {
  id: string;
  content: string;
  images: string[];
  author: Author;
  createdAt: string;
}

interface PostCardProps {
  id: string;
  content: string;
  images: string[];
  author: Author;
  replies: Reply[];
  createdAt: string;
  groupId: string;
  onReplyClick?: (parentId: string) => void;
  canDelete?: boolean;
  onDeleted?: () => void;
}

export default function PostCard({
  id,
  content,
  images,
  author,
  replies,
  createdAt,
  groupId,
  onReplyClick,
  canDelete,
  onDeleted,
}: PostCardProps) {
  const { user, token } = useAuthStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleDelete = async () => {
    if (!confirm('¿Eliminar publicación?')) return;
    if (!token) return;

    setIsDeleting(true);
    const result = await deletePost(id, groupId, token);
    if (result.success) onDeleted?.();
    setIsDeleting(false);
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !token) return;

    const result = await replyToPost(
      {
        content: replyContent,
        parentId: id,
        groupId,
      },
      token
    );

    if (result.success) {
      setReplyContent('');
      setIsReplying(false);
      onDeleted?.();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 hover:shadow-md transition">
      {/* Main Post */}
      <div className="flex gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-bold text-gray-900">{author.name}</h4>
              <span className="text-xs text-gray-500">@{author.id.slice(0, 8)}</span>
            </div>
            <span className="text-xs text-gray-500">{formatDate(createdAt)}</span>
          </div>

          <p className="text-gray-800 mb-3 leading-relaxed">{content}</p>

          {/* Images Grid */}
          {images && images.length > 0 && (
            <div
              className={`grid gap-2 mb-3 ${
                images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              }`}
            >
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden"
                >
                  <Image
                    src={img}
                    alt={`Post image ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 text-gray-500 text-sm border-t border-gray-100 pt-3 mt-3">
            <button
              onClick={() => {
                setIsReplying(!isReplying);
                onReplyClick?.(id);
              }}
              className="flex items-center gap-1 hover:text-blue-500 transition hover:bg-blue-50 px-2 py-1 rounded"
            >
              <MessageCircle size={16} />
              <span className="text-xs">Responder</span>
            </button>
            <button className="flex items-center gap-1 hover:text-red-500 transition hover:bg-red-50 px-2 py-1 rounded">
              <Heart size={16} />
              <span className="text-xs">Me gusta</span>
            </button>
            {canDelete && user?.id === author.id && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1 hover:text-red-600 transition disabled:opacity-50 hover:bg-red-50 px-2 py-1 rounded"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Reply Form */}
          {isReplying && (
            <form
              onSubmit={handleReplySubmit}
              className="mt-4 pt-4 border-t border-gray-200 space-y-3"
            >
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Escribe tu respuesta..."
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsReplying(false)}
                  className="px-3 py-1 text-sm rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!replyContent.trim()}
                  className="px-3 py-1 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-50"
                >
                  Responder
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Replies Thread */}
      {replies && replies.length > 0 && (
        <div className="mt-4 ml-4 pl-4 border-l-2 border-gray-200 space-y-3">
          {replies.map((reply) => (
            <div key={reply.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h5 className="font-semibold text-sm text-gray-900">{reply.author.name}</h5>
                  <span className="text-xs text-gray-500">@{reply.author.id.slice(0, 8)}</span>
                </div>
                <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{reply.content}</p>

              {reply.images && reply.images.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {reply.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-16 bg-gray-200 rounded overflow-hidden"
                    >
                      <Image
                        src={img}
                        alt={`Reply image ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
