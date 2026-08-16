import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { api, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const countries = [
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+968", name: "Oman", flag: "🇴🇲" },
  { code: "+974", name: "Qatar", flag: "🇶🇦" },
  { code: "+973", name: "Bahrain", flag: "🇧🇭" },
  { code: "+965", name: "Kuwait", flag: "🇰🇼" },
  { code: "+1", name: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", name: "UK", flag: "🇬🇧" },
  { code: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, token, user } = useAuth();

  useEffect(() => {
    if (token && user) {
      navigate("/home", { replace: true });
    }
  }, [token, user, navigate]);

  const [mode, setMode] = useState<"login" | "register" | "forgot_email" | "reset_password">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"Owner" | "Broker" | "Agency" | "User">("User");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bannerUrl, setBannerUrl] = useState("/kerala_house_login.jpg");

  // Country Code Dropdown State
  const [countryCode, setCountryCode] = useState("+91");
  const [countryFlag, setCountryFlag] = useState("🇮🇳");
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const handlePhoneChange = (val: string) => {
    let cleaned = val.replace(/[^\d+]/g, "");

    if (cleaned.startsWith("+")) {
      const sortedCountries = [...countries].sort((a, b) => b.code.length - a.code.length);
      for (const c of sortedCountries) {
        if (cleaned.startsWith(c.code)) {
          setCountryCode(c.code);
          setCountryFlag(c.flag);
          cleaned = cleaned.substring(c.code.length);
          break;
        }
      }
    } else {
      const sortedCountries = [...countries].sort((a, b) => b.code.length - a.code.length);
      for (const c of sortedCountries) {
        const codeWithoutPlus = c.code.substring(1);
        if (cleaned.startsWith(codeWithoutPlus)) {
          setCountryCode(c.code);
          setCountryFlag(c.flag);
          cleaned = cleaned.substring(codeWithoutPlus.length);
          break;
        }
      }
    }
    setPhone(cleaned);
  };

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
    setSuccessMsg(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { token, user } = await api.login(identifier.trim(), password);
        login(token, user);
      } else if (mode === "register") {
        const fullPhone = phone.trim() ? (countryCode + phone.trim()) : undefined;
        const { token, user } = await api.register({
          name,
          email: email.trim() || undefined,
          phone: fullPhone,
          password,
          role,
        });
        login(token, user);
      } else if (mode === "forgot_email") {
        const targetEmail = email.trim() || identifier.trim();
        if (!targetEmail) {
          setError("Please enter your registered email address.");
          setLoading(false);
          return;
        }
        const res = await api.forgotPassword(targetEmail);
        setEmail(targetEmail);
        setSuccessMsg(res.message || "OTP code sent to your registered email address.");
        setMode("reset_password");
        setLoading(false);
        return;
      } else if (mode === "reset_password") {
        const targetEmail = email.trim() || identifier.trim();
        if (!targetEmail || !otp.trim() || !newPassword) {
          setError("Please enter your email, OTP code, and new password.");
          setLoading(false);
          return;
        }
        const { token, user } = await api.resetPasswordWithOtp({
          email: targetEmail,
          otp: otp.trim(),
          newPassword,
        });
        login(token, user);
      }

      const pendingLink = localStorage.getItem("pending_deep_link");
      if (pendingLink) {
        localStorage.removeItem("pending_deep_link");
        navigate(pendingLink);
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex flex-col justify-start pt-10 md:pt-16 px-4 pb-4 overflow-x-hidden">
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
              {mode === "login"
                ? "Welcome Back"
                : mode === "register"
                ? "Create Account"
                : mode === "forgot_email"
                ? "Forgot Password"
                : "Reset Password with OTP"}
            </h2>
            <p className="text-white/60 text-[10px] mt-0.5">
              {mode === "login"
                ? "Login to access your dashboard"
                : mode === "register"
                ? "Get started by registering below"
                : mode === "forgot_email"
                ? "We will send an OTP to your registered email"
                : "Enter the OTP code sent to your email and your new password"}
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
            
            {mode === "login" && (
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
            )}

            {mode === "register" && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-white/80">Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-white/80">Mobile Number</label>
                  <div className="flex gap-2 relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white flex items-center gap-1.5 hover:bg-white/15 transition-all select-none whitespace-nowrap min-w-[76px] justify-center cursor-pointer"
                    >
                      <span className="text-sm leading-none">{countryFlag}</span>
                      <span className="font-semibold">{countryCode}</span>
                    </button>

                    <input
                      type="tel"
                      placeholder="Enter mobile number"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      autoComplete="tel"
                      className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all"
                    />

                    {showCountryDropdown && (
                      <div className="absolute left-0 top-[46px] w-64 bg-charcoal border border-white/20 rounded-2xl p-2.5 z-50 shadow-2xl flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Search country name or code..."
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="w-full bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-white/40 focus:outline-none focus:border-gold"
                        />
                        <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto no-scrollbar">
                          {countries
                            .filter(
                              (c) =>
                                c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                c.code.includes(countrySearch)
                            )
                            .map((c) => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => {
                                  setCountryCode(c.code);
                                  setCountryFlag(c.flag);
                                  setShowCountryDropdown(false);
                                  setCountrySearch("");
                                }}
                                className="w-full text-left flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/10 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                <span className="flex items-center gap-2">
                                  <span>{c.flag}</span>
                                  <span>{c.name}</span>
                                </span>
                                <span className="text-white/60">{c.code}</span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {(mode === "forgot_email" || mode === "reset_password") && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-white/80">Registered Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all"
                />
              </div>
            )}

            {mode === "reset_password" && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-white/80">6-Digit OTP Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 font-mono tracking-widest text-center text-sm focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-all"
                />
              </div>
            )}

            {(mode === "login" || mode === "register") && (
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
            )}

            {mode === "reset_password" && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-white/80">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
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
            )}

            {successMsg && <p className="text-[11px] text-emerald-400 font-semibold mt-0.5 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20">{successMsg}</p>}
            {error && <p className="text-[11px] text-coral font-semibold mt-0.5">{error}</p>}

            {mode === "login" && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMsg(null);
                  setMode("forgot_email");
                }}
                className="text-[10px] font-semibold text-gold hover:underline self-end cursor-pointer"
              >
                Forgot Password?
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2.5 py-3 bg-[#c89b3c] hover:bg-[#b08834] text-white rounded-xl text-xs font-bold font-display shadow-md transition-all active:scale-[0.98] disabled:bg-slate/30 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading
                ? "Please wait…"
                : mode === "login"
                ? "Login"
                : mode === "register"
                ? "Create Account"
                : mode === "forgot_email"
                ? "Send OTP Code"
                : "Reset Password & Login"}
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
              setSuccessMsg(null);
              setMode((m) => (m === "login" ? "register" : "login"));
              setName("");
              setIdentifier("");
              setEmail("");
              setPhone("");
              setPassword("");
              setOtp("");
              setNewPassword("");
            }}
            className="w-full py-3 border border-white/20 hover:bg-white/5 text-white rounded-xl text-xs font-bold font-display transition-all active:scale-[0.98] cursor-pointer"
          >
            {mode === "login" ? "Create New Account" : "Back to Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
