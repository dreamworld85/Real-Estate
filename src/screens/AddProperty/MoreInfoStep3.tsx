import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Crosshair, HelpCircle, ChevronLeft, Info } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import { api } from "@/lib/api";

export default function MoreInfoStep3() {
  const navigate = useNavigate();
  const { form, update } = useAddProperty();
  const { user } = useAuth();
  
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState("https://wa.me/917012021221");

  useEffect(() => {
    api.fetchSetting("admin_contact_number")
      .then((data) => {
        if (data && data.value) {
          const cleanNum = data.value.replace(/\D/g, "");
          setWhatsappLink(`https://wa.me/${cleanNum.startsWith("91") ? cleanNum : `91${cleanNum}`}`);
        }
      })
      .catch((err) => console.error("Error loading admin contact number:", err));
  }, []);

  // States to toggle additional area input fields
  const [showBuiltUp, setShowBuiltUp] = useState(!!form.builtUpArea);
  const [showSuperBuiltUp, setShowSuperBuiltUp] = useState(!!form.superBuiltUpArea);

  // States to toggle additional price info
  const [showMorePricing, setShowMorePricing] = useState(false);

  // Geocoding function for locating city
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
          );
          if (response.ok) {
            const data = await response.json();
            const addressParts = data.address || {};
            const cityName = addressParts.city || addressParts.town || addressParts.village || addressParts.suburb || "";
            if (cityName) {
              update({ district: cityName });
            } else {
              update({ district: data.display_name || `${latitude}, ${longitude}` });
            }
          }
        } catch (error) {
          console.error("Geocoding failed", error);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        alert("Geolocation error: " + error.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const isLand = form.propertyType === "Plot / Land" || form.propertyType === "Land";

  useEffect(() => {
    if (isLand && form.areaUnit !== "Cents" && form.areaUnit !== "Acres") {
      update({ areaUnit: "Cents" });
    }
  }, [isLand, form.areaUnit, update]);

  // Validate Step 2 details
  const canContinue = 
    (isLand || (form.bedrooms && form.bathrooms)) && 
    form.carpetArea && 
    form.price;

  function handleNext() {
    setAttemptedNext(true);
    if (canContinue) {
      // Navigate to Step 3: Media Upload (Photos/Videos)
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
    <div className="min-h-screen flex flex-col bg-white pb-24 text-left font-display select-none overflow-x-hidden relative">
      {/* Top Blue Progress Bar Line (66.66% completed) */}
      <div className="w-full h-1 bg-slate-100 flex shrink-0">
        <div className="h-full bg-[#59AD63] w-[66.66%] transition-all duration-300" />
      </div>

      {/* Header Row */}
      <div className="flex justify-between items-center px-6 pt-5 pb-2 shrink-0">
        <button 
          type="button"
          onClick={() => navigate("/add-property/details")}
          className="text-charcoal p-1.5 -ml-1.5 hover:bg-charcoal/5 rounded-full transition-all duration-200 cursor-pointer active:scale-95"
          aria-label="Back"
        >
          <ChevronLeft size={22} className="text-[#091F40]" />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="font-bold text-sm text-[#091F40]">Property Details</span>
          <span className="text-[9px] font-bold text-slate/50 tracking-wider uppercase leading-none mt-0.5">
            Step 2 of 3
          </span>
        </div>

        <a 
          href={whatsappLink} 
          target="_blank" 
          rel="noreferrer" 
          className="flex items-center gap-1 text-[11.5px] font-bold text-[#59AD63] hover:underline"
        >
          <span>Need Help?</span>
          <svg className="w-4 h-4 text-[#25D366] fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.516.002 10.003-4.484 10.006-9.998.002-2.673-1.039-5.187-2.932-7.082C16.43 1.63 13.918.585 11.244.585 5.729.585 1.24 5.07 1.238 10.586c-.001 1.516.398 2.998 1.157 4.312L1.336 21.05l6.311-1.657-.001-.239zM18.06 14.86c-.329-.165-1.953-.965-2.253-1.074-.3-.109-.519-.165-.738.165-.219.329-.848 1.074-1.039 1.293-.19.219-.382.246-.71.082-1.393-.697-2.316-1.229-3.232-2.81-.242-.415.242-.385.693-1.284.076-.153.038-.287-.019-.396-.057-.109-.519-1.25-.71-1.71-.186-.447-.376-.386-.519-.393-.134-.007-.288-.008-.442-.008-.154 0-.404.058-.616.287-.211.23-.807.788-.807 1.921 0 1.134.826 2.23.94 2.385.115.155 1.625 2.483 3.937 3.48.55.237 1.03.396 1.385.508.558.177 1.066.152 1.468.092.448-.067 1.953-.799 2.228-1.573.275-.774.275-1.439.192-1.573-.082-.134-.3-.213-.629-.379z"/>
          </svg>
        </a>
      </div>

      <div className="px-6 flex flex-col gap-6 mt-3 flex-1">
        {/* Title */}
        <h1 className="font-display font-extrabold text-[18px] text-[#091F40] leading-none">
          Add Property Details
        </h1>

        {/* Section 2: Room Details (Hide for Land category) */}
        {!isLand && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-extrabold text-[#091F40] tracking-wide border-t border-slate-100 pt-4 mt-2">
              Add Room Details
            </h2>

            {/* Bedrooms */}
            <div className="flex flex-col gap-2">
              <span className="text-[11.5px] font-bold text-[#091F40]/80">No. of Bedrooms</span>
              <div className="flex flex-wrap gap-2.5">
                {["1", "2", "3", "4", "5", "5+"].map((count) => {
                  const active = form.bedrooms === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => update({ bedrooms: count })}
                      className={`w-10 h-10 rounded-full border flex items-center justify-center text-xs font-semibold select-none cursor-pointer active:scale-95 transition-all ${
                        active
                          ? "bg-[#59AD63]/10 border-[#59AD63] text-[#59AD63]"
                          : "bg-white border-[#59AD63]/30 text-charcoal hover:border-slate-400"
                      }`}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bathrooms */}
            <div className="flex flex-col gap-2">
              <span className="text-[11.5px] font-bold text-[#091F40]/80">No. of Bathrooms</span>
              <div className="flex flex-wrap gap-2.5">
                {["1", "2", "3", "4", "4+"].map((count) => {
                  const active = form.bathrooms === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => update({ bathrooms: count })}
                      className={`w-10 h-10 rounded-full border flex items-center justify-center text-xs font-semibold select-none cursor-pointer active:scale-95 transition-all ${
                        active
                          ? "bg-[#59AD63]/10 border-[#59AD63] text-[#59AD63]"
                          : "bg-white border-[#59AD63]/30 text-charcoal hover:border-slate-400"
                      }`}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Add Area Details */}
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 mt-2">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-[#091F40]">Add Area Details</span>
            <Info size={14} className="text-slate/60" />
          </div>
          <span className="text-[10px] font-bold text-slate/50 leading-none -mt-1 px-0.5">
            Atleast one area type is mandatory
          </span>

          {/* Carpet Area (Always visible) */}
          <div className="flex gap-2.5 items-center mt-1">
            <div className={`flex-1 relative border rounded-[8px] px-4 pt-5 pb-2.5 bg-white flex items-center shadow-sm focus-within:border-[#59AD63] focus-within:ring-1 focus-within:ring-[#59AD63]/30 transition-all duration-150 ${
              attemptedNext && !form.carpetArea ? "border-rose-500 bg-rose-50/5" : "border-[#59AD63]/30"
            }`}>
              <span className="absolute top-1.5 left-4 text-[10px] font-semibold text-slate/60 select-none">
                Carpet Area
              </span>
              <input
                type="number"
                placeholder={form.areaUnit || "sq.ft."}
                value={form.areaSqft || form.carpetArea || ""}
                onChange={(e) => update({ carpetArea: e.target.value, areaSqft: e.target.value })}
                className="flex-1 text-[13.5px] font-bold text-charcoal placeholder:text-slate/30 outline-none bg-transparent"
              />
            </div>
            
            <div className="relative w-24 shrink-0">
              <select
                value={form.areaUnit || (isLand ? "Cents" : "sq.ft.")}
                onChange={(e) => update({ areaUnit: e.target.value })}
                className="w-full h-[50px] rounded-[8px] bg-white border border-[#59AD63]/30 px-3.5 text-[13.5px] font-bold text-charcoal appearance-none cursor-pointer outline-none focus:border-[#59AD63]"
              >
                {isLand ? (
                  <>
                    <option value="Cents">Cents</option>
                    <option value="Acres">Acres</option>
                    <option value="sq.ft.">sq.ft.</option>
                    <option value="sq.yrd.">sq.yrd.</option>
                    <option value="sq.m.">sq.m.</option>
                  </>
                ) : (
                  <>
                    <option value="sq.ft.">sq.ft.</option>
                    <option value="sq.yrd.">sq.yrd.</option>
                    <option value="sq.m.">sq.m.</option>
                    <option value="Cents">Cents</option>
                  </>
                )}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate/50 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Section 4: Floor Details */}
        {!isLand && form.propertyType === "Apartment" && (
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 mt-2">
            <span className="text-sm font-bold text-[#091F40]">Floor Details</span>
            <span className="text-[10px] font-bold text-slate/50 leading-none -mt-1 px-0.5">
              Total no of floors and your floor details
            </span>

            <div className="grid grid-cols-2 gap-3.5 mt-1">
              {/* Total building floors */}
              <div className="relative border border-[#59AD63]/30 rounded-[8px] px-4 pt-5 pb-2.5 bg-white flex items-center shadow-sm focus-within:border-[#59AD63] transition-all">
                <span className="absolute top-1.5 left-4 text-[10px] font-semibold text-slate/60 select-none">
                  Total floors in building
                </span>
                <input
                  type="number"
                  value={form.totalFloors || ""}
                  onChange={(e) => update({ totalFloors: e.target.value })}
                  className="flex-1 text-[13.5px] font-bold text-charcoal placeholder:text-slate/30 outline-none bg-transparent"
                />
              </div>

              {/* Property Floor */}
              <div className="relative w-full">
                <div className="absolute top-1.5 left-4 text-[10px] font-semibold text-slate/60 select-none z-10">
                  Property on floor
                </div>
                <select
                  value={form.propertyFloor || ""}
                  onChange={(e) => update({ propertyFloor: e.target.value })}
                  className="w-full h-[50px] rounded-[8px] bg-white border border-[#59AD63]/30 px-4 pt-4 text-[13.5px] font-bold text-charcoal appearance-none cursor-pointer outline-none focus:border-[#59AD63]"
                >
                  <option value="" disabled></option>
                  <option value="Ground">Ground</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5+">5+</option>
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate/50 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Section 6: Price Details */}
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 mt-2">
          <span className="text-sm font-bold text-[#091F40]">Price Details</span>
          
          <div className={`relative border rounded-[8px] px-4 pt-5 pb-2.5 bg-white flex items-center shadow-sm focus-within:border-[#59AD63] transition-all duration-150 ${
            attemptedNext && !form.price ? "border-rose-500 bg-rose-50/5" : "border-[#59AD63]/30"
          }`}>
            <span className="absolute top-1.5 left-4 text-[10px] font-semibold text-slate/60 select-none">
              ₹ Expected Price
            </span>
            <input
              type="number"
              placeholder="e.g. 5,000,000"
              value={form.price || ""}
              onChange={(e) => update({ price: e.target.value })}
              className="flex-1 text-[13.5px] font-bold text-charcoal placeholder:text-slate/30 outline-none bg-transparent"
            />
          </div>
          {form.price && (
            <div className="text-[12px] font-bold text-[#59AD63] pl-1 animate-fade-in -mt-1 select-none">
              {(() => {
                const num = Number(form.price);
                if (!num || isNaN(num)) return "";
                if (num >= 10000000) {
                  const cr = num / 10000000;
                  return `${cr.toFixed(2).replace(/\.00$/, "")} Crores`;
                }
                if (num >= 100000) {
                  const lakh = num / 100000;
                  return `${lakh.toFixed(2).replace(/\.00$/, "")} Lakhs`;
                }
                if (num >= 1000) {
                  const thousand = num / 1000;
                  return `${thousand.toFixed(2).replace(/\.00$/, "")} Thousands`;
                }
                return `${num.toLocaleString("en-IN")}`;
              })()}
            </div>
          )}

          <div className="flex flex-col gap-2.5 mt-1 pl-0.5">
            {/* All inclusive price */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none self-start">
              <input
                type="checkbox"
                checked={!!form.isAllInclusive}
                onChange={(e) => update({ isAllInclusive: e.target.checked })}
                className="w-4.5 h-4.5 rounded border-[#59AD63]/30 text-[#59AD63] focus:ring-[#59AD63]"
              />
              <span className="text-[13px] font-semibold text-slate-700 flex items-center gap-1">
                <span>All inclusive price</span>
                <HelpCircle size={13} className="text-slate/40" />
              </span>
            </label>

            {/* Price Negotiable */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none self-start">
              <input
                type="checkbox"
                checked={!!form.isPriceNegotiable}
                onChange={(e) => update({ isPriceNegotiable: e.target.checked })}
                className="w-4.5 h-4.5 rounded border-[#59AD63]/30 text-[#59AD63] focus:ring-[#59AD63]"
              />
              <span className="text-[13px] font-semibold text-slate-700">Price Negotiable</span>
            </label>

            {/* Tax excluded */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none self-start">
              <input
                type="checkbox"
                checked={!!form.isTaxExcluded}
                onChange={(e) => update({ isTaxExcluded: e.target.checked })}
                className="w-4.5 h-4.5 rounded border-[#59AD63]/30 text-[#59AD63] focus:ring-[#59AD63]"
              />
              <span className="text-[13px] font-semibold text-slate-700">Tax and Govt. charges excluded</span>
            </label>
          </div>

          {!showMorePricing && (
            <button
              type="button"
              onClick={() => setShowMorePricing(true)}
              className="text-xs font-bold text-[#59AD63] hover:underline self-start active:scale-95 transition-all select-none pl-0.5 mt-0.5"
            >
              + Add more pricing details
            </button>
          )}

          {showMorePricing && (
            <div className="flex flex-col gap-2 mt-1 animate-fade-in">
              <div className="relative border border-[#59AD63]/30 rounded-[8px] px-4 pt-5 pb-2.5 bg-white flex items-center shadow-sm focus-within:border-[#59AD63] transition-all">
                <span className="absolute top-1.5 left-4 text-[10px] font-semibold text-slate/60 select-none">
                  Maintenance Price (Monthly)
                </span>
                <input
                  type="number"
                  placeholder="₹ e.g. 2,000"
                  className="flex-1 text-[13.5px] font-bold text-charcoal placeholder:text-slate/30 outline-none bg-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Post and Continue Submit Button */}
        <div className="mt-6 pb-6">
          <button
            onClick={handleNext}
            className="w-full py-4 rounded-[2px] font-display font-bold text-[14px] text-white bg-[#59AD63] hover:bg-[#3F8F4B] transition-all duration-200 cursor-pointer active:scale-98 shadow-sm shadow-[#59AD63]/10 flex items-center justify-center"
          >
            Continue
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}