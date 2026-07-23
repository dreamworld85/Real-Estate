import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, AlertTriangle, Send } from "lucide-react";
import { api, ApiPropertyDetail } from "@/lib/api";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

const reportReasons = [
  "Spam or Duplicate listing",
  "Fraud or Misleading details",
  "Offensive content or Rude behavior",
  "Property no longer available / Sold",
  "Incorrect pricing or location",
  "Other",
];

export default function ReportProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<ApiPropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.fetchProperty(id)
      .then((data) => setProperty(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttemptedSubmit(true);
    if (!selectedReason || !id) return;

    setSubmitting(true);
    setError(null);
    try {
      await api.reportProperty(id, selectedReason, description);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/property/${id}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="px-6 py-10 text-sm text-slate">Loading listing details…</p>;
  }

  return (
    <div className="min-h-screen flex flex-col pb-28 bg-slate-50">
      {/* Custom Clean Header */}
      <div className="flex items-center px-4 py-4 bg-white border-b border-charcoal/5 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-1 hover:bg-slate-100 rounded-full text-ink transition-colors mr-2"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display font-extrabold text-md text-black">Report Listing</h1>
      </div>

      <div className="px-6 py-5 flex flex-col gap-5 flex-1 max-w-[420px] mx-auto w-full">
        {property && (
          <div className="bg-white border border-charcoal/5 p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <div className="bg-amber-50 rounded-xl p-2.5 text-amber-600">
              <AlertTriangle size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate uppercase font-bold tracking-wider">You are reporting</p>
              <p className="font-display font-bold text-sm text-ink truncate mt-0.5">{property.title}</p>
              <p className="text-xs text-slate font-semibold mt-0.5">{property.district}</p>
            </div>
          </div>
        )}

        {success ? (
          <div className="bg-emerald-50 border border-emerald-500/10 p-6 rounded-3xl text-center flex flex-col items-center gap-3 py-10 shadow-sm animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg">✓</div>
            <h3 className="font-display font-bold text-base text-emerald-800">Report Submitted</h3>
            <p className="text-xs text-emerald-700/80 leading-relaxed max-w-[240px]">
              Thank you for reporting. Our moderation team will investigate this listing shortly. Redirecting you...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
            {/* Reason selector card */}
            <div className="bg-white border border-charcoal/5 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center pl-0.5">
                <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Select a reason</span>
                {attemptedSubmit && !selectedReason && (
                  <span className="text-[10px] text-rose-500 font-bold">Required</span>
                )}
              </div>

              <div className={`flex flex-col gap-2 rounded-2xl p-1 transition-all ${attemptedSubmit && !selectedReason ? "border border-rose-500 bg-rose-50/5 shadow-sm shadow-rose-100" : ""}`}>
                {reportReasons.map((reason) => {
                  const active = selectedReason === reason;
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setSelectedReason(reason)}
                      className={`w-full py-3 px-4 rounded-xl text-left text-xs font-bold border transition-all flex items-center justify-between ${
                        active
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                          : "bg-slate-50 border-charcoal/8 text-charcoal hover:bg-slate-100"
                      }`}
                    >
                      <span>{reason}</span>
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${active ? "border-white bg-white text-emerald-600" : "border-slate-300 bg-white"}`}>
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description textarea card */}
            <div className="bg-white border border-charcoal/5 p-5 rounded-3xl shadow-sm flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate uppercase tracking-wider pl-0.5">Additional Details</span>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the issue in detail (e.g. wrong phone number, incorrect pricing, owner is asking for advance deposits)..."
                className="w-full rounded-xl border border-charcoal/10 bg-slate-50 px-4 py-3 text-xs text-charcoal placeholder:text-slate/40 focus:border-emerald-600/50 outline-none resize-none shadow-inner h-28"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-500 font-semibold text-center mt-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 mt-2 rounded-xl font-display font-semibold text-[15px] transition-all shadow-md bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send size={15} />
              <span>{submitting ? "Submitting Report…" : "Submit Report"}</span>
            </button>
          </form>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
