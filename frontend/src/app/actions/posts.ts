'use server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function createPost(data: {
  content: string;
  images?: string[];
  groupId: string;
  parentId?: string;
}, token: string) {
  try {
    const response = await fetch(`${API_URL}/groups/${data.groupId}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        content: data.content,
        images: data.images || [],
        parentId: data.parentId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const post = await response.json();
    return { success: true, post };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error creating post',
    };
  }
}

export async function getGroupPosts(groupId: string, token: string) {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/posts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const posts = await response.json();
    return { success: true, posts };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error fetching posts',
    };
  }
}

export async function deletePost(postId: string, groupId: string, token: string) {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error deleting post',
    };
  }
}

export async function replyToPost(data: {
  content: string;
  images?: string[];
  parentId: string;
  groupId: string;
}, token: string) {
  return createPost(data, token);
}
