import { Sparkles, X, Phone } from "lucide-react";

interface PropertyActivationModalProps {
  onClose: () => void;
  onUpgrade: () => void;
  onContinueFree: () => void;
}

export default function PropertyActivationModal({
  onClose,
  onUpgrade,
  onContinueFree,
}: PropertyActivationModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-cream rounded-3xl p-6 w-full max-w-[380px] border border-charcoal/10 shadow-2xl relative flex flex-col items-center text-center gap-5 animate-slide-up font-display"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-slate-100/80 rounded-full text-slate transition-all cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mt-2 shadow-inner">
          <Phone size={30} className="animate-pulse" />
        </div>

        <div>
          <h3 className="font-extrabold text-xl text-ink">Free Tier Activation</h3>
          <p className="text-xs text-slate/85 mt-2.5 px-1 leading-relaxed">
            You are currently on the free/unpaid tier. If you activate this property without a premium subscription, the contact number displayed to buyers will be the <strong>Admin's number</strong>, and Admin will handle the inquiries/deals.
          </p>
          <p className="text-[11px] text-forest font-bold mt-2 bg-emerald-50 px-2.5 py-1 rounded-xl inline-block border border-emerald-500/10">
            To show your own direct number, please upgrade to a Premium Plan.
          </p>
        </div>

        <div className="w-full flex flex-col gap-2.5 mt-2">
          <button
            onClick={onUpgrade}
            className="w-full py-3.5 bg-ink hover:bg-black text-cream rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles size={14} className="text-gold" /> Upgrade to Premium
          </button>
          
          <button
            onClick={onContinueFree}
            className="w-full py-3.5 bg-white border border-charcoal/15 text-charcoal hover:bg-slate-50 rounded-2xl text-xs font-bold shadow-sm hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
          >
            Continue with Admin Number / Free
          </button>

          <button 
            onClick={onClose} 
            className="w-full py-1 text-xs font-bold text-slate/80 hover:text-charcoal cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
