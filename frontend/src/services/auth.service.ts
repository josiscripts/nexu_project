const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    area: string;
  };
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Credenciales inválidas');
  }

  return res.json();
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  area: string;
}

export async function registerUser(dto: RegisterDto): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'No se pudo crear la cuenta');
  }

  return res.json();
}
