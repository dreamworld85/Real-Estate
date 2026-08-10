import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { X, User, Wrench, Building2, UploadCloud, ChevronLeft, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
import { useAuth } from "@/lib/AuthContext";
import { ListingRole } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import SubscriptionPaywallModal from "@/components/SubscriptionPaywallModal";
import { api } from "@/lib/api";

const rolesList: { role: ListingRole; icon: typeof User; label: string; desc: string }[] = [
  { 
    role: "Owner", 
    icon: User, 
    label: "Owner", 
    desc: "Individual property owner selling or renting personal spaces." 
  },
  { 
    role: "Broker", 
    icon: Wrench, 
    label: "Broker", 
    desc: "Independent agent managing property portfolios for clients." 
  },
  { 
    role: "Agency", 
    icon: Building2, 
    label: "Agency", 
    desc: "Real estate agency listing properties with corporate branding." 
  },
];

export default function ChooseRole() {
  const navigate = useNavigate();
  const { form, update } = useAddProperty();
  const { user, token, login } = useAuth();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<"choose" | "setup">("choose");
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [plans, setPlans] = useState<any[]>([]);

  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [switchTargetRole, setSwitchTargetRole] = useState<string>("");
  const [switchSubmitting, setSwitchSubmitting] = useState(false);
  const [switchSuccessMessage, setSwitchSuccessMessage] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  useEffect(() => {
    api.fetchSubscriptionPlans()
      .then((data) => setPlans(data))
      .catch((err) => console.error("Error loading plans:", err));
  }, []);

  const selectedRoleLower = form.role?.toLowerCase() || "";
  const freePlan = plans.find(p => p.role.toLowerCase() === selectedRoleLower && Number(p.duration_months) === 0);
  const premiumPlan = plans.find(p => p.role.toLowerCase() === selectedRoleLower && Number(p.duration_months) === 1);

  const freeFeatures: string[] = (() => {
    if (!freePlan?.features) return [];
    try {
      return typeof freePlan.features === 'string' ? JSON.parse(freePlan.features) : freePlan.features;
    } catch {
      return [];
    }
  })();

  const premiumFeatures: string[] = (() => {
    if (!premiumPlan?.features) return [];
    try {
      return typeof premiumPlan.features === 'string' ? JSON.parse(premiumPlan.features) : premiumPlan.features;
    } catch {
      return [];
    }
  })();

  const isRoleAlreadyLocked = Boolean(user?.role && user.role.toLowerCase() !== "user");

  // Pre-populate data from profile
  useEffect(() => {
    const lockedRole = (isRoleAlreadyLocked && user?.role) 
      ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) as ListingRole 
      : null;
    const initialRole = lockedRole || form.role || "Owner";
    const contact = form.contactPhone || user?.phone || "";

    update({ 
      role: initialRole,
      ownerName: form.ownerName || (initialRole === "Owner" ? user?.name || "" : ""),
      brokerName: form.brokerName || (initialRole === "Broker" ? user?.name || "" : ""),
      agencyName: form.agencyName || (initialRole === "Agency" ? user?.name || "" : ""),
      contactPhone: contact,
      sameAsContact: form.sameAsContact !== undefined ? form.sameAsContact : true,
      whatsappNumber: form.whatsappNumber || contact,
    });

    if (isRoleAlreadyLocked) {
      setStage("setup");
    }
  }, [user, isRoleAlreadyLocked]);

  useEffect(() => {
    if (form.sameAsContact) {
      update({ whatsappNumber: form.contactPhone });
    }
  }, [form.contactPhone, form.sameAsContact, update]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/jpg") {
        update({ agencyLogo: file });
      } else {
        alert("Please upload a PNG or JPEG image for the agency logo.");
      }
    }
    e.target.value = "";
  };

  const districts = [
    "Wayanad", "Kozhikode", "Kannur", "Kasaragod", "Malappuram", "Palakkad",
    "Thrissur", "Ernakulam", "Idukki", "Kottayam", "Alappuzha", "Pathanamthitta",
    "Kollam", "Thiruvananthapuram",
  ];

  const validatePhone = (num: string) => num && num.trim().length >= 8;

  const isSetupValid = (() => {
    if (!form.role) return false;
    const hasContact = validatePhone(form.contactPhone) && validatePhone(form.whatsappNumber);
    if (!hasContact) return false;

    if (form.role === "Owner") {
      return !!form.ownerName.trim();
    }
    if (form.role === "Broker") {
      return !!form.brokerName.trim();
    }
    if (form.role === "Agency") {
      return !!form.agencyName.trim() && 
             !!form.agencyAddress?.trim() && 
             !!form.agencyDistrict && 
             (isRoleAlreadyLocked ? true : !!form.agencyLogo);
    }
    return false;
  })();

  const handleConfirmRole = async () => {
    if (isRoleAlreadyLocked) {
      // Just proceed to details step
      navigate("/add-property/details");
      return;
    }

    setSubmitting(true);
    setSetupError(null);
    try {
      const fd = new FormData();
      fd.append("role", (form.role || "owner").toLowerCase());
      fd.append("contactPhone", form.contactPhone);
      fd.append("whatsappNumber", form.whatsappNumber);

      if (form.role === "Owner") {
        fd.append("ownerName", form.ownerName);
      } else if (form.role === "Broker") {
        fd.append("brokerName", form.brokerName);
      } else if (form.role === "Agency") {
        fd.append("agencyName", form.agencyName);
        if (form.agencyAddress) {
          fd.append("agencyAddress", form.agencyAddress);
        }
        if (form.agencyDistrict) {
          fd.append("agencyDistrict", form.agencyDistrict);
        }
        if (form.agencyLogo) {
          fd.append("agencyLogo", form.agencyLogo);
        }
      }

      const res = await api.setupRole(fd);
      if (res && res.user && token) {
        login(token, res.user);
      }
      navigate("/add-property/details");
    } catch (err: any) {
      setSetupError(err.message || "Failed to complete role onboarding. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-28 bg-slate-50">
      {/* Header */}
      <header className="flex flex-col bg-white border-b border-charcoal/8">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            {stage === "setup" && !isRoleAlreadyLocked && (
              <button 
                onClick={() => setStage("choose")}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors mr-1 cursor-pointer"
              >
                <ChevronLeft size={20} className="text-ink" />
              </button>
            )}
            <h1 className="font-display font-extrabold text-[20px] text-ink">Add Property</h1>
          </div>
          <button 
            onClick={() => navigate("/home")} 
            className="p-1.5 hover:bg-charcoal/5 rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} className="text-ink" />
          </button>
        </div>
        <div className="relative h-1 bg-slate-100 w-full overflow-hidden">
          <div className={`absolute top-0 left-0 h-full w-[16.6%] bg-charcoal transition-all ${stage === "setup" ? "w-[33.3%]" : ""}`}></div>
        </div>
      </header>

      <div className="px-6 py-6 flex-1 flex flex-col gap-5 max-w-lg mx-auto w-full">
        {stage === "choose" ? (
          <>
            <div>
              <h2 className="font-display font-bold text-[17px] text-ink leading-tight">
                How are you listing?
              </h2>
              <p className="text-slate text-xs mt-0.5 font-medium">
                Choose one option to setup your listing workspace
              </p>
            </div>

            {/* Compact Grid selector */}
            <div className="grid grid-cols-3 gap-2.5">
              {rolesList.map(({ role, icon: Icon, label }) => {
                const selected = form.role === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => update({ role })}
                    className={`relative flex flex-col items-center justify-center rounded-xl py-2.5 px-1.5 border transition-all cursor-pointer ${
                      selected 
                        ? "border-black bg-white ring-1 ring-black shadow-sm" 
                        : "border-charcoal/10 bg-white hover:border-charcoal/20 active:scale-[0.98]"
                    }`}
                  >
                    {/* Radio Indicator (Top Right) */}
                    <div className="absolute top-1.5 right-1.5">
                      <div className={`w-3 h-3 rounded-full border flex items-center justify-center transition-all ${
                        selected ? "border-black bg-black text-white" : "border-charcoal/20"
                      }`}>
                        {selected && <div className="w-1 h-1 rounded-full bg-white" />}
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="mt-1">
                      <Icon size={16} className={selected ? "text-black" : "text-slate"} />
                    </div>

                    {/* Label */}
                    <span className={`font-display font-bold text-[11px] mt-1 ${selected ? "text-black" : "text-slate"}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Features Description Card */}
            {form.role && (
              <div className="bg-white border border-charcoal/5 rounded-2xl p-4 shadow-sm flex flex-col gap-3.5 font-display text-left">
                <div className="border-b border-slate-100/80 pb-2">
                  <h3 className="font-extrabold text-xs text-ink">{form.role} Features</h3>
                  <p className="text-[10px] text-slate mt-0.5 leading-snug font-medium">
                    {freePlan?.description || rolesList.find(r => r.role === form.role)?.desc}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-bold text-slate/50 uppercase tracking-wider block mb-1">Free Plan</span>
                    <div className="flex flex-col gap-1.5">
                      {freeFeatures.map((feat, index) => (
                        <div key={index} className="flex items-start gap-1 text-[11px] font-medium text-slate-800 leading-snug">
                          <CheckCircle2 size={11} className="text-forest shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                      {freeFeatures.length === 0 && (
                        <span className="text-[10px] text-slate/30 italic">No free features.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Premium Plan</span>
                    <div className="flex flex-col gap-1.5">
                      {premiumFeatures.map((feat, index) => (
                        <div key={index} className="flex items-start gap-1 text-[11px] font-medium text-slate-800 leading-snug">
                          <Sparkles size={11} className="text-amber-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                      {premiumFeatures.length === 0 && (
                        <span className="text-[10px] text-slate/30 italic">No premium features.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* View plans popup trigger */}
                <button
                  type="button"
                  onClick={() => setShowPlansModal(true)}
                  className="w-full mt-1.5 py-2.5 border border-emerald-600/10 bg-emerald-50 hover:bg-emerald-100/50 text-emerald-700 text-[10px] font-extrabold rounded-lg uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  View Details & Pricing
                </button>
              </div>
            )}

            <button
              disabled={!form.role}
              onClick={() => setStage("setup")}
              className={`w-full py-3.5 rounded-xl font-display font-semibold text-[14px] transition-all shadow-md mt-auto active:scale-[0.99] cursor-pointer ${
                form.role ? "bg-ink text-cream hover:bg-black" : "bg-charcoal/15 text-slate/50 cursor-not-allowed shadow-none"
              }`}
            >
              Next: Complete Onboarding Setup
            </button>
          </>
        ) : (
          <>
            <div>
              <h2 className="font-display font-bold text-[17px] text-ink leading-tight">
                {isRoleAlreadyLocked ? "Profile Details" : `Complete ${form.role} Setup`}
              </h2>
              <p className="text-slate text-xs mt-0.5 font-medium">
                {isRoleAlreadyLocked ? "Your listing role details are currently locked." : "Provide setup details to lock your listing role"}
              </p>
            </div>

            {setupError && (
              <div className="p-3.5 bg-rose-50 text-rose-600 text-xs rounded-2xl border border-rose-100 flex items-start gap-2">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <span>{setupError}</span>
              </div>
            )}

            {isRoleAlreadyLocked && (
              <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-xs font-medium leading-relaxed shadow-sm flex flex-col gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none mt-0.5">⚠️</span>
                  <div>
                    <p>
                      Your listing role is currently locked as <strong className="capitalize">{user?.role || form.role}</strong>.
                    </p>
                    <p className="mt-1 text-slate-700">
                      Need to switch to another role?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setSwitchError(null);
                          setSwitchSuccessMessage(null);
                          setSwitchTargetRole("");
                          setShowSwitchModal(true);
                        }}
                        className="font-bold underline text-amber-900 hover:text-black cursor-pointer inline transition-colors"
                      >
                        Click here to send request to admin
                      </button>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Inputs based on role */}
            <div className="flex flex-col gap-5 text-left">
              {form.role === "Owner" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate uppercase tracking-wider">Owner Name</label>
                  <input
                    type="text"
                    disabled={isRoleAlreadyLocked}
                    placeholder="Enter owner name"
                    value={form.ownerName}
                    onChange={(e) => update({ ownerName: e.target.value })}
                    className="w-full rounded-xl border border-charcoal/12 bg-white px-4 py-3 text-xs font-semibold text-charcoal focus:border-black outline-none transition-colors disabled:bg-slate-100/70 disabled:text-slate/60 shadow-sm"
                  />
                </div>
              )}

              {form.role === "Broker" && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate uppercase tracking-wider">Broker Name</label>
                    <input
                      type="text"
                      disabled={isRoleAlreadyLocked}
                      placeholder="Enter broker name"
                      value={form.brokerName}
                      onChange={(e) => update({ brokerName: e.target.value })}
                      className="w-full rounded-xl border border-charcoal/12 bg-white px-4 py-3 text-xs font-semibold text-charcoal focus:border-black outline-none transition-colors disabled:bg-slate-100/70 disabled:text-slate/60 shadow-sm"
                    />
                  </div>
                </div>
              )}

              {form.role === "Agency" && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate uppercase tracking-wider">Agency Name</label>
                    <input
                      type="text"
                      disabled={isRoleAlreadyLocked}
                      placeholder="Enter agency name"
                      value={form.agencyName}
                      onChange={(e) => update({ agencyName: e.target.value })}
                      className="w-full rounded-xl border border-charcoal/12 bg-white px-4 py-3 text-xs font-semibold text-charcoal focus:border-black outline-none transition-colors disabled:bg-slate-100/70 disabled:text-slate/60 shadow-sm"
                    />
                  </div>

                  {!isRoleAlreadyLocked && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate uppercase tracking-wider">Agency Logo</label>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      {form.agencyLogo ? (
                        <div className="flex items-center gap-3 bg-white border border-charcoal/10 rounded-xl p-3 shadow-sm">
                          <img
                            src={URL.createObjectURL(form.agencyLogo)}
                            alt="Agency Logo"
                            className="w-10 h-10 object-cover rounded-lg border border-charcoal/10"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-charcoal truncate">{form.agencyLogo.name}</p>
                            <p className="text-[10px] text-slate mt-0.5">{(form.agencyLogo.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => update({ agencyLogo: null })}
                            className="text-xs font-bold text-coral hover:underline pr-1 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="w-full py-5 border-2 border-dashed border-charcoal/15 hover:border-black rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors bg-white shadow-sm cursor-pointer"
                        >
                          <UploadCloud size={20} className="text-slate/60" />
                          <span className="text-xs font-semibold text-charcoal">Upload Logo Image</span>
                          <span className="text-[10px] text-slate/50">PNG or JPEG format</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Agency Address */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate uppercase tracking-wider">Agency Address</label>
                    <textarea
                      disabled={isRoleAlreadyLocked}
                      placeholder="Enter agency address"
                      value={form.agencyAddress || ""}
                      onChange={(e) => update({ agencyAddress: e.target.value })}
                      rows={3}
                      className="w-full rounded-xl border border-charcoal/12 bg-white px-4 py-3 text-xs font-semibold text-charcoal focus:border-black outline-none transition-colors disabled:bg-slate-100/70 disabled:text-slate/60 shadow-sm resize-none"
                    />
                  </div>

                  {/* Agency District */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate uppercase tracking-wider">District</label>
                    <div className="relative">
                      <select
                        disabled={isRoleAlreadyLocked}
                        value={form.agencyDistrict || ""}
                        onChange={(e) => update({ agencyDistrict: e.target.value })}
                        className="w-full rounded-xl border border-charcoal/12 bg-white px-4 py-3 text-xs font-semibold text-charcoal focus:border-black outline-none transition-colors disabled:bg-slate-100/70 disabled:text-slate/60 shadow-sm appearance-none cursor-pointer"
                      >
                        <option value="">Select District</option>
                        {districts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate/50">
                        ▼
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Details */}
              <div className="flex flex-col gap-4 border-t border-charcoal/8 pt-4 mt-1">
                <h3 className="font-display font-bold text-[14px] text-ink uppercase tracking-wider">
                  Contact Details
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate uppercase tracking-wider">Contact Number</label>
                  <div className="flex items-center bg-white rounded-xl border border-charcoal/12 px-3 py-0.5 focus-within:border-black transition-colors shadow-sm disabled:bg-slate-100/50">
                    <div className="flex items-center gap-1 text-[13px] font-semibold text-charcoal pr-3 border-r border-charcoal/12 cursor-pointer">
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      disabled={isRoleAlreadyLocked}
                      placeholder="Enter contact number"
                      value={form.contactPhone}
                      onChange={(e) => update({ contactPhone: e.target.value })}
                      className="flex-1 bg-transparent text-[14px] px-3 py-3 outline-none text-charcoal placeholder:text-slate/40 font-medium disabled:text-slate/50"
                    />
                  </div>
                </div>

                {!isRoleAlreadyLocked && (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      id="sameAsContact"
                      checked={form.sameAsContact}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        update({ 
                          sameAsContact: checked,
                          whatsappNumber: checked ? form.contactPhone : "" 
                        });
                      }}
                      className="w-4 h-4 rounded border-charcoal/20 text-black focus:ring-black focus:ring-offset-0 bg-white cursor-pointer"
                    />
                    <label htmlFor="sameAsContact" className="text-xs font-semibold text-slate cursor-pointer select-none">
                      WhatsApp number is same as contact number
                    </label>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate uppercase tracking-wider">WhatsApp Number</label>
                  <div className={`flex items-center rounded-xl border px-3 py-0.5 transition-colors shadow-sm ${
                    isRoleAlreadyLocked || form.sameAsContact 
                      ? "bg-slate-100/50 border-charcoal/8 text-slate/50" 
                      : "bg-white border-charcoal/12 focus-within:border-black"
                  }`}>
                    <div className="flex items-center gap-1 text-[13px] font-semibold pr-3 border-r border-charcoal/12 cursor-pointer">
                      <span className={isRoleAlreadyLocked || form.sameAsContact ? "text-slate/50" : "text-charcoal"}>+91</span>
                    </div>
                    <input
                      type="tel"
                      placeholder="Enter WhatsApp number"
                      value={form.whatsappNumber}
                      onChange={(e) => update({ whatsappNumber: e.target.value })}
                      disabled={isRoleAlreadyLocked || form.sameAsContact}
                      className="flex-1 bg-transparent text-[14px] px-3 py-3 outline-none text-charcoal placeholder:text-slate/40 font-medium disabled:text-slate/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              disabled={submitting || !isSetupValid}
              onClick={handleConfirmRole}
              className={`w-full py-4 rounded-xl font-display font-semibold text-[15px] transition-all shadow-md mt-auto active:scale-[0.99] bg-emerald-600 text-white cursor-pointer ${
                submitting || !isSetupValid 
                  ? "opacity-50 cursor-not-allowed shadow-none" 
                  : "hover:bg-emerald-700"
              }`}
            >
              {submitting ? "Locking Account Role..." : isRoleAlreadyLocked ? "Continue" : "Confirm & Lock Role"}
            </button>
          </>
        )}
      </div>

      {showPlansModal && (
        <SubscriptionPaywallModal
          onClose={() => setShowPlansModal(false)}
          targetRole={form.role || "owner"}
          onSuccess={() => {
            setShowPlansModal(false);
            alert("Subscription payment completed and activated successfully!");
          }}
        />
      )}

      {/* Role Switch Request Modal */}
      {showSwitchModal && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowSwitchModal(false)}
        >
          <div 
            className="bg-cream rounded-3xl p-6 w-full max-w-[380px] border border-charcoal/10 shadow-2xl relative flex flex-col gap-4 animate-slide-up font-display text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowSwitchModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100/80 rounded-full text-slate transition-all cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="font-extrabold text-lg text-ink">Request Role Switch</h3>
              <p className="text-xs text-slate mt-1 leading-relaxed">
                Select the new listing role you wish to switch your account to. The Admin will review and approve your request.
              </p>
            </div>

            {switchSuccessMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-xs flex flex-col gap-3">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Request Submitted!</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {switchSuccessMessage}
                </p>
                <button
                  onClick={() => setShowSwitchModal(false)}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold text-center mt-1 cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {switchError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl">
                    {switchError}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate uppercase tracking-wider">Select New Role</label>
                  <div className="flex flex-col gap-2">
                    {["Broker", "Agency"].filter(r => r.toLowerCase() !== (user?.role || "").toLowerCase()).map((r) => {
                      const selected = switchTargetRole === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setSwitchTargetRole(r)}
                          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                            selected 
                              ? "border-black bg-white shadow-sm ring-1 ring-black text-ink" 
                              : "border-charcoal/10 bg-white hover:bg-slate-50 text-charcoal"
                          }`}
                        >
                          <span>{r}</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            selected ? "border-black bg-black text-white" : "border-charcoal/30"
                          }`}>
                            {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <button
                    disabled={!switchTargetRole || switchSubmitting}
                    onClick={async () => {
                      if (!switchTargetRole) return;
                      setSwitchSubmitting(true);
                      setSwitchError(null);
                      try {
                        const res = await api.requestRoleSwitch(switchTargetRole);
                        setSwitchSuccessMessage(res.message || "Your switch request has been sent to the Admin for approval.");
                      } catch (err: any) {
                        setSwitchError(err.message || "Failed to submit role switch request.");
                      } finally {
                        setSwitchSubmitting(false);
                      }
                    }}
                    className={`w-full py-3.5 bg-ink text-cream rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all ${
                      !switchTargetRole || switchSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-black cursor-pointer active:scale-95"
                    }`}
                  >
                    {switchSubmitting ? "Submitting Request..." : `Request Switch to ${switchTargetRole || "Role"}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSwitchModal(false)}
                    className="w-full py-2 text-xs font-semibold text-slate hover:text-charcoal cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
