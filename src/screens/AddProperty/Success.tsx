import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
import { api } from "@/lib/api";
import BottomNav from "@/components/BottomNav";

export default function Success() {
  const navigate = useNavigate();
  const { reset, lastSubmittedStatus } = useAddProperty();
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isOverLimit = !!lastSubmittedStatus?.isOverLimit;

  const handlePublish = async () => {
    const propId = lastSubmittedStatus?.id;
    if (!propId) {
      reset();
      navigate("/my-properties");
      return;
    }

    setPublishing(true);
    setErrorMsg(null);
    try {
      await api.updatePropertyStatus(propId, "Active");
      reset();
      navigate(`/property/${propId}`);
    } catch (err: any) {
      if (err.requiresActivationChoice) {
        setErrorMsg("Standard activation failed: You need a Premium Subscription to publish this listing with your own number.");
      } else {
        setErrorMsg(err.message || "Failed to publish property");
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center pb-28">
      {isOverLimit ? (
        <>
          <div className="w-20 h-20 rounded-full bg-rose-50 border-4 border-rose-100 flex items-center justify-center mb-6 shadow-inner animate-pulse">
            <ShieldAlert size={40} className="text-rose-500" strokeWidth={2} />
          </div>

          <h1 className="font-display font-extrabold text-[18px] text-ink mb-2">
            Limit Reached!
          </h1>
          <p className="text-slate leading-relaxed mb-1 text-xs">
            Your property was submitted but is currently locked in <strong className="text-charcoal">Inactive</strong> status because you've exceeded your free posting limit.
          </p>
          <span className="inline-block mt-3.5 mb-10 text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 rounded-full px-3 py-1.5 uppercase tracking-wider">
            Inactive - Limit Exceeded
          </span>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => {
                reset();
                navigate("/subscription");
              }}
              className="w-full bg-[#59AD63] hover:bg-[#3F8F4B] text-white font-display font-bold text-[14px] py-4 rounded-2xl transition-all shadow-md active:scale-[0.99] cursor-pointer"
            >
              Upgrade & Activate Now
            </button>
            <button
              className="text-sm font-semibold text-slate py-2 hover:text-charcoal transition-all"
              onClick={() => {
                reset();
                navigate("/my-properties");
              }}
            >
              View My Inactive Listings
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="w-20 h-20 rounded-full bg-[#59AD63] flex items-center justify-center mb-6">
            <CheckCircle2 size={40} className="text-white" strokeWidth={2} />
          </div>

          <h1 className="font-display font-extrabold text-[18px] text-ink mb-2">
            Successful
          </h1>
          <p className="text-slate leading-relaxed mb-8">
            Your property has been submitted successfully.
          </p>

          {errorMsg && (
            <p className="text-xs text-rose-600 font-bold mb-4 bg-rose-50 border border-rose-100 rounded-[8px] p-2 w-full">
              {errorMsg}
            </p>
          )}

          <div className="w-full flex flex-col gap-3.5">
            {errorMsg && errorMsg.includes("Premium") && (
              <button
                type="button"
                onClick={() => {
                  reset();
                  navigate("/subscription");
                }}
                className="w-full bg-[#59AD63] hover:bg-[#3F8F4B] text-white font-display font-extrabold text-xs tracking-wider uppercase py-3.5 rounded-[2px] border border-white/5 shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer animate-fade-in"
              >
                Upgrade to Premium
              </button>
            )}
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="w-full bg-[#59AD63] hover:bg-[#3F8F4B] text-white font-display font-extrabold text-xs tracking-wider uppercase py-3.5 rounded-[2px] border border-white/5 shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {publishing ? "Publishing..." : "Publish My Property"}
            </button>
            
            <button
              className="text-xs font-extrabold text-[#59AD63] uppercase tracking-wider py-2 hover:text-[#3F8F4B] transition-all cursor-pointer"
              onClick={() => {
                reset();
                navigate("/add-property");
              }}
            >
              Add Another Property
            </button>
          </div>
        </>
      )}
      <BottomNav />
    </div>
  );
}
