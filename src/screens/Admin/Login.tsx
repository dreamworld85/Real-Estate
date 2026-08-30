import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, AlertCircle, Building2 } from "lucide-react";
import { adminApi } from "@/lib/adminApi";

export default function Login() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = await adminApi.login(password);
      localStorage.setItem("kerala_realty_admin_token", token);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-charcoal max-w-[420px] mx-auto relative">
      <div className="w-full flex flex-col gap-6 max-w-[340px]">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md">
            <Building2 size={28} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl tracking-tight text-black">Sparrows Property Admin</h1>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Admin Workspace</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white border border-charcoal/10 p-5 rounded-3xl shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate">Username</label>
            <div className="flex items-center bg-slate-50 border border-charcoal/8 rounded-xl px-3.5 py-3 text-slate select-none">
              <span className="text-sm font-semibold">admin</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate">Admin Password</label>
            <div className="flex items-center bg-slate-50 border border-charcoal/8 focus-within:border-emerald-600 rounded-xl px-3.5 py-3 transition-all">
              <Lock size={16} className="text-slate mr-2.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none text-charcoal placeholder:text-slate/30"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl">
              <AlertCircle size={15} className="shrink-0" />
              <span className="text-[11px] font-medium leading-tight">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed mt-2 shadow-sm"
          >
            {loading ? "Authenticating..." : "Sign In to Workspace"}
          </button>
        </form>

        <p className="text-[10px] text-center text-slate/50 font-medium">
          Authorized administrative access only. Activity is audited.
        </p>
      </div>
    </div>
  );
}
