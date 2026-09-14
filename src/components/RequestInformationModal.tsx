import { useState, useEffect } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { submitServiceEnquiry } from "@/lib/api";

interface RequestInformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName?: string;
  defaultClass?: string;
}

const CITY_OPTIONS = [
  "Select",
  "Kochi",
  "Trivandrum",
  "Kozhikode",
  "Thrissur",
  "Kannur",
  "Kottayam",
  "Palakkad",
  "Alappuzha",
  "Kollam",
  "Malappuram",
  "Wayanad",
  "Idukki",
  "Kasaragod",
  "Pathanamthitta",
  "Bangalore",
  "Chennai",
  "Mumbai",
  "Delhi",
  "Other"
];

const CLASS_OPTIONS = ["Owner", "Dealer", "Builder"];

export default function RequestInformationModal({
  isOpen,
  onClose,
  serviceName = "General Service",
  defaultClass = "Owner"
}: RequestInformationModalProps) {
  const { user } = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Select");
  const [userClass, setUserClass] = useState(defaultClass);
  const [phone, setPhone] = useState("");
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-fill logged in user details whenever modal opens or user state updates
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setName(user.name || "");
        setEmail(user.email || "");
        
        // Clean phone number if present
        if (user.phone) {
          const cleanedPhone = user.phone.replace(/^\+91\s*/, "").trim();
          setPhone(cleanedPhone);
        } else {
          setPhone("");
        }

        // Match location to city options if possible
        if (user.location) {
          const matchedCity = CITY_OPTIONS.find(
            (c) => c.toLowerCase() === user.location?.toLowerCase()
          );
          setCity(matchedCity || "Select");
        } else {
          setCity("Select");
        }

        // Match user role to class options if possible
        if (user.role) {
          const matchedRole = CLASS_OPTIONS.find(
            (c) => c.toLowerCase() === user.role?.toLowerCase()
          );
          if (matchedRole) setUserClass(matchedRole);
          else setUserClass(defaultClass || "Owner");
        } else {
          setUserClass(defaultClass || "Owner");
        }
      } else {
        setName("");
        setEmail("");
        setCity("Select");
        setUserClass(defaultClass || "Owner");
        setPhone("");
      }

      setErrors({});
      setIsSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen, user, defaultClass]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim()) errs.email = "Email id is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Invalid email format";

    if (!city || city === "Select") errs.city = "Current city is required";
    if (!userClass) errs.userClass = "Class is required";
    if (!phone.trim()) errs.phone = "Mobile no. is required";
    else if (!/^\d{10}$/.test(phone.trim().replace(/\D/g, ""))) {
      errs.phone = "Mobile no. must be 10 digits";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await submitServiceEnquiry({
        userId: user?.id || null,
        name: name.trim(),
        email: email.trim(),
        city,
        userClass,
        phone: phone.trim(),
        serviceName,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrors({ submit: err.message || "Failed to submit enquiry request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Modal Card matching media_1789386738097.png */}
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 sm:p-8 z-10 animate-in zoom-in-95 duration-200">
        {/* Top Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition cursor-pointer p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight font-display">
            REQUEST INFORMATION
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Request a callback to know more about our services
          </p>
        </div>

        {isSuccess ? (
          <div className="py-10 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 font-display">Request Submitted!</h3>
            <p className="text-xs text-gray-600 font-medium max-w-xs">
              Thank you {name ? `, ${name}` : ""}. Our representative will contact you back shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-xs font-semibold">
                {errors.submit}
              </div>
            )}

            {/* 1. Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">
                Name: <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full border-b border-gray-300 py-1.5 px-0 text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500 transition-colors bg-transparent"
              />
              {errors.name && (
                <p className="text-[11px] font-semibold text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            {/* 2. Email Id */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">
                Email Id: <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full border-b border-gray-300 py-1.5 px-0 text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500 transition-colors bg-transparent"
              />
              {errors.email && (
                <p className="text-[11px] font-semibold text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* 3. Current City */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">
                Current City <span className="text-red-500">*</span>
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border-b border-gray-300 py-1.5 px-0 text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500 transition-colors bg-transparent cursor-pointer"
              >
                {CITY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.city && (
                <p className="text-[11px] font-semibold text-red-600 mt-1">{errors.city}</p>
              )}
            </div>

            {/* 4. Class */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">
                Class<span className="text-red-500">*</span>
              </label>
              <select
                value={userClass}
                onChange={(e) => setUserClass(e.target.value)}
                className="w-full border-b border-gray-300 py-1.5 px-0 text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500 transition-colors bg-transparent cursor-pointer"
              >
                {CLASS_OPTIONS.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
              {errors.userClass && (
                <p className="text-[11px] font-semibold text-red-600 mt-1">{errors.userClass}</p>
              )}
            </div>

            {/* 5. Mobile No */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">
                Mobile No: <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <select
                  disabled
                  className="w-28 border-b border-gray-300 py-1.5 px-0 text-sm font-bold text-gray-800 bg-transparent cursor-not-allowed"
                >
                  <option>+91 IND</option>
                </select>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 10-digit number"
                  className="flex-1 border-b border-gray-300 py-1.5 px-0 text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500 transition-colors bg-transparent"
                />
              </div>
              {errors.phone && (
                <p className="text-[12px] font-bold text-red-600 mt-1.5">{errors.phone}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-2.5 bg-[#3498db] hover:bg-[#2885c7] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-md shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>SEND REQUEST</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
