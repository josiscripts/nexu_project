'use client';

import { useEffect, useState } from 'react';
import { getGroupPosts } from '@/app/actions/posts';

interface GroupPost {
  id: string;
  content: string;
  images: string[];
  author: {
    id: string;
    name: string;
  };
  replies: GroupPost[];
  createdAt: string;
}

export function useGroupPosts(groupId: string, token: string | null) {
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await getGroupPosts(groupId, token);
      if (result.success) {
        setPosts(result.posts || []);
        setError(null);
      } else {
        setError(result.error || 'Error loading posts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [groupId, token]);

  return { posts, loading, error, refetch: fetchPosts, setPosts };
}
