import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { api, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState("/kerala_house_login.jpg");

  useEffect(() => {
    api.fetchSetting("login_banner_url")
      .then((data) => {
        if (data && data.value) {
          setBannerUrl(data.value);
        }
      })
      .catch((err) => console.error("Failed to load login banner setting:", err));
  }, []);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { token, user } = await api.login(identifier, password);
        login(token, user);
      } else {
        const isEmail = identifier.includes("@");
        const { token, user } = await api.register({
          name,
          email: isEmail ? identifier : undefined,
          phone: isEmail ? undefined : identifier,
          password,
        });
        login(token, user);
      }
      navigate("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex flex-col justify-center p-6 overflow-x-hidden">
      {/* Dynamic Background Image */}
      <img 
        src={mediaUrl(bannerUrl)} 
        alt="Login Background" 
        className="absolute inset-0 w-full h-full object-cover brightness-[0.5]"
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/85" />

      {/* Content wrapper */}
      <div className="relative z-10 w-full flex flex-col gap-6 max-w-sm mx-auto">
        {/* Text Header */}
        <div className="text-left mt-2">
          <span className="text-[10px] font-bold text-gold uppercase tracking-widest mb-1.5 block">
            Kerala Realty
          </span>
          <h1 className="font-display font-extrabold text-3xl text-white leading-tight tracking-wide">
            Find Your <br />
            <span className="text-[#c89b3c]">Dream Home</span>
          </h1>
          <p className="text-white/70 text-xs mt-2 max-w-[280px] leading-relaxed">
            Discover amazing properties in the best locations.
          </p>
        </div>

        {/* Glassmorphism Input Form Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white">
          <div className="mb-1">
            <h2 className="font-display font-extrabold text-lg text-white">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-white/60 text-[10px] mt-0.5">
              {mode === "login" ? "Login to access your dashboard" : "Get started by registering below"}
            </p>
          </div>

          <form
            className="flex flex-col gap-3.5"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            {mode === "register" && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-white/80">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all"
                />
              </div>
            )}
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-white/80">Email or Mobile Number</label>
              <input
                type="text"
                placeholder="Enter email or mobile number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                className="w-full bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-white/80">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white placeholder-white/40 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-[11px] text-coral font-semibold mt-0.5">{error}</p>}

            {mode === "login" && (
              <button
                type="button"
                className="text-[10px] font-semibold text-white/80 hover:text-white self-end"
              >
                Forgot Password?
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2.5 py-3 bg-[#c89b3c] hover:bg-[#b08834] text-white rounded-xl text-xs font-bold font-display shadow-md transition-all active:scale-[0.98] disabled:bg-slate/30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? "Please wait…" : mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-2">
            <div className="h-px flex-1 bg-white/15" />
            <span className="text-[10px] text-white/50 uppercase tracking-wider">or</span>
            <div className="h-px flex-1 bg-white/15" />
          </div>

          <button
            onClick={() => {
              setError(null);
              setMode((m) => (m === "login" ? "register" : "login"));
            }}
            className="w-full py-3 border border-white/20 hover:bg-white/5 text-white rounded-xl text-xs font-bold font-display transition-all active:scale-[0.98]"
          >
            {mode === "login" ? "Create New Account" : "Back to Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
