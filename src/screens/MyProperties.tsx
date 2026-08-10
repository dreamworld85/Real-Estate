import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Power, Trash2, Star } from "lucide-react";
import { api, ApiProperty, mediaUrl } from "@/lib/api";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import StatusBadge from "@/components/StatusBadge";
import { useAddProperty } from "@/lib/AddPropertyContext";
import PropertyActivationModal from "@/components/PropertyActivationModal";
import SubscriptionPaywallModal from "@/components/SubscriptionPaywallModal";

type Tab = "All" | ApiProperty["status"];
const tabs: Tab[] = ["All", "Active", "Pending", "Inactive", "Draft"];
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80";

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function MyProperties() {
  const navigate = useNavigate();
  const { startEditing } = useAddProperty();
  const [tab, setTab] = useState<Tab>("All");
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showActivationChoice, setShowActivationChoice] = useState<ApiProperty | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  function loadProperties() {
    setLoading(true);
    setError(null);
    api
      .fetchMyProperties()
      .then(setProperties)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadProperties, []);

  async function handleToggleActive(p: ApiProperty) {
    setBusyId(p.id);
    try {
      const nextStatus = p.status === "Active" ? "Inactive" : "Active";
      await api.updatePropertyStatus(p.id, nextStatus);
      setProperties((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: nextStatus } : x)));
    } catch (err: any) {
      if (err.requiresActivationChoice) {
        setShowActivationChoice(p);
      } else {
        setError(err instanceof Error ? err.message : "Failed to update status");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleActivateFree(p: ApiProperty) {
    setShowActivationChoice(null);
    setBusyId(p.id);
    try {
      const nextStatus = "Active";
      await api.updatePropertyStatus(p.id, nextStatus, true);
      setProperties((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: nextStatus } : x)));
      setTimeout(() => {
        alert("Property activated successfully under Admin Number fallback!");
      }, 100);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to activate property");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(p: ApiProperty) {
    setBusyId(p.id);
    try {
      await api.deleteProperty(p.id);
      setProperties((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete property");
    } finally {
      setBusyId(null);
    }
  }

  async function handlePromoteProperty(p: ApiProperty) {
    const confirmed = window.confirm(
      `Promote "${p.title}" as a Featured Advertisement?\n\nThis will feature your property listing at the top of the Home feed to boost inquiries. Proceed to secure checkout?`
    );
    if (!confirmed) return;

    setBusyId(p.id);
    try {
      const scriptLoaded = await new Promise((resolve) => {
        if ((window as any).Razorpay) {
          resolve(true);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!scriptLoaded) {
        alert("Failed to load payment gateway script. Please check your network connection.");
        setBusyId(null);
        return;
      }

      const order = await (api as any).initiateFeaturedPayment(p.id);
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: "Kerala Realty",
        description: `Featured Ad: ${p.title}`,
        handler: async function (response: any) {
          setBusyId(p.id);
          try {
            await (api as any).verifyFeaturedPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              propertyId: p.id
            });
            alert("Payment Verified! Property is now Featured.");
            loadProperties();
          } catch (err: any) {
            alert("Verification failed: " + (err.message || err));
          } finally {
            setBusyId(null);
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#0F3D3E",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert(err.message || "Failed to initiate featured promotion payment.");
    } finally {
      setBusyId(null);
    }
  }

  const filtered = properties.filter((p) => tab === "All" || p.status === tab);

  return (
    <div className="min-h-screen pb-28">
      <Header title="My Properties" showBack />

      <div className="px-4 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((t) => {
          const count = t === "All" ? properties.length : properties.filter((p) => p.status === t).length;
          const active = t === tab;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active ? "bg-ink text-cream" : "bg-white text-charcoal border border-charcoal/10"
              }`}
            >
              {t} ({count})
            </button>
          );
        })}
      </div>

      {loading && <p className="px-4 text-sm text-slate">Loading your properties…</p>}
      {error && <p className="px-4 text-sm text-coral mb-3">{error}</p>}

      <div className="px-4 flex flex-col gap-4">
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate text-sm">No properties in "{tab}" yet.</p>
          </div>
        )}
        {filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-card shadow-card overflow-hidden">
            <button
              onClick={() => navigate(`/my-properties/${p.id}`)}
              className="w-full flex gap-3 p-3 text-left"
            >
              <img
                src={p.images[0] ? mediaUrl(p.images[0]) : FALLBACK_IMAGE}
                alt={p.title}
                className="w-20 h-20 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-ink">{formatPrice(p.price)}</p>
                <p className="text-sm text-charcoal truncate">{p.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={p.status} />
                  <span className="text-xs text-slate flex items-center gap-1">
                    <Eye size={12} /> {p.views} Views
                  </span>
                  {p.avgRating !== undefined && p.avgRating > 0 && (
                    <span className="text-xs text-amber font-semibold flex items-center gap-0.5 ml-1">
                      <Star size={11} className="fill-gold text-gold shrink-0" />
                      <span>{p.avgRating.toFixed(1)} ({p.ratingCount})</span>
                    </span>
                  )}
                </div>
              </div>
            </button>
            <div className="flex border-t border-charcoal/6">
              <button
                onClick={() => navigate(`/my-properties/${p.id}`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-ink border-r border-charcoal/6"
              >
                <Eye size={14} /> View
              </button>
              <button 
                onClick={() => {
                  startEditing(p);
                  navigate("/add-property/details");
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-forest border-r border-charcoal/6"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                disabled={busyId === p.id || p.status === "Pending"}
                onClick={() => handleToggleActive(p)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-amber border-r border-charcoal/6 disabled:opacity-40"
              >
                <Power size={14} /> {p.status === "Active" ? "Deactivate" : "Activate"}
              </button>
              <button
                disabled={busyId === p.id}
                onClick={() => handleDelete(p)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-coral disabled:opacity-40"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
            {p.status === "Active" && (
              <div className="bg-emerald-50/40 px-4 py-2.5 border-t border-charcoal/6 flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <Star size={13} className={p.isFeatured ? "fill-emerald-600 text-emerald-600 animate-pulse" : "text-emerald-700"} />
                  {p.isFeatured ? "Featured Ad Active" : "Promote as Advertisement"}
                </span>
                {!p.isFeatured && (
                  <button
                    disabled={busyId === p.id}
                    onClick={() => handlePromoteProperty(p)}
                    className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 active:scale-95 transition-all select-none shadow-sm disabled:opacity-50"
                  >
                    Promote Ad
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <BottomNav />

      {showActivationChoice && (
        <PropertyActivationModal
          onClose={() => setShowActivationChoice(null)}
          onUpgrade={() => {
            setShowActivationChoice(null);
            setShowPaywall(true);
          }}
          onContinueFree={() => handleActivateFree(showActivationChoice)}
        />
      )}

      {showPaywall && (
        <SubscriptionPaywallModal
          onClose={() => setShowPaywall(false)}
          onSuccess={() => {
            setShowPaywall(false);
            loadProperties();
          }}
        />
      )}
    </div>
  );
}
