import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Building2, MapPin, Check, X, Trash2 } from "lucide-react";
import { api, ApiPropertyDetail, mediaUrl, formatArea } from "@/lib/api";
import { adminApi } from "@/lib/adminApi";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80";

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<ApiPropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadProperty() {
      if (!id) return;
      try {
        const data = await api.fetchProperty(id);
        setProperty(data);
      } catch (err) {
        setError("Failed to load property listing details.");
      } finally {
        setLoading(false);
      }
    }
    loadProperty();
  }, [id]);

  async function handleApprove() {
    if (!property || !id) return;
    setBusy(true);
    try {
      await adminApi.updatePropertyStatus(id, "Active");
      setProperty({ ...property, status: "Active" });
    } catch (err) {
      alert("Failed to approve property.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (!property || !id) return;
    setBusy(true);
    try {
      await adminApi.updatePropertyStatus(id, "Rejected");
      setProperty({ ...property, status: "Rejected" });
    } catch (err) {
      alert("Failed to reject property.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!property || !id) return;
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this listing?");
    if (!confirmDelete) return;

    setBusy(true);
    try {
      await adminApi.deleteProperty(id);
      navigate("/admin/properties");
    } catch (err) {
      alert("Failed to delete property.");
      setBusy(false);
    }
  }

  if (loading) return <p className="px-4 py-8 text-sm text-slate">Loading property details...</p>;
  if (error || !property) return <p className="px-4 py-8 text-sm text-coral">{error || "Property not found."}</p>;

  return (
    <div className="px-4 py-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate("/admin/properties")}
          className="p-1 hover:bg-slate-100 rounded-full transition-all"
        >
          <ChevronLeft size={22} className="text-ink" />
        </button>
        <div>
          <h2 className="font-display font-extrabold text-lg text-black">Property Inspector</h2>
          <p className="text-[10px] text-slate mt-0.5 uppercase tracking-wider font-bold">Property Details</p>
        </div>
      </div>

      {/* Hero Image / Video */}
      <div className="relative aspect-video rounded-3xl bg-slate-900 overflow-hidden shadow-sm">
        {property.images && property.images[0] ? (
          <img
            src={mediaUrl(property.images[0])}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
            <Building2 size={36} />
            <span className="text-xs font-semibold">No media attached</span>
          </div>
        )}
        <div className="absolute top-4 right-4">
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold shadow-md ${
            property.status === "Active" ? "bg-emerald-600 text-white" :
            property.status === "Pending" ? "bg-amber-500 text-white" :
            "bg-rose-600 text-white"
          }`}>
            {property.status}
          </span>
        </div>
      </div>

      {/* Basic Metrics */}
      <div className="flex flex-col gap-2 bg-white border border-charcoal/5 p-4 rounded-2xl shadow-sm">
        <h3 className="font-display font-extrabold text-sm text-ink leading-snug">{property.title}</h3>
        <div className="flex items-center gap-1 text-[10px] text-slate mt-0.5">
          <MapPin size={12} />
          <span>{property.address}, {property.district}</span>
        </div>
        <div className="flex items-center justify-between border-t border-charcoal/5 pt-3 mt-2 flex-wrap gap-2">
          <span className="font-display font-extrabold text-sm text-emerald-600">
            ₹{Number(property.price).toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] font-bold text-slate uppercase bg-slate-50 px-2.5 py-1 rounded-lg">
            {formatArea(property.areaSqft, property.propertyType)}
          </span>
        </div>
      </div>

      {/* Descriptions */}
      {property.description && (
        <div className="flex flex-col gap-2 bg-white border border-charcoal/5 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Description</span>
          <p className="text-xs text-charcoal leading-relaxed">{property.description}</p>
        </div>
      )}

      {/* Owner Info Block */}
      <div className="flex flex-col gap-2 bg-white border border-charcoal/5 p-4 rounded-2xl shadow-sm">
        <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Uploader Information</span>
        <div className="flex justify-between items-center text-xs mt-1">
          <span className="text-slate">Listing Role:</span>
          <span className="font-semibold text-charcoal">{property.listingRole}</span>
        </div>
        <div className="flex justify-between items-center text-xs mt-1">
          <span className="text-slate">Contact Name:</span>
          <span className="font-semibold text-charcoal">{property.ownerName}</span>
        </div>
        <div className="flex justify-between items-center text-xs mt-1">
          <span className="text-slate">Phone Number:</span>
          <span className="font-semibold text-charcoal">{property.ownerPhone || "Not provided"}</span>
        </div>
      </div>

      {/* Controls Actions Footer */}
      <div className="flex flex-col gap-2 mt-2">
        {property.status === "Pending" ? (
          <div className="flex gap-3">
            <button
              disabled={busy}
              onClick={handleReject}
              className="flex-1 py-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-[0.99]"
            >
              <X size={15} /> Reject Listing
            </button>
            <button
              disabled={busy}
              onClick={handleApprove}
              className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-[0.99] shadow-md shadow-emerald-100"
            >
              <Check size={15} /> Approve & Publish
            </button>
          </div>
        ) : (
          <button
            disabled={busy}
            onClick={handleDelete}
            className="w-full py-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-[0.99]"
          >
            <Trash2 size={16} /> Delete Listing Permanently
          </button>
        )}
      </div>
    </div>
  );
}
