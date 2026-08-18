import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { mediaUrl } from "@/lib/api";
import { Crosshair } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
import { useAuth } from "@/lib/AuthContext";
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

function formatFriendlyPrice(val: number): string {
  if (!val) return "";
  if (val >= 10000000) {
    const cr = val / 10000000;
    return `₹ ${cr % 1 === 0 ? cr : cr.toFixed(2)} Crore`;
  }
  if (val >= 100000) {
    const lakh = val / 100000;
    return `₹ ${lakh % 1 === 0 ? lakh : lakh.toFixed(2)} Lakh`;
  }
  return `₹ ${val.toLocaleString("en-IN")}`;
}

export default function MoreInfoStep3() {
  const navigate = useNavigate();
  const { form, update } = useAddProperty();
  const { user } = useAuth();
  const [attemptedNext, setAttemptedNext] = useState(false);

  const isLand = form.propertyType === "Land" || form.propertyType === "Plot / Land";
  const showBedrooms = !isLand && form.propertyCategory !== "Commercial" && form.propertyType !== "Office Space";

  // Pre-initialize bedrooms, bathrooms, and uploader contact details if empty
  useEffect(() => {
    if (showBedrooms && !form.bedrooms) {
      update({ bedrooms: "0" });
    }
    if (!isLand && !form.bathrooms) {
      update({ bathrooms: "0" });
    }
    if (user) {
      const updates: any = {};
      const rawRole = form.role || user.role || "owner";
      const normalizedRole = rawRole.toLowerCase();
      // Store standard capitalized role in form state to keep context consistent
      const displayRole = normalizedRole === "broker" ? "Broker" : (normalizedRole === "agency" ? "Agency" : "Owner");

      if (form.role !== displayRole) {
        updates.role = displayRole;
      }
      if (!form.contactPhone && user.phone) {
        updates.contactPhone = user.phone;
      }
      if (!form.whatsappNumber && user.phone) {
        updates.whatsappNumber = user.phone;
      }
      if (displayRole === "Owner" && !form.ownerName && user.name) {
        updates.ownerName = user.name;
      }
      if (displayRole === "Broker" && !form.brokerName && user.name) {
        updates.brokerName = user.name;
      }
      if (displayRole === "Agency" && !form.agencyName && user.name) {
        updates.agencyName = user.name;
      }
      if (Object.keys(updates).length > 0) {
        update(updates);
      }
    }
  }, [showBedrooms, isLand, form.bedrooms, form.bathrooms, form.contactPhone, form.whatsappNumber, form.ownerName, form.brokerName, form.agencyName, form.role, user, update]);

  const validatePhone = (num: string) => num && num.trim().length >= 8;

  const isContactValid = (() => {
    if (!form.role) return false;
    const hasContact = validatePhone(form.contactPhone) && validatePhone(form.whatsappNumber);
    if (!hasContact) return false;

    const normalizedRole = form.role.toLowerCase();
    if (normalizedRole === "owner") {
      return !!form.ownerName?.trim();
    }
    if (normalizedRole === "broker") {
      return !!form.brokerName?.trim();
    }
    if (normalizedRole === "agency") {
      return true;
    }
    return false;
  })();

  const canContinue = 
    form.price && 
    form.areaSqft && 
    form.address && 
    form.district && 
    isContactValid &&
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
  const priceVal = Number(form.price) || 0;
  const areaVal = Number(form.areaSqft) || 0;
  
  let pricePerCent = 0;
  let pricePerAcre = 0;
  let pricePerSqft = 0;

  if (priceVal > 0 && areaVal > 0) {
    if (form.areaUnit === "Cents" || !form.areaUnit) {
      pricePerCent = priceVal / areaVal;
      pricePerAcre = pricePerCent * 100;
      pricePerSqft = priceVal / (areaVal * 435.6);
    } else if (form.areaUnit === "Acres") {
      pricePerAcre = priceVal / areaVal;
      pricePerCent = pricePerAcre / 100;
      pricePerSqft = priceVal / (areaVal * 43560);
    } else { // sq.ft
      pricePerSqft = priceVal / areaVal;
      pricePerCent = pricePerSqft * 435.6;
      pricePerAcre = pricePerSqft * 43560;
    }
  }

  return (
    <div className="min-h-screen flex flex-col pb-28 bg-slate-50">
      <Header title="Add Property" showBack />
      <StepProgress step={3} />

      <div className="px-6 flex flex-col gap-4 flex-1">
        <h2 className="font-display font-extrabold text-xl text-black -mt-1">Details & Location</h2>
        <p className="text-[10px] text-slate -mt-4 mb-0.5 leading-snug">Fill in the pricing, size, location, and key specs of the property.</p>

        {/* CARD 1: Pricing & Size */}
        <div className="bg-white border border-charcoal/5 p-3.5 rounded-2xl shadow-sm flex flex-col gap-3">
          <span className="text-[10px] font-bold text-slate uppercase tracking-wider pl-0.5">Total Price & Size</span>
          
          <div className="grid grid-cols-2 gap-3 items-start">
            <div className="flex flex-col">
              <Input
                label="Total Price"
                type="number"
                placeholder="e.g. 4500000"
                value={form.price}
                onChange={(e) => update({ price: e.target.value })}
                error={attemptedNext && !form.price}
              />
              {form.price && (
                <span className="text-[10px] text-emerald-600 font-bold ml-1.5 mt-0.5 block leading-none">
                  {formatFriendlyPrice(Number(form.price))}
                </span>
              )}
            </div>

            <div>
              {isLand ? (
                <div className="flex gap-1.5 items-end">
                  <div className="flex-[5]">
                    <Input
                      label="Area Size"
                      type="number"
                      placeholder="e.g. 5.5"
                      value={form.areaSqft}
                      onChange={(e) => update({ areaSqft: e.target.value })}
                      error={attemptedNext && !form.areaSqft}
                    />
                  </div>
                  <div className="flex-[4] flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate">Unit</label>
                    <select
                      value={form.areaUnit}
                      onChange={(e) => update({ areaUnit: e.target.value })}
                      className="w-full rounded-xl border border-charcoal/10 bg-white px-2.5 py-2 text-[11px] text-charcoal focus:border-emerald-600/50 h-[36px] shadow-sm font-semibold cursor-pointer outline-none"
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
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-0.5 border-t border-charcoal/5 pt-2 select-none">
            {/* Price Negotiable Checkbox */}
            <div className="flex items-center gap-2 pl-1">
              <input
                type="checkbox"
                id="isPriceNegotiable"
                checked={!!form.isPriceNegotiable}
                onChange={(e) => update({ isPriceNegotiable: e.target.checked })}
                className="w-3.5 h-3.5 rounded text-forest border-charcoal/20 focus:ring-forest cursor-pointer"
              />
              <label htmlFor="isPriceNegotiable" className="text-[11px] font-bold text-slate/85 cursor-pointer">
                Price is Negotiable
              </label>
            </div>

            {/* Broker's Personal Property Checkbox */}
            {(form.role === "Broker" || (user?.role && user.role.toLowerCase() === "broker")) && (
              <div className="flex items-center gap-2 pl-1 border-l border-charcoal/10 pl-3">
                <input
                  type="checkbox"
                  id="isBrokerPersonalProperty"
                  checked={!!form.isBrokerPersonalProperty}
                  onChange={(e) => update({ isBrokerPersonalProperty: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-forest border-charcoal/20 focus:ring-forest cursor-pointer"
                />
                <label htmlFor="isBrokerPersonalProperty" className="text-[11px] font-bold text-slate/85 cursor-pointer">
                  My Own Property
                </label>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: Location */}
        <div className="bg-white border border-charcoal/5 p-3.5 rounded-2xl shadow-sm flex flex-col gap-3">
          <span className="text-[10px] font-bold text-slate uppercase tracking-wider pl-0.5">Location details</span>
          
          <Input
            label="Location Address"
            placeholder="Street name, locality, landmark"
            value={form.address}
            onChange={(e) => update({ address: e.target.value })}
            error={attemptedNext && !form.address}
          />
          
          <div className="grid grid-cols-2 gap-3 items-end">
            <Select
              label="District"
              options={districts}
              value={form.district}
              onChange={(e) => update({ district: e.target.value })}
              error={attemptedNext && !form.district}
            />
            <button className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 border border-sky-200/20 py-2.5 rounded-xl transition-all cursor-pointer h-[36px] mb-0.5">
              <Crosshair size={12} /> Current Location
            </button>
          </div>
        </div>

        {/* CARD 3: Specifications (only if not land) */}
        {!isLand && (
          <div className="bg-white border border-charcoal/5 p-3.5 rounded-2xl shadow-sm flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider pl-0.5">Specifications</span>
            
            {/* Bedrooms & Bathrooms side-by-side */}
            <div className="grid grid-cols-2 gap-3">
              {showBedrooms && (
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate">Bedrooms</label>
                  <div className="flex gap-1">
                    {["1", "2", "3", "4", "5+"].map((count) => {
                      const active = form.bedrooms === count;
                      return (
                        <button
                          key={count}
                          type="button"
                          onClick={() => update({ bedrooms: count })}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
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
              
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate">Bathrooms</label>
                <div className="flex gap-1">
                  {["1", "2", "3", "4", "5+"].map((count) => {
                    const active = form.bathrooms === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => update({ bathrooms: count })}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
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
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate">Furnishing Status</label>
                  {attemptedNext && !form.furnishing && (
                    <span className="text-[9px] text-rose-500 font-bold">Required</span>
                  )}
                </div>
                <select
                  value={form.furnishing || ""}
                  onChange={(e) => update({ furnishing: e.target.value })}
                  className={`w-full rounded-xl border bg-white px-2.5 py-2 text-[11px] text-charcoal focus:border-emerald-600/50 h-[36px] shadow-sm font-semibold cursor-pointer outline-none ${
                    attemptedNext && !form.furnishing ? "border-rose-500 bg-rose-50/10" : "border-charcoal/10"
                  }`}
                >
                  <option value="">Select Furnishing</option>
                  {furnishingOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate">Property Age</label>
                  {attemptedNext && !form.propertyAge && (
                    <span className="text-[9px] text-rose-500 font-bold">Required</span>
                  )}
                </div>
                <select
                  value={form.propertyAge || ""}
                  onChange={(e) => update({ propertyAge: e.target.value })}
                  className={`w-full rounded-xl border bg-white px-2.5 py-2 text-[11px] text-charcoal focus:border-emerald-600/50 h-[36px] shadow-sm font-semibold cursor-pointer outline-none ${
                    attemptedNext && !form.propertyAge ? "border-rose-500 bg-rose-50/10" : "border-charcoal/10"
                  }`}
                >
                  <option value="">Select Age</option>
                  {ageOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* CARD 4: Additional Details */}
        <div className="bg-white border border-charcoal/5 p-3.5 rounded-2xl shadow-sm flex flex-col gap-3">
          <span className="text-[10px] font-bold text-slate uppercase tracking-wider pl-0.5">Additional Details</span>
          
          <div className="grid grid-cols-1 gap-3">
            <Select
              label="Facing Direction"
              options={facingOptions}
              value={form.facing}
              onChange={(e) => update({ facing: e.target.value })}
              error={attemptedNext && !form.facing}
            />

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate">Description</label>
              <textarea
                rows={2}
                placeholder="Describe amenities, location benefits, nearby landmarks..."
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                className="w-full rounded-xl border border-charcoal/10 bg-slate-50 px-3 py-2 text-xs text-charcoal placeholder:text-slate/40 focus:border-emerald-600/50 outline-none resize-none shadow-inner h-16"
              />
            </div>
          </div>
        </div>

        {/* CARD 5: Contact & Uploader Info */}
        <div className="bg-white border border-charcoal/5 p-3.5 rounded-2xl shadow-sm flex flex-col gap-3">
          <span className="text-[10px] font-bold text-slate uppercase tracking-wider pl-0.5">Uploader & Contact Info</span>
          
          {form.role?.toLowerCase() === "owner" && (
            <Input
              label="Owner Name"
              placeholder="Enter owner name"
              value={form.ownerName}
              onChange={(e) => update({ ownerName: e.target.value })}
              error={attemptedNext && !form.ownerName}
            />
          )}

          {form.role?.toLowerCase() === "broker" && (
            <Input
              label="Broker Name"
              placeholder="Enter broker name"
              value={form.brokerName}
              onChange={(e) => update({ brokerName: e.target.value })}
              error={attemptedNext && !form.brokerName}
            />
          )}



          {/* Contact Details side-by-side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="Contact Number"
                placeholder="Enter contact number"
                value={form.contactPhone}
                onChange={(e) => {
                  const val = e.target.value;
                  update({ 
                    contactPhone: val,
                    whatsappNumber: form.sameAsContact ? val : form.whatsappNumber
                  });
                }}
                error={attemptedNext && !validatePhone(form.contactPhone)}
              />
              <div className="flex items-center gap-1.5 mt-1 select-none">
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
                  className="w-3.5 h-3.5 rounded border-charcoal/20 text-black focus:ring-black bg-white cursor-pointer"
                />
                <label htmlFor="sameAsContact" className="text-[9px] font-bold text-slate cursor-pointer leading-tight">
                  Same for WhatsApp
                </label>
              </div>
            </div>

            <div>
              <Input
                label="WhatsApp Number"
                placeholder="WhatsApp number"
                value={form.whatsappNumber}
                disabled={form.sameAsContact}
                onChange={(e) => update({ whatsappNumber: e.target.value })}
                error={attemptedNext && !validatePhone(form.whatsappNumber)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-5">
        <button
          onClick={handleNext}
          className="w-full py-3.5 rounded-xl font-display font-semibold text-[14px] transition-all shadow-md bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.99] shadow-emerald-100"
        >
          Next
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
