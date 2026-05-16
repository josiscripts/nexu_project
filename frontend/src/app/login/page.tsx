"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { loginUser, registerUser } from "@/services/auth.service";

type AuthStep = "welcome" | "join" | "register" | "login" | "logout";

const UNESCO_AREAS = [
  "SALUD",
  "INGENIERIA",
  "ARTES",
  "CIENCIAS_EXACTAS",
  "CIENCIAS_SOCIALES",
  "NEGOCIOS",
  "ARQUITECTURA_Y_URBANISMO"
] as const;

export default function LoginPage() {
  const [step, setStep] = useState<AuthStep>("welcome");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Zustand store
  const setAuth = useAuthStore((state) => state.setAuth);
  const logoutAction = useAuthStore((state) => state.logout);

  // Login form states
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register form states
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerArea, setRegisterArea] = useState<(typeof UNESCO_AREAS)[number]>("INGENIERIA");
  const [registerShowPassword, setRegisterShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await loginUser(email, password);
      setAuth(data.user, data.access_token);
      
      // Sincronizar la cookie para el middleware de Next.js
      document.cookie = `nexu-token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
      
      router.push("/social");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await registerUser({
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        area: registerArea
      });
      setAuth(data.user, data.access_token);
      
      // Sincronizar la cookie para el middleware de Next.js
      document.cookie = `nexu-token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
      
      router.push("/social");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout endpoint to clear HttpOnly cookie on backend
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Error logging out:', err);
    }
    logoutAction();
    // Limpiar la cookie del middleware
    document.cookie = "nexu-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setStep("welcome");
  };

  return (
    <main className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-4 sm:p-6">
      
      {/* Contenedor Principal (Fondo blanco simulando la pantalla del móvil) */}
      <div className="w-full max-w-md bg-white text-brand-navy rounded-[40px] shadow-2xl overflow-hidden relative min-h-[700px] flex flex-col">
        
        {/* Cabecera con botón de retroceso (excepto en welcome) */}
        {step !== "welcome" && (
          <div className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
            <button 
              onClick={() => {
                if (step === "login" || step === "register") setStep("join");
                else if (step === "join") setStep("welcome");
                else if (step === "logout") router.back();
              }}
              className="p-2 hover:bg-brand-gray rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            {step !== "logout" && (
              <div className="w-10 h-10 rounded-full border border-brand-gray flex items-center justify-center">
                <span className="font-bold text-lg text-brand-navy">N</span>
              </div>
            )}
            <div className="w-10"></div> {/* Spacer para centrar el logo si fuera necesario */}
          </div>
        )}

        {/* --- STEP: WELCOME --- */}
        {step === "welcome" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-32 h-32 rounded-full border-2 border-brand-gray flex items-center justify-center relative mb-8">
              <div className="w-24 h-24 rounded-2xl bg-white shadow-lg flex items-center justify-center relative z-10">
                <span className="text-5xl font-bold text-brand-navy tracking-tighter">N</span>
              </div>
              {/* Punto rojo animado estilo diseño */}
              <div className="absolute top-4 right-4 w-3 h-3 bg-brand-coral rounded-full shadow-[0_0_10px_#FF3B3F]"></div>
              
              <div className="absolute inset-0 rounded-full border border-brand-gray scale-125 opacity-50"></div>
              <div className="absolute inset-0 rounded-full border border-brand-gray scale-150 opacity-20"></div>
            </div>

            <h1 className="text-5xl font-extrabold mb-4 tracking-tight text-brand-navy">Nexu</h1>
            <p className="text-lg text-brand-navy/60 mb-16">
              tu carrera, tu comunidad, tu mundo.
            </p>

            <div className="w-full mt-auto mb-8">
              <button 
                onClick={() => setStep("join")}
                className="w-full bg-brand-coral text-white font-semibold text-lg py-4 rounded-full shadow-[0_8px_20px_-6px_#FF3B3F] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Get Started
              </button>
              
              <div className="mt-8 pt-8 border-t border-brand-gray w-full flex justify-center gap-6 text-xs text-brand-navy/50 font-medium">
                <span className="flex items-center gap-1">SECURE</span>
                <span className="flex items-center gap-1">GLOBAL</span>
                <span className="flex items-center gap-1">FAST</span>
              </div>
            </div>
          </div>
        )}

        {/* --- STEP: JOIN --- */}
        {step === "join" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in slide-in-from-right-8 duration-300 mt-16">
            
            <div className="w-20 h-20 rounded-full bg-brand-navy text-white flex items-center justify-center relative mb-8 shadow-xl">
              {/* Icono abstracto simulado */}
              <div className="grid grid-cols-2 gap-1 w-8 h-8">
                <div className="w-3 h-3 rounded-full border-2 border-white"></div>
                <div className="w-3 h-3 rounded-full border-2 border-white"></div>
                <div className="w-3 h-3 rounded-full border-2 border-white"></div>
                <div className="w-3 h-3 rounded-full border-2 border-white"></div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-coral rounded-full border-2 border-white"></div>
            </div>

            <h2 className="text-3xl font-bold mb-2 text-brand-navy">join your community</h2>
            <p className="text-sm text-brand-navy/60 mb-10">
              Connect with professionals worldwide
            </p>

            <div className="w-full space-y-4">
              <button className="w-full py-4 border border-brand-gray rounded-2xl font-medium text-brand-navy hover:bg-brand-gray/50 transition-colors flex items-center justify-center gap-3">
                <span className="w-5 h-5 bg-gray-200 rounded-sm"></span>
                continue with google
              </button>
              <button className="w-full py-4 border border-brand-gray rounded-2xl font-medium text-brand-navy hover:bg-brand-gray/50 transition-colors flex items-center justify-center gap-3">
                <span className="w-5 h-5 font-bold text-lg leading-none">iOS</span>
                continue with apple
              </button>
              <button className="w-full py-4 border border-brand-gray rounded-2xl font-medium text-brand-navy hover:bg-brand-gray/50 transition-colors flex items-center justify-center gap-3">
                <span className="w-5 h-5 rounded-full border-2 border-blue-500 text-blue-500 flex items-center justify-center text-xs">f</span>
                continue with facebook
              </button>
            </div>

            <div className="w-full flex items-center my-8">
              <div className="flex-1 h-px bg-brand-gray"></div>
              <span className="px-4 text-xs font-semibold text-brand-navy/40">OR</span>
              <div className="flex-1 h-px bg-brand-gray"></div>
            </div>

            <button 
              onClick={() => setStep("register")}
              className="w-full py-4 border-2 border-brand-navy rounded-full font-semibold text-brand-navy hover:bg-brand-navy hover:text-white transition-all"
            >
              sign up with email
            </button>

            <p className="mt-6 text-sm text-brand-navy/60">
              already have an account? <button onClick={() => setStep("login")} className="text-brand-coral font-bold hover:underline">log in</button>
            </p>
          </div>
        )}

        {/* --- STEP: REGISTER --- */}
        {step === "register" && (
          <div className="flex-1 flex flex-col p-8 animate-in slide-in-from-right-8 duration-300 mt-16 overflow-y-auto">
            <h2 className="text-3xl font-bold mb-8 text-brand-navy leading-tight">Create your professional account</h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5 flex-1">
              <div>
                <label className="block text-sm font-bold text-brand-navy mb-2">Full name</label>
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full bg-brand-gray/50 border-none rounded-xl p-4 text-brand-navy placeholder:text-brand-navy/40 focus:ring-2 focus:ring-brand-red outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-navy mb-2">Academic Area</label>
                <select
                  value={registerArea}
                  onChange={(e) => setRegisterArea(e.target.value as typeof registerArea)}
                  className="w-full bg-brand-gray/50 border-none rounded-xl p-4 text-brand-navy focus:ring-2 focus:ring-brand-red outline-none transition-all"
                >
                  {UNESCO_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-navy mb-2">Email</label>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="example@nexu.io"
                  required
                  className="w-full bg-brand-gray/50 border-none rounded-xl p-4 text-brand-navy placeholder:text-brand-navy/40 focus:ring-2 focus:ring-brand-red outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-navy mb-2">Password</label>
                <div className="relative">
                  <input
                    type={registerShowPassword ? "text" : "password"}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    className="w-full bg-brand-gray/50 border-none rounded-xl p-4 pr-12 text-brand-navy placeholder:text-brand-navy/40 focus:ring-2 focus:ring-brand-red outline-none transition-all"
                  />
                  <button type="button" onClick={() => setRegisterShowPassword(!registerShowPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-navy/40 hover:text-brand-navy transition-colors">
                    {registerShowPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 mt-6">
                <input type="checkbox" required className="mt-1 w-5 h-5 rounded border-brand-gray text-brand-red focus:ring-brand-red" />
                <p className="text-sm text-brand-navy/60 leading-relaxed">
                  I agree to the <a href="#" className="font-semibold text-brand-navy hover:underline">Terms of Service</a> and <a href="#" className="font-semibold text-brand-navy hover:underline">Privacy Policy</a>.
                </p>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center bg-brand-coral text-white font-semibold text-lg py-4 rounded-full shadow-[0_8px_20px_-6px_#FF3B3F] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 transition-all"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={24} /> : "Create account"}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs font-bold text-brand-navy/40 tracking-wider mb-4 uppercase">Already have an account?</p>
              <button
                onClick={() => setStep("login")}
                className="w-full py-4 border border-brand-gray rounded-2xl font-bold text-brand-navy hover:bg-brand-gray/50 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* --- STEP: LOGIN --- */}
        {step === "login" && (
          <div className="flex-1 flex flex-col p-8 animate-in slide-in-from-right-8 duration-300 mt-16">
            <h2 className="text-4xl font-extrabold mb-2 text-brand-navy tracking-tight">Welcome back</h2>
            <p className="text-brand-navy/60 mb-10">Enter your details to access Nexu</p>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6 flex-1">
              <div>
                <label className="block text-sm font-bold text-brand-navy mb-2 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-brand-gray/50 border-none rounded-2xl p-4 text-brand-navy placeholder:text-brand-navy/40 focus:ring-2 focus:ring-brand-red outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-navy mb-2 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-brand-gray/50 border-none rounded-2xl p-4 pr-12 text-brand-navy placeholder:text-brand-navy/40 focus:ring-2 focus:ring-brand-red outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-navy/40 hover:text-brand-navy transition-colors">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="text-right mt-3">
                  <button type="button" className="text-sm font-bold text-brand-coral hover:underline">Forgot password?</button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center bg-brand-coral text-white font-semibold text-lg py-4 rounded-full shadow-[0_8px_20px_-6px_#FF3B3F] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 transition-all"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={24} /> : "Log in"}
                </button>
              </div>
            </form>

            <div className="mt-auto pt-8 text-center border-t border-brand-gray/50 relative">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-xs font-bold text-brand-navy/40 uppercase tracking-wider">
                Secure Login
              </span>
              <p className="text-sm text-brand-navy/60 mt-4">
                Don't have an account? <button onClick={() => setStep("register")} className="font-bold text-brand-navy hover:underline">Register Nexu</button>
              </p>
              {/* Opción oculta para simular el paso de logout desde la demostración */}
              <button onClick={() => setStep("logout")} className="mt-8 text-xs text-brand-navy/20 hover:text-brand-navy/60">Test Logout Screen</button>
            </div>
          </div>
        )}

        {/* --- STEP: LOGOUT (Confirmación) --- */}
        {step === "logout" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-300 mt-16">
            <div className="w-24 h-24 rounded-full bg-brand-coral/10 text-brand-coral flex items-center justify-center mb-8 relative">
              {/* Animación del anillo de salida */}
              <div className="absolute inset-0 rounded-full border border-brand-coral/30 animate-ping"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </div>

            <h2 className="text-3xl font-extrabold mb-4 text-brand-navy tracking-tight">Log out of Nexu?</h2>
            <p className="text-base text-brand-navy/60 mb-12 px-4 leading-relaxed">
              You can always log back in to pick up where you left off.
            </p>

            <div className="w-full space-y-4">
              <button 
                onClick={handleLogout}
                className="w-full bg-brand-coral text-white font-semibold text-lg py-4 rounded-full shadow-[0_8px_20px_-6px_#FF3B3F] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Log out
              </button>
              
              <button 
                onClick={() => setStep("welcome")}
                className="w-full bg-white text-brand-navy border-2 border-brand-navy font-semibold text-lg py-4 rounded-full hover:bg-brand-gray/50 transition-all"
              >
                Stay logged in
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
