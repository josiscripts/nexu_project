import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Intentamos obtener el token de las cookies (Zustand persist lo guarda ahí o en LocalStorage)
  // Nota: Para máxima seguridad en el TFG, lo ideal es usar Cookies.
  const token = request.cookies.get('nexu-token')?.value;

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register');

  // 2. Si no hay token y no está en login/register, lo mandamos al login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Si ya está logueado e intenta ir al login, lo mandamos al Home
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Definimos qué rutas proteger
export const config = {
  matcher: ['/social/:path*', '/muro/:path*', '/perfil/:path*', '/chat/:path*', '/explorar/:path*', '/grupos/:path*', '/salas/:path*', '/login', '/register'],
};
