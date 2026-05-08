'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/contexts/SocketContext';
import { likePost } from '@/services/post.service';
import type { Post } from '@/services/post.service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const { token } = useAuthStore();
  const { posts: socketPosts } = useSocket();

  // Fetch posts from REST API
  const fetchPosts = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar publicaciones');
      }

      const data = await response.json();
      setPosts(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Merge REST API posts with WebSocket posts
  useEffect(() => {
    if (socketPosts.length > 0) {
      setPosts((prev) => {
        const merged = [...socketPosts];
        prev.forEach((post) => {
          if (!merged.some((p) => p.id === post.id)) {
            merged.push(post);
          }
        });
        return merged.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    }
  }, [socketPosts]);

  // Toggle like on a post
  const toggleLike = useCallback(async (postId: string) => {
    if (!token) return;

    // Optimistic update
    setLikedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });

    try {
      await likePost(postId, token);
    } catch (err) {
      // Revert on error
      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (next.has(postId)) {
          next.delete(postId);
        } else {
          next.add(postId);
        }
        return next;
      });
      setError(err instanceof Error ? err.message : 'Error al dar like');
    }
  }, [token]);

  return {
    posts,
    isLoading,
    error,
    fetchPosts,
    likedPostIds,
    toggleLike,
  };
}