'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/contexts/SocketContext';
import { usePosts } from '@/hooks/usePosts';
import { getComments, addComment } from '@/services/post.service';
import type { Comment } from '@/services/post.service';
import Navbar from '@/components/layout/Navbar';
import PostForm from '@/components/posts/PostForm';
import PostCard from '@/components/posts/PostCard';
import { Loader2 } from 'lucide-react';

export default function MuroPage() {
  const { user, token } = useAuthStore();
  const { isConnected } = useSocket();
  const { posts, isLoading, error, fetchPosts, likedPostIds, toggleLike } = usePosts();
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCommentExpand = async (postId: string) => {
    if (commentsMap[postId]) return;
    try {
      if (!token) return;
      const comments = await getComments(postId, token);
      setCommentsMap((prev) => ({ ...prev, [postId]: comments }));
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    if (!token) return;
    try {
      const newComment = await addComment(postId, content, token);
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  // Show nothing while checking authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-nexu-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nexu-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <Navbar />

      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy">
              Muro de <span className="text-brand-red">{user.area?.replace(/_/g, ' ')}</span>
            </h1>
            <p className="text-brand-navy/60 mt-1 flex items-center gap-2">
              Publicaciones en tiempo real
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]'
                    : 'bg-gray-500'
                }`}
              />
            </p>
          </div>

          {/* Post Form */}
          <div className="mb-6">
            <PostForm onPostCreated={fetchPosts} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-brand-red/10 border border-brand-red/20 text-brand-red p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* Posts Feed */}
          <div className="space-y-4">
            {isLoading && posts.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-brand-gray rounded-xl border border-brand-gray/50">
                <p className="text-brand-navy/60">No hay publicaciones aún.</p>
                <p className="text-brand-navy/40 text-sm mt-2">¡Sé el primero en publicar!</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={toggleLike}
                  isLiked={likedPostIds.has(post.id)}
                  comments={commentsMap[post.id]}
                  onCommentExpand={handleCommentExpand}
                  onAddComment={handleAddComment}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}