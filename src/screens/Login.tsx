import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

  const [mode, setMode] = useState<"loading" | "login" | "register" | "forgot_email" | "reset_password">("loading");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"owner" | "broker" | "agency" | "user">("user");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bannerUrl, setBannerUrl] = useState("/app_background.jpg");
  const [loadingBannerUrl, setLoadingBannerUrl] = useState("/app_background.jpg");
  const [loginHeading, setLoginHeading] = useState("Hello!");
  const [loginSubheading, setLoginSubheading] = useState("Welcome to Property");

  const bgUrl = bannerUrl.startsWith("/uploads/") ? mediaUrl(bannerUrl) : bannerUrl;
  const loadingBgUrl = loadingBannerUrl.startsWith("/uploads/") ? mediaUrl(loadingBannerUrl) : loadingBannerUrl;

  // Country Code Dropdown State
  const [countryCode, setCountryCode] = useState("+91");
  const [countryFlag, setCountryFlag] = useState("🇮🇳");
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  useEffect(() => {
    if (token && user) {
      navigate("/home", { replace: true });
      return;
    }

    if (mode === "loading") {
      const timer = setTimeout(() => {
        setMode("login");
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [token, user, navigate, mode]);

  const [connectingProvider, setConnectingProvider] = useState<"google" | "facebook" | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("oauth");
    const oauthToken = params.get("token");
    const oauthError = params.get("error");

    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      window.history.replaceState({}, document.title, window.location.pathname);
      setMode("login");
      return;
    }

    if (oauthStatus === "success") {
      window.history.replaceState({}, document.title, window.location.pathname);
      setLoading(true);

      const handleOAuthSuccess = async () => {
        try {
          if (oauthToken) {
            localStorage.setItem("kr_token", oauthToken);
          }
          const data = await api.validateSession();
          if (data && data.user) {
            const finalToken = oauthToken || localStorage.getItem("kr_token") || "";
            login(finalToken, data.user);
            const pendingLink = localStorage.getItem("pending_deep_link");
            if (pendingLink) {
              localStorage.removeItem("pending_deep_link");
              navigate(pendingLink, { replace: true });
            } else {
              navigate("/profile/edit", { replace: true });
            }
          } else {
            setError("Authentication succeeded, but failed to load user profile.");
            setMode("login");
          }
        } catch (err: any) {
          setError(err?.message || "Failed to finalize social authentication session.");
          setMode("login");
        } finally {
          setLoading(false);
        }
      };

      handleOAuthSuccess();
    }
  }, [login, navigate]);

  useEffect(() => {
    api.fetchSetting("login_banner_url")
      .then((data) => {
        if (data && data.value) {
          setBannerUrl(data.value);
        }
      })
      .catch((err) => console.error("Failed to load login banner setting:", err));

    api.fetchSetting("login_heading")
      .then((data) => {
        if (data && data.value) {
          setLoginHeading(data.value);
        }
      })
      .catch((err) => console.error("Failed to load login heading setting:", err));

    api.fetchSetting("login_subheading")
      .then((data) => {
        if (data && data.value) {
          setLoginSubheading(data.value);
        }
      })
      .catch((err) => console.error("Failed to load login subheading setting:", err));

    api.fetchSetting("loading_banner_url")
      .then((data) => {
        if (data && data.value) {
          setLoadingBannerUrl(data.value);
        }
      })
      .catch((err) => console.error("Failed to load loading banner setting:", err));
  }, []);

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

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
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
        navigate("/profile/edit");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleClick() {
    setError(null);
    setConnectingProvider("google");
    window.location.href = api.getGoogleOAuthUrl();
  }

  function handleFacebookClick() {
    setError(null);
    setConnectingProvider("facebook");
    window.location.href = api.getFacebookOAuthUrl();
  }

  if (mode === "loading") {
    return (
      <div className="min-h-screen bg-[#0D2436] flex items-center justify-center p-0 select-none overflow-x-hidden relative">
        <div 
          style={{ backgroundImage: `url(${loadingBgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
          className="w-full max-w-md min-h-screen flex flex-col justify-center relative overflow-hidden font-display shadow-2xl"
        >
          {/* Semi-transparent Dark Overlay */}
          <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />
          
          {/* Top clover-like abstract background curves */}
          <div className="absolute -top-10 -left-10 w-44 h-44 text-[#e1e9ee]/5 pointer-events-none">
            <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
              <path d="M50 0 C60 25 90 25 100 50 C75 60 75 90 50 100 C40 75 10 75 0 50 C25 40 25 10 50 0 Z" />
            </svg>
          </div>

          {/* Central Logo Panel */}
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in px-8 mt-12 select-none relative z-10">
            <img src="/brand_logo.png" alt="Logo" className="w-56 h-auto object-contain select-none animate-pulse brightness-110" />
          </div>

          {/* Bottom leaf illustration branch matching mock */}
          <div className="absolute bottom-0 right-4 w-32 h-44 pointer-events-none opacity-5 flex flex-col items-center select-none z-0">
            <div className="w-[3px] h-36 bg-white rounded-full rotate-[-25deg] origin-bottom relative">
              <div className="absolute -left-3.5 top-4 w-7 h-4 bg-white rounded-full rotate-[-45deg]" />
              <div className="absolute -right-3.5 top-8 w-7 h-4 bg-white rounded-full rotate-[45deg]" />
              <div className="absolute -left-3.5 top-12 w-7 h-4 bg-white rounded-full rotate-[-45deg]" />
              <div className="absolute -right-3.5 top-16 w-7 h-4 bg-white rounded-full rotate-[45deg]" />
              <div className="absolute -left-3.5 top-20 w-7 h-4 bg-white rounded-full rotate-[-45deg]" />
              <div className="absolute -right-3.5 top-24 w-7 h-4 bg-white rounded-full rotate-[45deg]" />
              <div className="absolute -left-3.5 top-28 w-7 h-4 bg-white rounded-full rotate-[-45deg]" />
            </div>
          </div>

        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center p-0 select-none overflow-x-hidden">
      <div 
        style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
        className="w-full max-w-md min-h-screen flex flex-col justify-start relative overflow-hidden font-display shadow-2xl"
      >
        
        {/* Header container */}
        <div 
          style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
          className="text-white p-8 relative flex flex-col justify-center items-center overflow-hidden shrink-0 h-[240px]"
        >
          {/* Semi-transparent Dark Overlay */}
          <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />

          {/* Abstract leaf shape decoration on top left */}
          <div className="absolute top-0 left-0 w-32 h-32 text-[#8AD4CB]/25 z-10 pointer-events-none">
            <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
              <path d="M0 0c50 0 80 30 80 80H0V0z" />
            </svg>
          </div>

          {/* Brand Logo centered */}
          <div className="relative z-20 w-full flex items-center justify-center select-none pt-4">
            <img 
              src="/brand_logo.png" 
              alt="Brand Logo" 
              className="w-52 h-auto object-contain filter drop-shadow-md" 
            />
          </div>
        </div>

        {/* White Rounded Form Container */}
        <div className="bg-[#F5F4F8] rounded-t-[40px] px-8 pt-12 pb-10 flex-1 flex flex-col -mt-8 z-10 shadow-2xl relative">
          
          {/* Back button for secondary modes */}
          {mode !== "login" && (
            <button 
              type="button"
              onClick={() => {
                setError(null);
                setSuccessMsg(null);
                setMode("login");
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-[#0F5B5C] mb-6 hover:opacity-80 active:scale-95 transition-all self-start"
            >
              <ArrowLeft size={16} />
              <span>Back to login</span>
            </button>
          )}

          {/* Form Title */}
          <h2 className="text-xl font-bold text-[#0F5B5C] mb-6 leading-tight select-none">
            {mode === "login"
              ? "Login"
              : mode === "register"
              ? "Sign Up"
              : mode === "forgot_email"
              ? "Forgot Password"
              : "Reset Password"}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full Name field (Register only) */}
            {mode === "register" && (
              <div className="flex items-center bg-white rounded-[8px] px-5 py-3.5 shadow-sm border border-[#59AD63]/30 gap-3 focus-within:ring-2 focus-within:ring-[#0F5B5C]/20 transition-all">
                <User size={16} className="text-slate/40 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="flex-1 bg-transparent text-xs outline-none text-charcoal font-semibold placeholder:text-slate-300"
                />
              </div>
            )}

            {/* Email or Phone field (Login only) */}
            {mode === "login" && (
              <div className="flex items-center bg-white rounded-[8px] px-5 py-3.5 shadow-sm border border-[#59AD63]/30 gap-3 focus-within:ring-2 focus-within:ring-[#0F5B5C]/20 transition-all">
                <Mail size={16} className="text-slate/40 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="Email or Mobile Number"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  className="flex-1 bg-transparent text-xs outline-none text-charcoal font-semibold placeholder:text-slate-300"
                />
              </div>
            )}

            {/* Email Address field (Register, Forgot, Reset) */}
            {(mode === "register" || mode === "forgot_email" || mode === "reset_password") && (
              <div className="flex items-center bg-white rounded-[8px] px-5 py-3.5 shadow-sm border border-[#59AD63]/30 gap-3 focus-within:ring-2 focus-within:ring-[#0F5B5C]/20 transition-all">
                <Mail size={16} className="text-slate/40 shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="flex-1 bg-transparent text-xs outline-none text-charcoal font-semibold placeholder:text-slate-300"
                />
              </div>
            )}

            {/* Country Selector + Phone input field (Register only) */}
            {mode === "register" && (
              <div className="flex gap-2 relative">
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="bg-white rounded-[8px] px-4 py-3.5 text-xs text-charcoal flex items-center gap-1.5 hover:bg-slate-50 shadow-sm border border-[#59AD63]/30 select-none whitespace-nowrap min-w-[76px] justify-center cursor-pointer font-bold"
                >
                  <span className="text-sm leading-none">{countryFlag}</span>
                  <span className="font-semibold">{countryCode}</span>
                </button>

                <div className="flex-1 flex items-center bg-white rounded-[8px] px-5 py-3.5 shadow-sm border border-[#59AD63]/30 gap-3 focus-within:ring-2 focus-within:ring-[#0F5B5C]/20 transition-all">
                  <Phone size={16} className="text-slate/40 shrink-0" />
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    autoComplete="tel"
                    className="flex-1 bg-transparent text-xs outline-none text-charcoal font-semibold placeholder:text-slate-300"
                  />
                </div>

                {showCountryDropdown && (
                  <div className="absolute left-0 top-[46px] w-64 bg-white border border-[#59AD63]/30 rounded-[8px] p-2.5 z-50 shadow-2xl flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Search country name or code..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full bg-slate-50 border border-[#59AD63]/30 rounded-lg px-2.5 py-1.5 text-[11px] text-charcoal placeholder-charcoal/30 focus:outline-none focus:border-ink"
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
                            className="w-full text-left flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-50 text-charcoal text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <span>{c.flag}</span>
                              <span>{c.name}</span>
                            </span>
                            <span className="text-slate/60">{c.code}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* OTP input field (Reset only) */}
            {mode === "reset_password" && (
              <div className="flex items-center bg-white rounded-[8px] px-5 py-3.5 shadow-sm border border-[#59AD63]/30 gap-3 focus-within:ring-2 focus-within:ring-[#0F5B5C]/20 transition-all">
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="Enter 6-Digit OTP Code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-transparent text-center font-mono tracking-widest text-xs outline-none text-charcoal font-semibold placeholder:text-slate-300"
                />
              </div>
            )}

            {/* Password input field (Login and Register) */}
            {(mode === "login" || mode === "register") && (
              <div className="flex items-center bg-white rounded-[8px] px-5 py-3.5 shadow-sm border border-[#59AD63]/30 gap-3 focus-within:ring-2 focus-within:ring-[#0F5B5C]/20 transition-all">
                <Lock size={16} className="text-slate/40 shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="flex-1 bg-transparent text-xs outline-none text-charcoal font-semibold placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-slate/40 hover:text-charcoal transition-colors shrink-0"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}

            {/* New Password input field (Reset only) */}
            {mode === "reset_password" && (
              <div className="flex items-center bg-white rounded-[8px] px-5 py-3.5 shadow-sm border border-[#59AD63]/30 gap-3 focus-within:ring-2 focus-within:ring-[#0F5B5C]/20 transition-all">
                <Lock size={16} className="text-slate/40 shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="New Password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="flex-1 bg-transparent text-xs outline-none text-charcoal font-semibold placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-slate/40 hover:text-charcoal transition-colors shrink-0"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}


            {/* Forgot password link */}
            {mode === "login" && (
              <button 
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMsg(null);
                  setMode("forgot_email");
                }}
                className="text-[10px] font-bold text-slate/70 hover:text-charcoal block text-right mt-1 uppercase tracking-wider self-end"
              >
                Forgot Password
              </button>
            )}

            {/* Error & Success Messages */}
            {successMsg && <p className="text-[11px] text-emerald-600 font-semibold mt-1 bg-emerald-50 p-2 rounded-lg border border-emerald-500/10 text-left">{successMsg}</p>}
            {error && <p className="text-[11px] text-coral font-semibold mt-1 text-left">{error}</p>}

            {/* Form Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 bg-[#0F5B5C] hover:bg-[#0F5B5C]/90 text-white rounded-[2px] text-xs font-bold tracking-wider uppercase shadow-md shadow-[#0F5B5C]/20 transition-all active:scale-[0.98] disabled:bg-slate/30 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer ${mode === "register" ? "mt-3" : "mt-2"}`}
            >
              <span>{loading ? "Processing..." : mode === "login" ? "Login" : mode === "register" ? "Sign Up" : "Submit"}</span>
            </button>
          </form>

          {/* Social login option */}
          {(mode === "login" || mode === "register") && (
            <>
              {/* Divider */}
              <div className="flex items-center gap-3 my-5 select-none">
                <div className="h-[1px] flex-1 bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
                <div className="h-[1px] flex-1 bg-slate-200" />
              </div>

              {/* Social Login Full Width Buttons */}
              <div className="flex flex-col gap-3 mb-6">
                {/* Continue with Google */}
                <button 
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={loading || connectingProvider !== null}
                  className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 rounded-[8px] border border-gray-300 shadow-xs flex items-center justify-center gap-3 font-semibold text-xs transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {connectingProvider === "google" ? (
                    <span className="text-gray-500 font-bold">Connecting to Google...</span>
                  ) : (
                    <>
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                {/* Continue with Facebook */}
                <button 
                  type="button"
                  onClick={handleFacebookClick}
                  disabled={loading || connectingProvider !== null}
                  className="w-full py-3.5 px-4 bg-[#1877F2] hover:bg-[#166fe5] active:bg-[#1465d2] text-white rounded-[8px] shadow-xs flex items-center justify-center gap-3 font-semibold text-xs transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {connectingProvider === "facebook" ? (
                    <span className="font-bold">Connecting to Facebook...</span>
                  ) : (
                    <>
                      <svg className="w-5 h-5 fill-current text-white shrink-0" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span>Continue with Facebook</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Toggle login vs register links */}
          <p className="text-center text-slate text-xs font-semibold select-none mt-auto">
            {mode === "login" ? (
              <>
                Don't have account?{" "}
                <button 
                  type="button" 
                  onClick={() => { setError(null); setSuccessMsg(null); setMode("register"); }} 
                  className="font-bold text-[#0F5B5C] hover:underline cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button 
                  type="button" 
                  onClick={() => { setError(null); setSuccessMsg(null); setMode("login"); }} 
                  className="font-bold text-[#0F5B5C] hover:underline cursor-pointer"
                >
                  Login
                </button>
              </>
            )}
          </p>

        </div>

      </div>

    </div>
  );
}
