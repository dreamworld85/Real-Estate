import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import StepProgress from "@/components/StepProgress";
import RoleBadge from "@/components/RoleBadge";
import Button from "@/components/Button";

function formatPrice(price: string): string {
  const n = Number(price);
  if (!n) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function ReviewStep4() {
  const navigate = useNavigate();
  const { form } = useAddProperty();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows: [string, string][] = [
    ["Property Type", form.propertyType || "—"],
    ["Purpose", form.purpose || "—"],
    ["Price", formatPrice(form.price)],
    ["Area", form.areaSqft ? `${form.areaSqft} sq.ft` : "—"],
    ["Location", `${form.address || "—"}, ${form.district || "—"}`],
    ...(form.propertyType !== "Land"
      ? ([
          ["Bedrooms", form.bedrooms || "—"],
          ["Bathrooms", form.bathrooms || "—"],
          ["Furnishing", form.furnishing || "—"],
          ["Property Age", form.propertyAge || "—"],
        ] as [string, string][])
      : []),
    ["Facing", form.facing || "—"],
  ];

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("propertyType", form.propertyType);
      fd.append("purpose", form.purpose);
      fd.append("price", form.price);
      fd.append("areaSqft", form.areaSqft);
      fd.append("address", form.address);
      fd.append("district", form.district);
      fd.append("bedrooms", form.bedrooms || "0");
      fd.append("bathrooms", form.bathrooms || "0");
      if (form.furnishing) fd.append("furnishing", form.furnishing);
      if (form.facing) fd.append("facing", form.facing);
      if (form.propertyAge) fd.append("propertyAge", form.propertyAge);
      if (form.description) fd.append("description", form.description);
      if (form.role) fd.append("listingRole", form.role);
      form.images.forEach((img) => fd.append("media", img));
      if (form.video) fd.append("media", form.video);

      await api.createProperty(fd);
      navigate("/add-property/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit property");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Add Property" showBack />
      <StepProgress step={4} />

      <div className="px-4 flex flex-col gap-5 flex-1">
        <h2 className="font-display font-bold text-lg text-ink -mt-1">Review Your Property</h2>

        <div className="rounded-2xl overflow-hidden bg-sage h-44 flex items-center justify-center">
          {form.images.length > 0 ? (
            <div className="flex items-center gap-1 text-forest">
              <Camera size={18} />
              <span className="text-sm font-medium">{form.images.length} photos added</span>
            </div>
          ) : (
            <span className="text-sm text-slate">No photos added</span>
          )}
        </div>

        <div>
          {form.role && <RoleBadge role={form.role} />}
        </div>

        <div className="bg-white rounded-2xl shadow-card divide-y divide-charcoal/6">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-slate">{label}</span>
              <span className="font-medium text-charcoal text-right">{value}</span>
            </div>
          ))}
        </div>

        {form.description && (
          <div className="bg-white rounded-2xl shadow-card p-4">
            <p className="text-sm font-semibold text-charcoal mb-1">Description</p>
            <p className="text-sm text-slate leading-relaxed">{form.description}</p>
          </div>
        )}

        {error && <p className="text-sm text-coral">{error}</p>}
      </div>

      <div className="px-4 pb-8 pt-6 flex gap-3">
        <Button variant="secondary" fullWidth={false} className="flex-1" onClick={() => navigate(-1)} disabled={submitting}>
          Back
        </Button>
        <Button fullWidth={false} className="flex-[2]" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Property"}
        </Button>
      </div>
    </div>
  );
}
