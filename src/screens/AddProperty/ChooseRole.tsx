import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, User, Wrench, Building2, UploadCloud } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
import { useAuth } from "@/lib/AuthContext";
import { ListingRole } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

const rolesList: { role: ListingRole; icon: typeof User; label: string }[] = [
  { role: "Owner", icon: User, label: "Owner" },
  { role: "Broker", icon: Wrench, label: "Broker" },
  { role: "Agency", icon: Building2, label: "Agency" },
];

export default function ChooseRole() {
  const navigate = useNavigate();
  const { form, update } = useAddProperty();
  const { user } = useAuth();
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Default to Owner role and pre-populate profile name and phone
  useEffect(() => {
    if (!form.role) {
      const contact = form.contactPhone || user?.phone || "";
      update({ 
        role: "Owner",
        ownerName: form.ownerName || user?.name || "",
        contactPhone: contact,
        sameAsContact: true,
        whatsappNumber: contact,
      });
    }
  }, [form.role, user, update]);

  // Sync WhatsApp number when sameAsContact is checked
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

  const validatePhone = (num: string) => num && num.trim().length >= 8;

  const isFormValid = (() => {
    if (!form.role) return false;
    
    // Contact validation (common for all)
    const hasContact = validatePhone(form.contactPhone) && validatePhone(form.whatsappNumber);
    if (!hasContact) return false;

    if (form.role === "Owner") {
      return !!form.ownerName.trim();
    }
    if (form.role === "Broker") {
      return !!form.brokerName.trim();
    }
    if (form.role === "Agency") {
      return !!form.agencyName.trim() && !!form.agencyLogo;
    }
    return false;
  })();

  return (
    <div className="min-h-screen flex flex-col pb-28 bg-slate-50">
      {/* Header */}
      <header className="flex flex-col bg-white border-b border-charcoal/8">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="font-display font-extrabold text-[20px] text-ink">Add Property</h1>
          <button 
            onClick={() => navigate("/home")} 
            className="p-1.5 hover:bg-charcoal/5 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-ink" />
          </button>
        </div>
        {/* Progress Stepper indicator */}
        <div className="relative h-1 bg-slate-100 w-full overflow-hidden">
          <div className="absolute top-0 left-0 h-full w-[16.6%] bg-charcoal"></div>
        </div>
      </header>

      <div className="px-6 py-6 flex-1 flex flex-col gap-6 max-w-lg mx-auto w-full">
        {/* Dynamic Selector Header */}
        <div>
          <h2 className="font-display font-bold text-[17px] text-ink leading-tight">
            How are you listing?
          </h2>
          <p className="text-slate text-xs mt-0.5 font-medium">
            Choose one option to get started
          </p>
        </div>

        {/* 3-Column Horizontal Grid selector */}
        <div className="grid grid-cols-3 gap-3">
          {rolesList.map(({ role, icon: Icon, label }) => {
            const selected = form.role === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => update({ role })}
                className={`relative flex flex-col items-center justify-center rounded-2xl p-4 aspect-square border-2 transition-all active:scale-[0.98] ${
                  selected 
                    ? "border-black bg-white ring-1 ring-black shadow-sm" 
                    : "border-charcoal/10 bg-white hover:border-charcoal/20"
                }`}
              >
                {/* Radio Circle Top Left */}
                <div className="absolute top-3 left-3">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    selected ? "border-black bg-white" : "border-charcoal/30"
                  }`}>
                    {selected && <div className="w-2 h-2 rounded-full bg-black" />}
                  </div>
                </div>

                {/* Card Icon */}
                <div className="mt-3">
                  <Icon size={24} className="text-charcoal" />
                </div>

                {/* Card Label */}
                <span className="font-display font-bold text-ink text-[13px] mt-2.5">
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Fields Section */}
        {form.role && (
          <div className="flex flex-col gap-5 mt-2 animate-fadeIn">
            {/* Owner Details */}
            {form.role === "Owner" && (
              <div className="flex flex-col gap-4">
                <h3 className="font-display font-bold text-[16px] text-ink">
                  Enter Owner Details
                </h3>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate">Owner Name</label>
                  <input
                    type="text"
                    placeholder="Enter owner name"
                    value={form.ownerName}
                    onChange={(e) => update({ ownerName: e.target.value })}
                    className="w-full rounded-xl border border-charcoal/12 bg-white px-4 py-3 text-[14px] text-charcoal focus:border-black outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Broker Details */}
            {form.role === "Broker" && (
              <div className="flex flex-col gap-4">
                <h3 className="font-display font-bold text-[16px] text-ink">
                  Enter Broker Details
                </h3>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate">Broker Name</label>
                  <input
                    type="text"
                    placeholder="Enter broker name"
                    value={form.brokerName}
                    onChange={(e) => update({ brokerName: e.target.value })}
                    className="w-full rounded-xl border border-charcoal/12 bg-white px-4 py-3 text-[14px] text-charcoal focus:border-black outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Agency Details */}
            {form.role === "Agency" && (
              <div className="flex flex-col gap-4">
                <h3 className="font-display font-bold text-[16px] text-ink">
                  Enter Agency Details
                </h3>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate">Agency Name</label>
                  <input
                    type="text"
                    placeholder="Enter agency name"
                    value={form.agencyName}
                    onChange={(e) => update({ agencyName: e.target.value })}
                    className="w-full rounded-xl border border-charcoal/12 bg-white px-4 py-3 text-[14px] text-charcoal focus:border-black outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate">Agency Logo</label>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  {form.agencyLogo ? (
                    <div className="flex items-center gap-3 bg-white border border-charcoal/10 rounded-xl p-3">
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
                        className="text-xs font-bold text-coral hover:underline pr-1"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full py-5 border-2 border-dashed border-charcoal/15 hover:border-black rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors bg-white shadow-sm"
                    >
                      <UploadCloud size={20} className="text-slate/60" />
                      <span className="text-xs font-semibold text-charcoal">Upload Logo Image</span>
                      <span className="text-[10px] text-slate/50">PNG or JPEG format</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Contact Details (Common Section) */}
            <div className="flex flex-col gap-4 border-t border-charcoal/8 pt-4 mt-1">
              <h3 className="font-display font-bold text-[16px] text-ink">
                Contact Details
              </h3>

              {/* Contact Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate">Contact Number</label>
                <div className="flex items-center bg-white rounded-xl border border-charcoal/12 px-3 py-0.5 focus-within:border-black transition-colors shadow-sm">
                  <div className="flex items-center gap-1 text-[13px] font-semibold text-charcoal pr-3 border-r border-charcoal/12 cursor-pointer">
                    <span>+91</span>
                    <svg className="w-3.5 h-3.5 fill-slate" viewBox="0 0 24 24">
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    placeholder="Enter contact number"
                    value={form.contactPhone}
                    onChange={(e) => update({ contactPhone: e.target.value })}
                    className="flex-1 bg-transparent text-[14px] px-3 py-3 outline-none text-charcoal placeholder:text-slate/40 font-medium"
                  />
                </div>
              </div>

              {/* Same check checkbox */}
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
                  className="w-4 h-4 rounded border-charcoal/20 text-black focus:ring-black focus:ring-offset-0 bg-white"
                />
                <label htmlFor="sameAsContact" className="text-xs font-semibold text-slate cursor-pointer select-none">
                  WhatsApp number is same as contact number
                </label>
              </div>

              {/* WhatsApp Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate">WhatsApp Number (Optional)</label>
                <div className={`flex items-center rounded-xl border px-3 py-0.5 transition-colors shadow-sm ${
                  form.sameAsContact 
                    ? "bg-slate-50 border-charcoal/8 text-slate/50" 
                    : "bg-white border-charcoal/12 focus-within:border-black"
                }`}>
                  <div className="flex items-center gap-1 text-[13px] font-semibold pr-3 border-r border-charcoal/12 cursor-pointer disabled:opacity-50">
                    <span className={form.sameAsContact ? "text-slate/50" : "text-charcoal"}>+91</span>
                    <svg className="w-3.5 h-3.5 fill-slate" viewBox="0 0 24 24">
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    placeholder="Enter WhatsApp number"
                    value={form.whatsappNumber}
                    onChange={(e) => update({ whatsappNumber: e.target.value })}
                    disabled={form.sameAsContact}
                    className="flex-1 bg-transparent text-[14px] px-3 py-3 outline-none text-charcoal placeholder:text-slate/40 font-medium disabled:text-slate/50"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Continue Action */}
      <div className="px-6 pb-8 pt-4">
        <button
          disabled={!isFormValid}
          onClick={() => navigate("/add-property/details")}
          className={`w-full py-4 rounded-xl font-display font-semibold text-[15px] transition-all shadow-md active:scale-[0.99] bg-emerald-600 text-white ${
            isFormValid 
              ? "hover:bg-emerald-700" 
              : "opacity-40 cursor-not-allowed shadow-none"
          }`}
        >
          Continue
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
