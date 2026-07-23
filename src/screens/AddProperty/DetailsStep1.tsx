import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, AlertCircle } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
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

  const [attemptedNext, setAttemptedNext] = useState(false);

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
      <div className="flex justify-between items-center px-6 pt-6 pb-2">
        <button 
          onClick={() => navigate("/add-property")} 
          className="text-ink p-1 -ml-1 hover:bg-charcoal/5 rounded-full transition-colors"
          aria-label="Back"
        >
          <Menu size={24} />
        </button>
      </div>

      <StepProgress step={1} />

      <div className="px-6 pb-4">
        <h1 className="font-display font-extrabold text-2xl text-ink leading-tight">
          Add Basic Details
        </h1>
        <p className="text-[10px] font-bold text-slate tracking-widest uppercase mt-1">
          STEP 1 OF 4
        </p>
      </div>

      <div className="px-6 flex flex-col gap-6 flex-1">
        {/* Field 1 - Transaction Type */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <label className="font-display font-bold text-[15px] text-ink">
              You're looking to?
            </label>
            {attemptedNext && !form.purpose && (
              <span className="text-[10px] text-rose-500 font-bold">Required</span>
            )}
          </div>
          <div className={`flex flex-wrap gap-2.5 p-1 rounded-2xl transition-all ${attemptedNext && !form.purpose ? "border border-rose-500 bg-rose-50/5 shadow-sm shadow-rose-100" : ""}`}>
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
                  className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all ${
                    active
                      ? "bg-sky-50/50 border-sky-500 text-sky-700 font-semibold shadow-sm"
                      : "bg-white border-charcoal/10 text-charcoal hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Field 2 - Property Category */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <label className="font-display font-bold text-[15px] text-ink">
              What kind of property?
            </label>
            {attemptedNext && !form.propertyCategory && (
              <span className="text-[10px] text-rose-500 font-bold">Required</span>
            )}
          </div>
          <div className={`flex flex-wrap gap-2.5 p-1 rounded-2xl transition-all ${attemptedNext && !form.propertyCategory ? "border border-rose-500 bg-rose-50/5 shadow-sm shadow-rose-100" : ""}`}>
            {["Residential", "Commercial"].map((cat) => {
              const active = form.propertyCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all ${
                    active
                      ? "bg-sky-50/50 border-sky-500 text-sky-700 font-semibold shadow-sm"
                      : "bg-white border-charcoal/10 text-charcoal hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Field 3 - Specific Property Type */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <label className="font-display font-bold text-[15px] text-ink">
              Select Property Type
            </label>
            {attemptedNext && !form.propertyType ? (
              <span className="text-[10px] text-rose-500 font-bold">Required</span>
            ) : (
              !form.propertyType && (
                <span className="flex items-center gap-1 text-[11px] text-amber-600 mt-1 font-medium">
                  <AlertCircle size={12} /> Please select the type of property you wish to advertise
                </span>
              )
            )}
          </div>
          <div className={`flex flex-wrap gap-2.5 p-1 rounded-2xl transition-all ${attemptedNext && !form.propertyType ? "border border-rose-500 bg-rose-50/5 shadow-sm shadow-rose-100" : ""}`}>
            {activeTypes.map((type) => {
              const active = form.propertyType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => update({ propertyType: type })}
                  className={`px-4 py-2.5 rounded-full border text-xs font-medium transition-all ${
                    active
                      ? "bg-sky-50/50 border-sky-500 text-sky-700 font-semibold shadow-sm"
                      : "bg-white border-charcoal/8 text-charcoal hover:bg-slate-50"
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
      <div className="px-6 pb-8 pt-6">
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-xl font-display font-semibold text-[15px] transition-all shadow-md bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.99]"
        >
          Next
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
