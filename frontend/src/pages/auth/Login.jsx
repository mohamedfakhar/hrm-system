import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      const { user, token } = res.data;

      login(user, token);
      toast.success("Welcome back to HRM Connect!");

      if (user.role === "employee") {
        navigate("/employee/dashboard");
      } else {
        navigate("/hr/dashboard");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Invalid email or password";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center p-4 md:p-8">
      {/* Main Container */}
      <main className="w-full max-w-[1140px] grid grid-cols-1 lg:grid-cols-2 bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-2xl border border-outline-variant/30 min-h-[660px]">
        
        {/* Branding Column (Left - Desktop) */}
        <section className="hidden lg:flex flex-col justify-between p-12 bg-primary-container relative overflow-hidden text-white">
          {/* Decorative glowing blobs */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary-fixed-dim/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-on-primary-fixed-variant/30 rounded-full blur-3xl pointer-events-none" />

          {/* Header & Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
                <span className="material-symbols-outlined text-3xl">hub</span>
              </div>
              <div>
                <h1 className="font-headline text-2xl font-bold tracking-tight text-white">
                  HRM Connect
                </h1>
                <p className="text-xs text-white/70 tracking-widest uppercase font-semibold">
                  Enterprise Suite
                </p>
              </div>
            </div>

            <h2 className="font-headline text-4xl font-extrabold text-white leading-tight mb-4">
              Elevate your workplace experience.
            </h2>
            <p className="text-base text-white/80 leading-relaxed max-w-sm">
              The unified platform for workforce analytics, real-time attendance, automated payroll, and streamlined team management.
            </p>
          </div>

          {/* Mini Stats Card (Glassmorphic) */}
          <div className="relative z-10 space-y-6">
            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">groups</span>
                </div>
                <div>
                  <p className="text-xs text-white/70 uppercase tracking-wider font-semibold">
                    Workforce Hub
                  </p>
                  <p className="font-headline text-xl font-bold text-white">
                    Always Connected
                  </p>
                </div>
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div className="bg-white h-full w-[85%] rounded-full" />
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-white/70">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base text-green-300">verified</span>
                Production Ready & Secure
              </span>
            </div>
          </div>
        </section>

        {/* Form Column (Right) */}
        <section className="p-8 sm:p-12 md:p-16 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-2xl">hub</span>
              </div>
              <h1 className="font-headline text-2xl font-bold text-primary">
                HRM Connect
              </h1>
            </div>

            <div className="mb-8 text-center lg:text-left">
              <h2 className="font-headline text-3xl font-extrabold text-on-surface mb-2">
                Welcome Back
              </h2>
              <p className="text-sm text-on-surface-variant">
                Sign in to manage your workspace and team.
              </p>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-error-container/40 border border-error/20 text-error text-xs flex items-center gap-3">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-on-surface uppercase tracking-wider"
                >
                  Work Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/60 focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-on-surface uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <span className="text-xs text-primary font-medium cursor-pointer hover:underline">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                    lock
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-11 pr-11 py-3 bg-surface-container-low rounded-xl border border-outline-variant/60 focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1"
                    aria-label="Toggle password visibility"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="remember"
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <label htmlFor="remember" className="text-xs text-on-surface-variant cursor-pointer">
                  Keep me signed in for 30 days
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-primary text-white font-semibold text-sm shadow-lg shadow-primary/25 hover:bg-primary-container hover:shadow-primary/35 active:scale-[0.99] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to HRM Connect</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-on-surface-variant">
              Don't have an account?{" "}
              <span className="font-semibold text-primary">
                Contact your HR Administrator
              </span>
            </p>

            {/* Footer Links */}
            <div className="mt-10 pt-6 border-t border-outline-variant/30 flex justify-center gap-6 text-xs text-outline">
              <span className="hover:text-on-surface cursor-pointer">Privacy Policy</span>
              <span className="hover:text-on-surface cursor-pointer">Terms of Service</span>
              <span className="hover:text-on-surface cursor-pointer">Help Center</span>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
