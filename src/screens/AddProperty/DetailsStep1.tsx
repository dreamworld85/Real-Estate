import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, AlertCircle, Home, Building, HelpCircle, Check } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
import { useAuth } from "@/lib/AuthContext";
import { ListingRole } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import StepProgress from "@/components/StepProgress";

const residentialTypesForSale = [
  "Apartment",
  "Independent House / Villa",
  "Builder Floor",
  "Plot / Land",
  "Farmhouse",
  "Other",
];

const residentialTypesForRent = [
  "Apartment",
  "Independent House / Villa",
  "Builder Floor",
  "1 RK / Studio Apartment",
  "Serviced Apartment",
  "Other",
];

const commercialTypesForSale = [
  "Office Space",
  "Retail Shop",
  "Plot / Land",
  "Warehouse",
  "Other",
];

const commercialTypesForRent = [
  "Office Space",
  "Retail Shop",
  "Warehouse",
  "Co-working Space",
  "Other",
];

export default function DetailsStep1() {
  const navigate = useNavigate();
  const { form, update } = useAddProperty();
  const { user } = useAuth();

  const [attemptedNext, setAttemptedNext] = useState(false);

  useEffect(() => {
    if (user && !form.role) {
      const activeRole: ListingRole = (user.role && user.role !== "User" ? user.role : "Owner") as ListingRole;
      update({
        role: activeRole,
        ownerName: user.role === "Owner" ? user.name : "",
        brokerName: user.role === "Broker" ? user.name : "",
        agencyName: user.role === "Agency" ? user.name : "",
        contactPhone: user.phone || "",
      });
    }
  }, [user, form.role, update]);

  const isRent = form.purpose === "For Rent";
  const activeTypes = form.propertyCategory === "Commercial"
    ? (isRent ? commercialTypesForRent : commercialTypesForSale)
    : (isRent ? residentialTypesForRent : residentialTypesForSale);

  function handlePurposeChange(val: string) {
    const nextRent = val === "For Rent";
    const nextTypes = form.propertyCategory === "Commercial"
      ? (nextRent ? commercialTypesForRent : commercialTypesForSale)
      : (nextRent ? residentialTypesForRent : residentialTypesForSale);
      
    const resetType = nextTypes.includes(form.propertyType) ? form.propertyType : "";
    update({ purpose: val, propertyType: resetType });
  }

  function handleCategoryChange(cat: string) {
    update({ propertyCategory: cat, propertyType: "" });
  }

  const canContinue = 
    form.purpose && 
    form.propertyCategory && 
    form.propertyType;

  function handleNext() {
    setAttemptedNext(true);
    if (canContinue) {
      navigate("/add-property/media");
    } else {
      setTimeout(() => {
        const firstError = document.querySelector(".border-rose-500");
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pb-28">
      {/* Header Section */}
      <div className="flex justify-between items-center px-6 pt-5 pb-1">
        <button 
          onClick={() => navigate("/add-property/role")} 
          className="text-ink p-1.5 -ml-1.5 hover:bg-charcoal/5 rounded-full transition-all duration-200 cursor-pointer active:scale-95"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>
      </div>

      <StepProgress step={1} />

      <div className="px-6 pb-4">
        <h1 className="font-display font-extrabold text-xl text-ink leading-tight">
          Add Basic Details
        </h1>
        <p className="text-[9px] font-bold text-slate/75 tracking-wider uppercase mt-0.5">
          Step 1 of 4 • Listing Parameters
        </p>
      </div>

      <div className="px-6 flex flex-col gap-4 flex-1">
        {/* CARD 1: Transaction Purpose */}
        <div className="bg-white border border-charcoal/5 p-3.5 rounded-2xl shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider pl-0.5">Transaction Type</span>
            {attemptedNext && !form.purpose && (
              <span className="text-[10px] text-rose-500 font-bold">Required</span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "Sell", value: "For Sale" },
              { label: "Rent / Lease", value: "For Rent" },
            ].map((opt) => {
              const active = form.purpose === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handlePurposeChange(opt.value)}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-xl border transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
                    active
                      ? "border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-600/30"
                      : "border-charcoal/10 bg-slate-50/40 hover:border-charcoal/20"
                  }`}
                >
                  <span className={`text-xs font-bold font-display ${active ? "text-emerald-700" : "text-ink"}`}>
                    {opt.label}
                  </span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                    active ? "border-emerald-600 bg-emerald-600 text-white" : "border-charcoal/30 bg-white"
                  }`}>
                    {active && <Check size={8} strokeWidth={4} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CARD 2: Property Category */}
        <div className="bg-white border border-charcoal/5 p-3.5 rounded-2xl shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider pl-0.5">Property Category</span>
            {attemptedNext && !form.propertyCategory && (
              <span className="text-[10px] text-rose-500 font-bold">Required</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "Residential", value: "Residential", icon: Home },
              { label: "Commercial", value: "Commercial", icon: Building },
            ].map((opt) => {
              const active = form.propertyCategory === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleCategoryChange(opt.value)}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-xl border transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
                    active
                      ? "border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-600/30"
                      : "border-charcoal/10 bg-slate-50/40 hover:border-charcoal/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded bg-white border border-charcoal/5 ${active ? "text-emerald-700" : "text-charcoal"}`}>
                      <Icon size={12} />
                    </span>
                    <span className={`text-xs font-bold font-display ${active ? "text-emerald-700" : "text-ink"}`}>
                      {opt.label}
                    </span>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                    active ? "border-emerald-600 bg-emerald-600 text-white" : "border-charcoal/30 bg-white"
                  }`}>
                    {active && <Check size={8} strokeWidth={4} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CARD 3: Property Type Grid */}
        <div className="bg-white border border-charcoal/5 p-3.5 rounded-2xl shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider pl-0.5">Select Property Type</span>
            {attemptedNext && !form.propertyType && (
              <span className="text-[10px] text-rose-500 font-bold">Required</span>
            )}
          </div>

          <div className={`grid grid-cols-2 gap-2 p-0.5 rounded-xl transition-all ${attemptedNext && !form.propertyType ? "border border-rose-500 bg-rose-50/5 shadow-sm shadow-rose-100" : ""}`}>
            {activeTypes.map((type) => {
              const active = form.propertyType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => update({ propertyType: type })}
                  className={`flex items-center justify-center min-h-[40px] p-2.5 rounded-xl border text-[11px] font-bold text-center leading-tight transition-all duration-150 cursor-pointer active:scale-[0.98] shadow-sm select-none ${
                    active
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-emerald-100/50"
                      : "bg-slate-50 border-charcoal/8 text-charcoal hover:bg-slate-100/80"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer next button container */}
      <div className="px-6 pb-6 pt-5">
        <button
          onClick={handleNext}
          className="w-full py-3.5 rounded-xl font-display font-semibold text-[14px] transition-all duration-200 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.99] cursor-pointer shadow-emerald-100"
        >
          Continue
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
