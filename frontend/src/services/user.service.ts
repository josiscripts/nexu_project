const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  area: string;
  createdAt: string;
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
}

export interface GroupCard {
  id: string;
  name: string;
  description?: string;
  area: string;
  hostId: string;
  createdAt: string;
  isMember?: boolean;
  _count: {
    members: number;
  };
}

export interface RoomInfo {
  id: string;
  name: string;
  area: string;
  hostId: string;
  isActive: boolean;
  createdAt: string;
  userCount: number;
}

export interface SearchResults {
  users: Omit<UserProfile, 'createdAt' | '_count'>[];
  groups: GroupCard[];
  rooms: RoomInfo[];
}

export async function searchAll(q: string, token: string): Promise<SearchResults> {
  const response = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(q)}`, {
    headers: { 'Authorization': `Bearer ${token}` },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Error en la búsqueda');
  }

  return response.json();
}

export async function getUserProfile(id: string, token: string): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/users/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Usuario no encontrado');
  }

  return response.json();
}

export async function toggleFollow(userId: string, token: string): Promise<{ following: boolean }> {
  const response = await fetch(`${API_URL}/users/${userId}/follow`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Error al seguir usuario');
  }

  return response.json();
}

export async function getGroups(token: string): Promise<GroupCard[]> {
  const response = await fetch(`${API_URL}/groups`, {
    headers: { 'Authorization': `Bearer ${token}` },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Error al cargar grupos');
  }

  return response.json();
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  area: string;
}

export async function createGroup(dto: CreateGroupInput, token: string): Promise<GroupCard> {
  const response = await fetch(`${API_URL}/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Error al crear grupo');
  }

  return response.json();
}

export async function joinGroup(groupId: string, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/groups/${groupId}/join`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Error al unirse al grupo');
  }
}

export async function leaveGroup(groupId: string, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/groups/${groupId}/leave`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Error al salir del grupo');
  }
}

export async function getRooms(token: string): Promise<RoomInfo[]> {
  const response = await fetch(`${API_URL}/rooms`, {
    headers: { 'Authorization': `Bearer ${token}` },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Error al cargar salas');
  }

  return response.json();
}

export interface CreateRoomInput {
  name: string;
  area: string;
}

export async function createRoom(dto: CreateRoomInput, token: string): Promise<RoomInfo> {
  const response = await fetch(`${API_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Error al crear sala');
  }

  return response.json();
}
