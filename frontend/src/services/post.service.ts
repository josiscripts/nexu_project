export interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    area: string;
  };
  _count?: {
    comments: number;
    likes: number;
  };
  likesCount?: number;
  likedByMe?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    area: string;
  };
}

export interface PaginatedPosts {
  data: Post[];
  total: number;
  skip: number;
  take: number;
  hasMore: boolean;
}

export interface CreatePostDto {
  content: string;
  category: string;
  imageUrl?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Get posts with pagination and optional category filter
 */
export async function getPosts(
  category?: string,
  skip = 0,
  take = 20,
): Promise<PaginatedPosts> {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  params.set('skip', skip.toString());
  params.set('take', take.toString());

  const response = await fetch(`${API_URL}/posts?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Error al obtener los posts');
  }

  return response.json();
}

/**
 * Get posts by current user
 */
export async function getMyPosts(token: string): Promise<Post[]> {
  const response = await fetch(`${API_URL}/posts/mine`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Error al obtener tus posts');
  }

  return response.json();
}

/**
 * Get a single post by ID
 */
export async function getPostById(id: string, token: string): Promise<Post> {
  const response = await fetch(`${API_URL}/posts/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener el post');
  }

  return response.json();
}

/**
 * Create a new post (with optional file upload)
 */
export async function createPost(
  dto: CreatePostDto,
  token: string,
  file?: File,
): Promise<Post> {
  let body: string | FormData;
  let headers: HeadersInit;

  if (file) {
    // Use FormData for file upload
    const formData = new FormData();
    formData.append('content', dto.content);
    formData.append('category', dto.category);
    formData.append('image', file);
    body = formData;
    headers = {
      'Authorization': `Bearer ${token}`,
    };
  } else {
    // Use JSON for text-only posts
    body = JSON.stringify(dto);
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  const response = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al crear el post');
  }

  return response.json();
}

/**
 * Update a post
 */
export async function updatePost(
  id: string,
  dto: Partial<CreatePostDto>,
  token: string,
): Promise<Post> {
  const response = await fetch(`${API_URL}/posts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error('Error al actualizar el post');
  }

  return response.json();
}

/**
 * Delete a post
 */
export async function deletePost(id: string, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/posts/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al eliminar el post');
  }
}

/**
 * Toggle like on a post
 */
export async function likePost(id: string, token: string): Promise<{ liked: boolean }> {
  const response = await fetch(`${API_URL}/posts/${id}/likes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al dar like');
  }

  return response.json();
}

/**
 * Get comments for a post
 */
export async function getComments(
  postId: string,
  token: string,
  skip = 0,
  take = 10,
): Promise<Comment[]> {
  const params = new URLSearchParams();
  params.set('skip', skip.toString());
  params.set('take', take.toString());

  const response = await fetch(`${API_URL}/posts/${postId}/comments?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener comentarios');
  }

  return response.json();
}

/**
 * Add a comment to a post
 */
export async function addComment(
  postId: string,
  content: string,
  token: string,
): Promise<Comment> {
  const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al agregar comentario');
  }

  return response.json();
}
