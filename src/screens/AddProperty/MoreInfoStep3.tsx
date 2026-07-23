import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crosshair } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
import Header from "@/components/Header";
import StepProgress from "@/components/StepProgress";
import Select from "@/components/Select";
import Input from "@/components/Input";
import BottomNav from "@/components/BottomNav";

const residentialTypes = [
  "Apartment",
  "Independent House / Villa",
  "Builder Floor",
  "Plot / Land",
  "1 RK / Studio Apartment",
  "Serviced Apartment",
  "Farmhouse",
  "Other",
];

const commercialTypes = [
  "Office Space",
  "Retail Shop",
  "Plot / Land",
  "Warehouse",
  "Co-working Space",
  "Other",
];

const counts = ["1", "2", "3", "4", "5+"];
const furnishingOptions = ["Unfurnished", "Semi-Furnished", "Fully Furnished"];
const facingOptions = ["East", "West", "North", "South", "North-East", "North-West", "South-East", "South-West"];
const ageOptions = ["Under Construction", "0-1 Years", "1-5 Years", "5-10 Years", "10+ Years"];

const districts = [
  "Wayanad", "Kozhikode", "Kannur", "Kasaragod", "Malappuram", "Palakkad",
  "Thrissur", "Ernakulam", "Idukki", "Kottayam", "Alappuzha", "Pathanamthitta",
  "Kollam", "Thiruvananthapuram",
];

function formatInputPrice(priceStr: string): string {
  const val = Number(priceStr);
  if (!val) return "";
  if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹ ${(val / 100000).toFixed(2)} L`;
  return `₹ ${val.toLocaleString("en-IN")}`;
}

export default function MoreInfoStep3() {
  const navigate = useNavigate();
  const { form, update } = useAddProperty();

  const [attemptedNext, setAttemptedNext] = useState(false);

  const isLand = form.propertyType === "Land" || form.propertyType === "Plot / Land";
  const showBedrooms = !isLand && form.propertyCategory !== "Commercial" && form.propertyType !== "Office Space";

  // Pre-initialize bedrooms and bathrooms to "0" if empty to satisfy the stepper logic
  useEffect(() => {
    if (showBedrooms && !form.bedrooms) {
      update({ bedrooms: "0" });
    }
    if (!isLand && !form.bathrooms) {
      update({ bathrooms: "0" });
    }
  }, [showBedrooms, isLand, form.bedrooms, form.bathrooms, update]);

  const canContinue = 
    form.price && 
    form.areaSqft && 
    form.address && 
    form.district && 
    (isLand || ((!showBedrooms || form.bedrooms) && form.bathrooms && form.furnishing && form.facing && form.propertyAge));

  function handleNext() {
    setAttemptedNext(true);
    if (canContinue) {
      navigate("/add-property/review");
    } else {
      // Scroll to the first validation error
      setTimeout(() => {
        const firstError = document.querySelector(".border-rose-500");
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }

  return (
    <div className="min-h-screen flex flex-col pb-28 bg-slate-50">
      <Header title="Add Property" showBack />
      <StepProgress step={3} />

      <div className="px-6 flex flex-col gap-5 flex-1">
        <h2 className="font-display font-extrabold text-xl text-black -mt-1">Details & Location</h2>
        <p className="text-xs text-slate -mt-4 mb-1">Fill in the pricing, size, location, and key specs of the property.</p>

        {/* CARD 1: Pricing & Size */}
        <div className="bg-white border border-charcoal/5 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
          <span className="text-[10px] font-bold text-slate uppercase tracking-wider pl-0.5">Total Prize & Size</span>
          
          <div>
            <Input
              label="Total Prize"
              type="number"
              placeholder="e.g. 4500000"
              value={form.price}
              onChange={(e) => update({ price: e.target.value })}
              error={attemptedNext && !form.price}
            />
            {form.price && (
              <span className="text-xs text-emerald-600 font-bold ml-1.5 mt-1 block">
                {formatInputPrice(form.price)}
              </span>
            )}
          </div>

          {isLand ? (
            <div className="flex gap-2">
              <div className="flex-[2]">
                <Input
                  label="Area Size"
                  type="number"
                  placeholder="e.g. 5.5"
                  value={form.areaSqft}
                  onChange={(e) => update({ areaSqft: e.target.value })}
                  error={attemptedNext && !form.areaSqft}
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate">Unit</label>
                <select
                  value={form.areaUnit}
                  onChange={(e) => update({ areaUnit: e.target.value })}
                  className="w-full rounded-xl border border-charcoal/10 bg-white px-3 py-3 text-xs text-charcoal focus:border-emerald-600/50 h-[48px] shadow-sm font-semibold"
                >
                  <option value="Cents">Cents</option>
                  <option value="Acres">Acres</option>
                  <option value="sq.ft">sq.ft</option>
                </select>
              </div>
            </div>
          ) : (
            <Input
              label="Area Size (sq.ft)"
              type="number"
              placeholder="e.g. 1500"
              value={form.areaSqft}
              onChange={(e) => update({ areaSqft: e.target.value })}
              error={attemptedNext && !form.areaSqft}
            />
          )}
        </div>

        {/* CARD 2: Location */}
        <div className="bg-white border border-charcoal/5 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
          <span className="text-[10px] font-bold text-slate uppercase tracking-wider pl-0.5">Location details</span>
          
          <Input
            label="Location Address"
            placeholder="Street name, locality, landmark"
            value={form.address}
            onChange={(e) => update({ address: e.target.value })}
            error={attemptedNext && !form.address}
          />
          
          <div>
            <Select
              label="District"
              options={districts}
              value={form.district}
              onChange={(e) => update({ district: e.target.value })}
              error={attemptedNext && !form.district}
            />
            <button className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 mt-2 hover:underline select-none">
              <Crosshair size={14} /> Use Current Location
            </button>
          </div>
        </div>

        {/* CARD 3: Specifications (only if not land) */}
        {!isLand && (
          <div className="bg-white border border-charcoal/5 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider pl-0.5">Specifications</span>
            
            {showBedrooms && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate">Bedrooms</label>
                <div className="flex gap-2">
                  {["1", "2", "3", "4", "5+"].map((count) => {
                    const active = form.bedrooms === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => update({ bedrooms: count })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          active
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                            : "bg-slate-50 border-charcoal/8 text-charcoal hover:bg-slate-100"
                        }`}
                      >
                        {count}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate">Bathrooms</label>
              <div className="flex gap-2">
                {["1", "2", "3", "4", "5+"].map((count) => {
                  const active = form.bathrooms === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => update({ bathrooms: count })}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        active
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                          : "bg-slate-50 border-charcoal/8 text-charcoal hover:bg-slate-100"
                      }`}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate">Furnishing Status</label>
                {attemptedNext && !form.furnishing && (
                  <span className="text-[10px] text-rose-500 font-bold">Required</span>
                )}
              </div>
              <div className={`flex gap-2 p-1 rounded-2xl transition-all ${attemptedNext && !form.furnishing ? "border border-rose-500 bg-rose-50/10 shadow-sm shadow-rose-100" : ""}`}>
                {furnishingOptions.map((opt) => {
                  const active = form.furnishing === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => update({ furnishing: opt })}
                      className={`flex-1 py-2 px-1 rounded-xl text-[10px] font-bold border transition-all text-center leading-tight whitespace-nowrap ${
                        active
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                          : "bg-slate-50 border-charcoal/8 text-charcoal hover:bg-slate-100"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate">Property Age</label>
                {attemptedNext && !form.propertyAge && (
                  <span className="text-[10px] text-rose-500 font-bold">Required</span>
                )}
              </div>
              <div className={`flex flex-wrap gap-2 p-1 rounded-2xl transition-all ${attemptedNext && !form.propertyAge ? "border border-rose-500 bg-rose-50/10 shadow-sm shadow-rose-100" : ""}`}>
                {ageOptions.map((opt) => {
                  const active = form.propertyAge === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => update({ propertyAge: opt })}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                        active
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                          : "bg-slate-50 border-charcoal/8 text-charcoal hover:bg-slate-100"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CARD 4: Additional Details */}
        <div className="bg-white border border-charcoal/5 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
          <span className="text-[10px] font-bold text-slate uppercase tracking-wider pl-0.5">Additional Details</span>
          
          <Select
            label="Facing Direction"
            options={facingOptions}
            value={form.facing}
            onChange={(e) => update({ facing: e.target.value })}
            error={attemptedNext && !form.facing}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate">Description</label>
            <textarea
              rows={4}
              placeholder="Describe amenities, location benefits, nearby landmarks..."
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              className="w-full rounded-xl border border-charcoal/10 bg-slate-50 px-4 py-3 text-xs text-charcoal placeholder:text-slate/40 focus:border-emerald-600/50 outline-none resize-none shadow-inner h-28"
            />
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 pt-6">
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-xl font-display font-semibold text-[15px] transition-all shadow-md bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.99] shadow-emerald-100"
        >
          Next
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
