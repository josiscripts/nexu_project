'use server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function createGroup(data: {
  name: string;
  description?: string;
  bannerUrl?: string;
}, token: string) {
  try {
    const response = await fetch(`${API_URL}/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: data.name,
        description: data.description || '',
        bannerUrl: data.bannerUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const group = await response.json();
    return { success: true, group };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error creating group',
    };
  }
}

export async function joinGroup(groupId: string, token: string) {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const member = await response.json();
    return { success: true, member };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error joining group',
    };
  }
}

export async function leaveGroup(groupId: string, token: string) {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/leave`, {
      method: 'POST',
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
      error: error instanceof Error ? error.message : 'Error leaving group',
    };
  }
}

export async function getGroupDetails(groupId: string, token: string) {
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const group = await response.json();
    return { success: true, group };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error fetching group',
    };
  }
}
