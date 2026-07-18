import { useNavigate } from "react-router-dom";
import { X, Home, Briefcase, Building2, Check } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
import { ListingRole } from "@/lib/types";
import Button from "@/components/Button";

const roles: { role: ListingRole; icon: typeof Home; blurb: string }[] = [
  { role: "Owner", icon: Home, blurb: "I am the owner of this property" },
  { role: "Broker", icon: Briefcase, blurb: "I am a broker listing this property for the owner" },
  { role: "Agency", icon: Building2, blurb: "I am listing this property on behalf of my real estate agency" },
];

export default function ChooseRole() {
  const navigate = useNavigate();
  const { form, update } = useAddProperty();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-4">
        <h1 className="font-display font-bold text-lg text-ink">Add Property</h1>
        <button onClick={() => navigate("/home")} aria-label="Close">
          <X size={22} className="text-ink" />
        </button>
      </header>

      <div className="px-4 pb-6">
        <h2 className="font-display font-bold text-2xl text-ink mb-1.5">
          How are you listing this property?
        </h2>
        <p className="text-slate text-sm mb-6">This helps users know who you are.</p>

        <div className="flex flex-col gap-3">
          {roles.map(({ role, icon: Icon, blurb }) => {
            const selected = form.role === role;
            return (
              <button
                key={role}
                onClick={() => update({ role })}
                className={`flex items-start gap-3 text-left rounded-2xl p-4 border-2 transition-colors ${
                  selected ? "border-ink bg-sage/60" : "border-charcoal/10 bg-white"
                }`}
              >
                <div className={`rounded-full p-2 ${selected ? "bg-ink text-cream" : "bg-sage text-ink"}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-display font-semibold text-charcoal">{role} Property</p>
                  <p className="text-sm text-slate mt-0.5">{blurb}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                    selected ? "border-ink bg-ink" : "border-charcoal/20"
                  }`}
                >
                  {selected && <Check size={12} className="text-cream" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto px-4 pb-8 pt-4">
        <Button disabled={!form.role} onClick={() => navigate("/add-property/details")}>
          Continue
        </Button>
      </div>
    </div>
  );
}
