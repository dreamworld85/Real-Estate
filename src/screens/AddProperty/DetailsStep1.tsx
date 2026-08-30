import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Menu, Lock } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
import { useAuth } from "@/lib/AuthContext";
import { ListingRole } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import { api } from "@/lib/api";

const residentialTypesForSale = [
  "Apartment",
  "Independent House / Villa",
  "Builder Floor",
  "Plot / Land",
  "1 RK/ Studio Apartment",
  "Farmhouse",
  "Other",
];

const residentialTypesForRent = [
  "Apartment",
  "Independent House / Villa",
  "Builder Floor",
  "1 RK/ Studio Apartment",
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
  const [showAllTypes, setShowAllTypes] = useState(false);
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

  const isRent = form.purpose === "For Rent" || form.purpose === "Paying Guest";
  const activeTypes = form.propertyCategory === "Commercial"
    ? (isRent ? commercialTypesForRent : commercialTypesForSale)
    : (isRent ? residentialTypesForRent : residentialTypesForSale);

  function handlePurposeChange(val: string) {
    const nextRent = val === "For Rent" || val === "Paying Guest";
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
    form.propertyType &&
    form.contactPhone;

  function handleNext() {
    setAttemptedNext(true);
    if (canContinue) {
      navigate("/add-property/more-info");
    } else {
      setTimeout(() => {
        const firstError = document.querySelector(".border-rose-500");
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }

  // Slice types based on the "+ more" toggle
  const visibleTypes = showAllTypes ? activeTypes : activeTypes.slice(0, 5);
  const remainingCount = activeTypes.length - visibleTypes.length;

  return (
    <div className="min-h-screen flex flex-col bg-white pb-24 text-left font-display select-none overflow-x-hidden relative">
      {/* Top Blue Progress Bar Line */}
      <div className="w-full h-1 bg-slate-100 flex shrink-0">
        <div className="h-full bg-[#59AD63] w-[33.33%] transition-all duration-300" />
      </div>

      {/* Header Row */}
      <div className="flex justify-between items-center px-6 pt-5 pb-2 shrink-0">
        <button 
          type="button"
          className="text-charcoal p-1.5 -ml-1.5 hover:bg-charcoal/5 rounded-full transition-all duration-200 cursor-pointer active:scale-95"
          aria-label="Menu"
        >
          <Menu size={22} className="text-[#091F40]" />
        </button>
        <a 
          href={whatsappLink} 
          target="_blank" 
          rel="noreferrer" 
          className="flex items-center gap-1 text-[11.5px] font-bold text-[#59AD63] hover:underline"
        >
          <span>Post Via WhatsApp</span>
          <svg className="w-4 h-4 text-[#25D366] fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.516.002 10.003-4.484 10.006-9.998.002-2.673-1.039-5.187-2.932-7.082C16.43 1.63 13.918.585 11.244.585 5.729.585 1.24 5.07 1.238 10.586c-.001 1.516.398 2.998 1.157 4.312L1.336 21.05l6.311-1.657-.001-.239zM18.06 14.86c-.329-.165-1.953-.965-2.253-1.074-.3-.109-.519-.165-.738.165-.219.329-.848 1.074-1.039 1.293-.19.219-.382.246-.71.082-1.393-.697-2.316-1.229-3.232-2.81-.242-.415.242-.385.693-1.284.076-.153.038-.287-.019-.396-.057-.109-.519-1.25-.71-1.71-.186-.447-.376-.386-.519-.393-.134-.007-.288-.008-.442-.008-.154 0-.404.058-.616.287-.211.23-.807.788-.807 1.921 0 1.134.826 2.23.94 2.385.115.155 1.625 2.483 3.937 3.48.55.237 1.03.396 1.385.508.558.177 1.066.152 1.468.092.448-.067 1.953-.799 2.228-1.573.275-.774.275-1.439.192-1.573-.082-.134-.3-.213-.629-.379z"/>
          </svg>
        </a>
      </div>

      <div className="px-6 flex flex-col gap-6 mt-1 flex-1">
        {/* Title & Subtitle */}
        <div className="flex flex-col">
          <h1 className="font-display font-extrabold text-[18px] text-[#091F40] leading-tight">
            Add Basic Details
          </h1>
          <p className="text-[10px] font-bold text-slate/60 tracking-wider uppercase mt-1 leading-none">
            Step 1 of 3
          </p>
        </div>

        {/* Section 1: Purpose Selection */}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-bold text-[#091F40]">You're looking to?</span>
          <div className="flex flex-wrap gap-2.5">
            {[
              { label: "Sell", value: "For Sale" },
              { label: "Rent / Lease", value: "For Rent" },
              { label: "Paying Guest", value: "Paying Guest" },
            ].map((opt) => {
              const active = form.purpose === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handlePurposeChange(opt.value)}
                  className={`py-2 px-5 rounded-full border text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 select-none ${
                    active
                      ? "bg-[#59AD63]/10 border-[#59AD63] text-[#59AD63]"
                      : "bg-white border-[#59AD63]/30 text-slate hover:border-slate-400"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Property Category */}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-bold text-[#091F40]">What kind of property?</span>
          <div className="flex flex-wrap gap-2.5">
            {[
              { label: "Residential", value: "Residential" },
              { label: "Commercial", value: "Commercial" },
            ].map((opt) => {
              const active = form.propertyCategory === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleCategoryChange(opt.value)}
                  className={`py-2 px-5 rounded-full border text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 select-none ${
                    active
                      ? "bg-[#59AD63]/10 border-[#59AD63] text-[#59AD63]"
                      : "bg-white border-[#59AD63]/30 text-slate hover:border-slate-400"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Select Property Type */}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-bold text-[#091F40]">Select Property Type</span>
          <div className={`flex flex-wrap gap-2.5 ${attemptedNext && !form.propertyType ? "border border-rose-500 bg-rose-50/5 p-2 rounded-[8px]" : ""}`}>
            {visibleTypes.map((type) => {
              const active = form.propertyType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => update({ propertyType: type })}
                  className={`py-2 px-5 rounded-full border text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 select-none ${
                    active
                      ? "bg-[#59AD63]/10 border-[#59AD63] text-[#59AD63]"
                      : "bg-white border-[#59AD63]/30 text-slate hover:border-slate-400"
                  }`}
                >
                  {type}
                </button>
              );
            })}
            
            {remainingCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAllTypes(true)}
                className="py-2 px-4 text-xs font-bold text-[#59AD63] hover:underline cursor-pointer active:scale-95 select-none"
              >
                + {remainingCount} more
              </button>
            )}
          </div>
        </div>

        {/* Section 4: Contact Details */}
        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-bold text-[#091F40]">Your contact details</span>
          
          <div className={`relative border rounded-[8px] px-4 pt-5 pb-2.5 bg-white flex items-center shadow-sm focus-within:border-[#59AD63] focus-within:ring-1 focus-within:ring-[#59AD63]/30 transition-all duration-150 ${
            attemptedNext && !form.contactPhone ? "border-rose-500 bg-rose-50/5" : "border-[#59AD63]/30"
          }`}>
            {/* Label inside input */}
            <span className="absolute top-1.5 left-4 text-[10px] font-semibold text-slate/60 select-none">
              Phone number / User name / E-mail
            </span>
            
            {/* Flag dropdown (mock) */}
            <div className="flex items-center gap-1 border-r border-slate-200 pr-3 mr-3 select-none cursor-pointer">
              <span className="text-[13.5px] font-bold text-charcoal">+91</span>
              <ChevronDown size={14} className="text-slate/60" />
            </div>
            
            {/* Text Input */}
            <input
              type="text"
              placeholder="7012021221"
              value={form.contactPhone || ""}
              onChange={(e) => update({ contactPhone: e.target.value })}
              className="flex-1 text-[13.5px] font-bold text-charcoal placeholder:text-slate/30 outline-none bg-transparent"
            />
            
            {/* Lock Icon */}
            <Lock size={16} className="text-[#091F40] ml-2 shrink-0" />
          </div>
          
        </div>

        {/* Next Action Button */}
        <div className="mt-4 pb-4">
          <button
            onClick={handleNext}
            className="w-full py-4 rounded-[2px] font-display font-bold text-[14px] text-white bg-[#59AD63] hover:bg-[#3F8F4B] transition-all duration-200 cursor-pointer active:scale-98 shadow-sm shadow-[#59AD63]/10 flex items-center justify-center"
          >
            Next
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
