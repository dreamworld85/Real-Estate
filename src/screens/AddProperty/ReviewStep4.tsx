import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import StepProgress from "@/components/StepProgress";
import RoleBadge from "@/components/RoleBadge";
import Button from "@/components/Button";
import BottomNav from "@/components/BottomNav";

function formatPrice(price: string): string {
  const n = Number(price);
  if (!n) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function ReviewStep4() {
  const navigate = useNavigate();
  const { form, isEditing, editingId, reset, setLastSubmittedStatus } = useAddProperty();
  const { token, login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLand = form.propertyType === "Land" || form.propertyType === "Plot / Land";
  const showBedrooms = !isLand && form.propertyCategory !== "Commercial" && form.propertyType !== "Office Space";

  const rows: [string, string][] = [
    ["Property Type", form.propertyType || "—"],
    ["Purpose", form.purpose || "—"],
    ["Price", formatPrice(form.price) + (form.isPriceNegotiable ? " (Negotiable)" : "")],
    ["Area", form.areaSqft ? `${form.areaSqft} ${isLand ? form.areaUnit : "sq.ft"}` : "—"],
    ["Location", `${form.address || "—"}, ${form.district || "—"}`],
    ...(!isLand
      ? ([
          ...(showBedrooms ? [["Bedrooms", form.bedrooms || "—"]] : []),
          ["Bathrooms", form.bathrooms || "—"],
          ["Furnishing", form.furnishing || "—"],
          ["Property Age", form.propertyAge || "—"],
        ] as [string, string][])
      : []),
    ["Facing", form.facing || "—"],
    ["Listing Role", form.role ? `${form.role} Property` : "—"],
    ...(form.role === "Owner" ? ([["Owner Name", form.ownerName || "—"]] as [string, string][]) : []),
    ...(form.role === "Broker" ? ([
      ["Broker Name", form.brokerName || "—"],
      ["Personal Property", form.isBrokerPersonalProperty ? "Yes" : "No"]
    ] as [string, string][]) : []),
    ...(form.role === "Agency" ? ([["Agency Name", form.agencyName || "—"]] as [string, string][]) : []),
    ["Contact Number", form.contactPhone || "—"],
    ["WhatsApp Number", form.whatsappNumber || "—"],
    ...(form.youtubeUrl ? ([["YouTube Video Link", form.youtubeUrl]] as [string, string][]) : []),
  ];

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("propertyType", form.propertyType);
      fd.append("purpose", form.purpose);
      fd.append("price", form.price);
      let sqftVal = Number(form.areaSqft) || 0;
      if (form.propertyType === "Land" || form.propertyType === "Plot / Land") {
        if (form.areaUnit === "Cents") {
          sqftVal = Math.round(sqftVal * 435.6);
        } else if (form.areaUnit === "Acres") {
          sqftVal = Math.round(sqftVal * 43560);
        }
      }
      fd.append("areaSqft", String(sqftVal));
      fd.append("address", form.address);
      fd.append("district", form.district);
      fd.append("bedrooms", form.bedrooms || "0");
      fd.append("bathrooms", form.bathrooms || "0");
      if (form.furnishing) fd.append("furnishing", form.furnishing);
      if (form.facing) fd.append("facing", form.facing);
      if (form.propertyAge) fd.append("propertyAge", form.propertyAge);
      if (form.description) fd.append("description", form.description);
      if (form.role) fd.append("listingRole", form.role);
      if (form.youtubeUrl) fd.append("youtubeUrl", form.youtubeUrl);
      if (form.isPriceNegotiable !== undefined) {
        fd.append("isPriceNegotiable", String(form.isPriceNegotiable));
      }
      
      // Role & contact details
      if (form.contactPhone) fd.append("contactNumber", form.contactPhone);
      if (form.whatsappNumber) fd.append("whatsappNumber", form.whatsappNumber);
      if (form.role === "Owner") {
        fd.append("ownerName", form.ownerName);
      } else if (form.role === "Broker") {
        fd.append("brokerName", form.brokerName);
        if (form.isBrokerPersonalProperty !== undefined) {
          fd.append("isBrokerPersonalProperty", String(form.isBrokerPersonalProperty));
        }
      } else if (form.role === "Agency") {
        fd.append("agencyName", form.agencyName);
        if (form.agencyLogo) {
          fd.append("agencyLogo", form.agencyLogo);
        }
      }

      form.images.forEach((img) => fd.append("media", img));
      if (form.video) fd.append("media", form.video);

      let responseStatus = null;
      if (isEditing && editingId) {
        await api.updateProperty(editingId, fd);
      } else {
        const res = await api.createProperty(fd);
        responseStatus = res;
        if (res && res.user && token) {
          login(token, res.user);
        }
      }
      if (responseStatus) {
        setLastSubmittedStatus({
          status: responseStatus.status,
          isOverLimit: !!responseStatus.isOverLimit
        });
      }
      navigate("/add-property/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit property");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col pb-28 bg-slate-50">
      <Header title={isEditing ? "Edit Property" : "Add Property"} showBack />
      <StepProgress step={4} />

      <div className="px-6 flex flex-col gap-4 flex-1">
        <h2 className="font-display font-extrabold text-xl text-black -mt-1">
          {isEditing ? "Review Your Changes" : "Review Your Property"}
        </h2>

        <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-charcoal/8 h-36 flex items-center justify-center shadow-sm">
          {form.images.length > 0 ? (
            <>
              <img
                src={URL.createObjectURL(form.images[0])}
                alt="Property Hero Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 right-3 bg-black/60 px-2.5 py-1 rounded-full text-white text-[10px] font-bold flex items-center gap-1 select-none">
                <Camera size={12} />
                <span>1 of {form.images.length}</span>
              </div>
            </>
          ) : (
            <span className="text-xs text-slate font-semibold">No photos added</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {form.role && <RoleBadge role={form.role} />}
          {form.role?.toLowerCase() === "agency" && form.agencyLogo && (
            <div className="flex items-center gap-1.5 bg-white border border-charcoal/8 rounded-full px-2.5 py-1 shadow-sm">
              <img
                src={URL.createObjectURL(form.agencyLogo)}
                alt="Logo Preview"
                className="w-4 h-4 object-cover rounded-full"
              />
              <span className="text-[9px] font-bold text-slate uppercase">Logo Uploaded</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-charcoal/5 shadow-sm divide-y divide-charcoal/6 overflow-hidden">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5 text-xs">
              <span className="text-slate font-medium">{label}</span>
              <span className="font-bold text-charcoal text-right">{value}</span>
            </div>
          ))}
        </div>

        {form.description && (
          <div className="bg-white border border-charcoal/5 rounded-2xl shadow-sm p-3.5">
            <p className="text-[11px] font-bold text-charcoal uppercase tracking-wider mb-1">Description</p>
            <p className="text-xs text-slate leading-relaxed">{form.description}</p>
          </div>
        )}

        {error && <p className="text-xs font-bold text-rose-500">{error}</p>}
      </div>

      <div className="px-6 pb-6 pt-5 flex gap-3">
        <button
          disabled={submitting}
          onClick={() => navigate(-1)}
          className="flex-1 py-3.5 rounded-xl font-display font-semibold text-[14px] border border-charcoal/15 bg-white text-charcoal hover:bg-slate-50 transition-all active:scale-[0.99] cursor-pointer"
        >
          Back
        </button>
        <button
          disabled={submitting}
          onClick={handleSubmit}
          className={`flex-[2] py-3.5 rounded-xl font-display font-semibold text-[14px] transition-all shadow-md active:scale-[0.99] bg-emerald-600 text-white cursor-pointer ${
            submitting 
              ? "opacity-40 cursor-not-allowed shadow-none" 
              : "hover:bg-emerald-700"
          }`}
        >
          {submitting ? "Submitting…" : isEditing ? "Update Property" : "Submit Property"}
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
