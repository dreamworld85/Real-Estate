import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { api } from "@/lib/api";
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
    <div className="min-h-screen flex flex-col justify-center px-6 py-10">
      <div className="mb-10">
        <p className="text-sm font-semibold text-gold mb-2">Kerala Realty</p>
        <h1 className="font-display font-extrabold text-3xl text-ink leading-tight">
          {mode === "login" ? "Welcome back!" : "Create your account"}
        </h1>
        <p className="text-slate mt-2">
          {mode === "login" ? "Login to continue" : "Get started listing or browsing properties"}
        </p>
      </div>

      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {mode === "register" && (
          <Input
            label="Full Name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        )}
        <Input
          label="Email or Mobile Number"
          type="text"
          placeholder="Enter email or mobile number"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
        />
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        {error && <p className="text-sm text-coral -mt-2">{error}</p>}

        {mode === "login" && (
          <button
            type="button"
            className="text-sm font-medium text-forest self-end -mt-2"
          >
            Forgot Password?
          </button>
        )}

        <Button type="submit" className="mt-4" disabled={loading}>
          {loading ? "Please wait…" : mode === "login" ? "Login" : "Create Account"}
        </Button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-charcoal/10" />
        <span className="text-sm text-slate">or</span>
        <div className="h-px flex-1 bg-charcoal/10" />
      </div>

      <Button
        variant="secondary"
        onClick={() => {
          setError(null);
          setMode((m) => (m === "login" ? "register" : "login"));
        }}
      >
        {mode === "login" ? "Create New Account" : "Back to Login"}
      </Button>

      <p className="text-xs text-slate text-center mt-8 leading-relaxed">
        By continuing, you agree to our{" "}
        <span className="text-forest font-medium">Terms &amp; Conditions</span>{" "}
        &amp;{" "}
        <span className="text-forest font-medium">Privacy Policy</span>
      </p>
    </div>
  );
}
