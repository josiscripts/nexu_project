'use client';
import { useState } from 'react';
import NexuButton from '@/components/ui/NexuButton';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aquí llamaremos a tu Backend (http://localhost:3000/auth/login)
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      setAuth(data.user, data.access_token);
      alert('¡Bienvenido a NEXU!');
    } else {
      alert('Error: ' + data.error.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-nexu-dark">
      <form onSubmit={handleLogin} className="bg-nexu-gray p-8 rounded-2xl shadow-2xl border border-nexu-red/20 w-96">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Identidad <span className="text-nexu-red">NEXU</span></h2>
        
        <input 
          type="email" 
          placeholder="Email Universitario"
          className="w-full p-3 mb-4 bg-black border border-gray-800 rounded-lg text-white focus:border-nexu-red outline-none"
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <input 
          type="password" 
          placeholder="Contraseña"
          className="w-full p-3 mb-6 bg-black border border-gray-800 rounded-lg text-white focus:border-nexu-red outline-none"
          onChange={(e) => setPassword(e.target.value)}
        />

        <NexuButton type="submit" className="w-full">Iniciar Sesión</NexuButton>
      </form>
    </div>
  );
}
