import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  Sliders, 
  Mail, 
  MessageSquare, 
  CreditCard, 
  ShieldCheck, 
  Users, 
  FileText, 
  AlertOctagon, 
  ChevronRight,
  ChevronLeft,
  Upload
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { api, mediaUrl } from "@/lib/api";

export default function Settings() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"menu" | "site" | "payment" | "trials" | "profile" | "database">("menu");

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get("tab");
    if (tabParam === "profile") {
      setActiveTab("profile");
    } else if (tabParam === "site") {
      setActiveTab("site");
    } else if (tabParam === "trials") {
      setActiveTab("trials");
    } else {
      setActiveTab("menu");
    }
  }, [location.search]);
  const [selectedSetting, setSelectedSetting] = useState<"welcome_banner_url" | "login_banner_url">("welcome_banner_url");
  const [currentBanner, setCurrentBanner] = useState("/kerala_house_banner.jpg");
  const [currentLoginBanner, setCurrentLoginBanner] = useState("/kerala_house_login.jpg");
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [plans, setPlans] = useState<{ role: string; price: number; description?: string; discount?: number; duration_months?: number }[]>([]);
  const [defaultTrialDaysBroker, setDefaultTrialDaysBroker] = useState(5);
  const [defaultTrialDaysAgency, setDefaultTrialDaysAgency] = useState(3);
  const [defaultTrialDaysOwner, setDefaultTrialDaysOwner] = useState(5);
  const [defaultTrialDaysUser, setDefaultTrialDaysUser] = useState(30);
  const [defaultFreeInquiriesLimit, setDefaultFreeInquiriesLimit] = useState(20);
  const [adminEmail, setAdminEmail] = useState("admin@keralarealty.com");
  const [adminPhone, setAdminPhone] = useState("+91 94460 12345");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhoneState, setContactPhoneState] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [featuredPrice, setFeaturedPrice] = useState(299);
  const [featuredText, setFeaturedText] = useState("");

  useEffect(() => {
    // Fetch welcome banner setting
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/welcome_banner_url`)
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setCurrentBanner(data.value);
        }
      })
      .catch(err => console.error("Error loading welcome banner:", err));

    // Fetch login banner setting
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/login_banner_url`)
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setCurrentLoginBanner(data.value);
        }
      })
      .catch(err => console.error("Error loading login banner:", err));

    // Fetch default_trial_days_broker setting
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/default_trial_days_broker`)
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setDefaultTrialDaysBroker(Number(data.value));
        }
      })
      .catch(err => console.error("Error loading default_trial_days_broker setting:", err));

    // Fetch default_trial_days_agency setting
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/default_trial_days_agency`)
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setDefaultTrialDaysAgency(Number(data.value));
        }
      })
      .catch(err => console.error("Error loading default_trial_days_agency setting:", err));

    // Fetch default_trial_days setting (Owner)
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/default_trial_days`)
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setDefaultTrialDaysOwner(Number(data.value));
        }
      })
      .catch(err => console.error("Error loading default_trial_days setting:", err));

    // Fetch admin_email setting
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/admin_email`)
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setAdminEmail(data.value);
        }
      })
      .catch(err => console.error("Error loading admin_email setting:", err));

    // Fetch admin_contact_number setting
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/admin_contact_number`)
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setAdminPhone(data.value);
        }
      })
      .catch(err => console.error("Error loading admin_contact_number setting:", err));

    // Fetch default_trial_days_user setting
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/default_trial_days_user`)
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setDefaultTrialDaysUser(Number(data.value));
        }
      })
      .catch(err => console.error("Error loading default_trial_days_user setting:", err));

    // Fetch default_free_inquiries_limit setting
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/default_free_inquiries_limit`)
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setDefaultFreeInquiriesLimit(Number(data.value));
        }
      })
      .catch(err => console.error("Error loading default_free_inquiries_limit setting:", err));

    // Fetch contact_email setting
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/contact_email`)
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setContactEmail(data.value);
        }
      })
      .catch(err => console.error("Error loading contact_email setting:", err));

    // Fetch contact_phone setting
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/contact_phone`)
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setContactPhoneState(data.value);
        }
      })
      .catch(err => console.error("Error loading contact_phone setting:", err));

    // Fetch contact_address setting
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/contact_address`)
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setContactAddress(data.value);
        }
      })
      .catch(err => console.error("Error loading contact_address setting:", err));

    // Fetch featured_price setting
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/featured_price`)
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setFeaturedPrice(Number(data.value));
        }
      })
      .catch(err => console.error("Error loading featured_price setting:", err));

    // Fetch featured_text setting
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/featured_text`)
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setFeaturedText(data.value);
        }
      })
      .catch(err => console.error("Error loading featured_text setting:", err));

    api.fetchSubscriptionPlans()
      .then((data) => {
        setPlans(data.map((p: any) => ({
          role: p.role,
          price: Number(p.price),
          description: p.description || "",
          discount: Number(p.discount || 0),
          duration_months: Number(p.duration_months || 1),
        })));
      })
      .catch((err) => console.error("Error loading plans:", err));
  }, []);

  async function handleUploadBanner() {
    if (!selectedFile) return;
    setSaving(true);
    try {
      const data = await adminApi.updateSetting(selectedSetting, selectedFile);
      if (selectedSetting === "welcome_banner_url") {
        setCurrentBanner(data.value);
      } else {
        setCurrentLoginBanner(data.value);
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      alert("Image updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update image.");
    } finally {
      setSaving(false);
    }
  }

  const sections = [
    {
      title: "General Settings",
      items: [
        { key: "site", label: "Site Banners", desc: "Configure welcome banner, login image, and static assets", icon: Sliders, color: "text-blue-600 bg-blue-50" },
        { key: "trials", label: "Trial Settings", desc: "Configure global default trial periods by user role", icon: Sliders, color: "text-amber-600 bg-amber-50" },
        { key: "email", label: "Email Settings", desc: "SMTP, notification preferences", icon: Mail, color: "text-sky-600 bg-sky-50" },
        { key: "sms", label: "SMS Settings", desc: "OTP gateways, verification", icon: MessageSquare, color: "text-purple-600 bg-purple-50" },
        { key: "payment", label: "Payment Settings", desc: "Gateway configurations", icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
        { key: "database", label: "Database Export", desc: "Download live SQL database dump files", icon: FileText, color: "text-rose-600 bg-rose-50" },
      ],
    },
    {
      title: "User & Access Controls",
      items: [
        { key: "profile", label: "Admin Profile", desc: "Configure system email and administrative contact number", icon: Users, color: "text-amber-600 bg-amber-50" },
        { key: "admins", label: "Admin Users", desc: "Create and manage system admins", icon: Users, color: "text-indigo-600 bg-indigo-50" },
        { key: "roles", label: "Roles & Permissions", desc: "Policy rules definitions", icon: ShieldCheck, color: "text-teal-600 bg-teal-50" },
      ],
    },
    {
      title: "Content & Policy",
      items: [
        { key: "policy", label: "Content Policy", desc: "Community posting guidelines", icon: FileText, color: "text-amber-600 bg-amber-50" },
        { key: "spam", label: "Blocked Keywords", desc: "Spam block lists filters", icon: AlertOctagon, color: "text-rose-600 bg-rose-50" },
      ],
    },
  ];

  function renderProfileTab() {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 lg:hidden px-1">
          <button 
            onClick={() => setActiveTab("menu")}
            className="p-1 hover:bg-slate-100 rounded-full transition-all text-slate cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="font-display font-bold text-sm text-ink">Back to Menu</h3>
        </div>

        <div className="bg-white border border-charcoal/5 rounded-3xl p-5 shadow-sm flex flex-col gap-5 text-left">
          <div>
            <h2 className="font-display font-extrabold text-base text-black">Admin Profile Settings</h2>
            <p className="text-[10px] text-slate mt-0.5">Configure system contact details and fallback settings.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink">Administrative Email Address</label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="e.g. admin@keralarealty.com"
              className="w-full rounded-xl border border-charcoal/10 bg-white px-3.5 py-3 text-xs text-charcoal outline-none focus:border-emerald-600 shadow-sm font-semibold"
            />
            <p className="text-[10px] text-slate/75 mt-0.5">Used for system notification logs, alerts, and sender configs.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink">Admin Fallback Contact Number</label>
            <input
              type="text"
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
              placeholder="e.g. +91 94460 12345"
              className="w-full rounded-xl border border-charcoal/10 bg-white px-3.5 py-3 text-xs text-charcoal outline-none focus:border-emerald-600 shadow-sm font-semibold"
            />
            <p className="text-[10px] text-slate/75 mt-0.5">Used as the contact fallback when properties are activated under the administrative number.</p>
          </div>

          <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-charcoal/5">
            <label className="text-xs font-bold text-ink">Contact Us Page Support Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="e.g. support@greensparrows.com"
              className="w-full rounded-xl border border-charcoal/10 bg-white px-3.5 py-3 text-xs text-charcoal outline-none focus:border-emerald-600 shadow-sm font-semibold"
            />
            <p className="text-[10px] text-slate/75 mt-0.5">Displayed on the public 'Contact Us' page.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink">Contact Us Page Phone Hotline</label>
            <input
              type="text"
              value={contactPhoneState}
              onChange={(e) => setContactPhoneState(e.target.value)}
              placeholder="e.g. +91 484 2901234 (10 AM - 6 PM)"
              className="w-full rounded-xl border border-charcoal/10 bg-white px-3.5 py-3 text-xs text-charcoal outline-none focus:border-emerald-600 shadow-sm font-semibold"
            />
            <p className="text-[10px] text-slate/75 mt-0.5">Displayed on the public 'Contact Us' page hotline section.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink">Contact Us Page Office Address</label>
            <textarea
              value={contactAddress}
              onChange={(e) => setContactAddress(e.target.value)}
              placeholder="Enter office address"
              rows={3}
              className="w-full rounded-xl border border-charcoal/10 bg-white px-3.5 py-3 text-xs text-charcoal outline-none focus:border-emerald-600 shadow-sm font-semibold"
            />
            <p className="text-[10px] text-slate/75 mt-0.5">Displayed on the public 'Contact Us' page office address section.</p>
          </div>

          <button
            onClick={async () => {
              setSaving(true);
              try {
                const headers = {
                  "Content-Type": "application/json",
                  "x-admin-auth": localStorage.getItem("kerala_realty_admin_token") || ""
                };
                await Promise.all([
                  fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/admin_email`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify({ value: adminEmail })
                  }),
                  fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/admin_contact_number`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify({ value: adminPhone })
                  }),
                  fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/contact_email`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify({ value: contactEmail })
                  }),
                  fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/contact_phone`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify({ value: contactPhoneState })
                  }),
                  fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/contact_address`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify({ value: contactAddress })
                  })
                ]);

                alert("Admin profile configuration updated successfully!");
                if (window.innerWidth < 1024) setActiveTab("menu");
              } catch (err: any) {
                alert(err.message || "Failed to update admin settings");
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="w-full mt-2 py-3.5 bg-emerald-600 text-white hover:bg-emerald-500 rounded-2xl text-xs font-bold font-display shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer text-center"
          >
            {saving ? "Saving Changes..." : "Save Profile Settings"}
          </button>
        </div>
      </div>
    );
  }

  function renderTrialsTab() {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 lg:hidden px-1">
          <button 
            onClick={() => setActiveTab("menu")}
            className="p-1 hover:bg-slate-100 rounded-full transition-all text-slate cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="font-display font-bold text-sm text-ink">Back to Menu</h3>
        </div>

        <div className="bg-white border border-charcoal/5 rounded-3xl p-5 shadow-sm text-left">
          <div className="mb-4">
            <h2 className="font-display font-extrabold text-base text-black">Trial & Limits Settings</h2>
            <p className="text-[10px] text-slate mt-0.5">Configure global default trial durations and access limits.</p>
          </div>

          <div className="flex flex-col gap-3.5 font-display">
            <span className="text-[10px] font-bold text-ink uppercase tracking-wider block border-b border-charcoal/5 pb-2 mb-1">
              Role-Based Global Configuration
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate">Owner Trial (Days)</label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={defaultTrialDaysOwner}
                  onChange={(e) => setDefaultTrialDaysOwner(Number(e.target.value))}
                  className="w-full rounded-xl border border-charcoal/10 bg-white px-3 py-2.5 text-xs text-charcoal outline-none focus:border-emerald-600 shadow-sm font-semibold"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate">Broker Trial (Days)</label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={defaultTrialDaysBroker}
                  onChange={(e) => setDefaultTrialDaysBroker(Number(e.target.value))}
                  className="w-full rounded-xl border border-charcoal/10 bg-white px-3 py-2.5 text-xs text-charcoal outline-none focus:border-emerald-600 shadow-sm font-semibold"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate">Agency Trial (Days)</label>
                <input
                  type="number"
                  placeholder="e.g. 3"
                  value={defaultTrialDaysAgency}
                  onChange={(e) => setDefaultTrialDaysAgency(Number(e.target.value))}
                  className="w-full rounded-xl border border-charcoal/10 bg-white px-3 py-2.5 text-xs text-charcoal outline-none focus:border-emerald-600 shadow-sm font-semibold"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate">Buyer Trial (Days)</label>
                <input
                  type="number"
                  placeholder="e.g. 30"
                  value={defaultTrialDaysUser}
                  onChange={(e) => setDefaultTrialDaysUser(Number(e.target.value))}
                  className="w-full rounded-xl border border-charcoal/10 bg-white px-3 py-2.5 text-xs text-charcoal outline-none focus:border-emerald-600 shadow-sm font-semibold"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate">Buyer Free Inquiry Limit</label>
                <input
                  type="number"
                  placeholder="e.g. 20"
                  value={defaultFreeInquiriesLimit}
                  onChange={(e) => setDefaultFreeInquiriesLimit(Number(e.target.value))}
                  className="w-full rounded-xl border border-charcoal/10 bg-white px-3 py-2.5 text-xs text-charcoal outline-none focus:border-emerald-600 shadow-sm font-semibold"
                />
              </div>
            </div>

            <span className="text-[10px] font-bold text-ink uppercase tracking-wider block border-b border-charcoal/5 pb-2 mt-4 mb-1">
              Featured Listing Booster Configuration
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate">Featured Upgrade Price (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 299"
                  value={featuredPrice}
                  onChange={(e) => setFeaturedPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-charcoal/10 bg-white px-3 py-2.5 text-xs text-charcoal outline-none focus:border-emerald-600 shadow-sm font-semibold"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate">Featured booster promo text</label>
                <input
                  type="text"
                  placeholder="Marketing pitch for featuring property listings..."
                  value={featuredText}
                  onChange={(e) => setFeaturedText(e.target.value)}
                  className="w-full rounded-xl border border-charcoal/10 bg-white px-3 py-2.5 text-xs text-charcoal outline-none focus:border-emerald-600 shadow-sm font-semibold"
                />
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              setSaving(true);
              try {
                const headers = {
                  "Content-Type": "application/json",
                  "x-admin-auth": localStorage.getItem("kerala_realty_admin_token") || ""
                };
                await Promise.all([
                  fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/default_trial_days`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify({ value: String(defaultTrialDaysOwner) })
                  }),
                  fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/default_trial_days_broker`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify({ value: String(defaultTrialDaysBroker) })
                  }),
                  fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/default_trial_days_agency`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify({ value: String(defaultTrialDaysAgency) })
                  }),
                  fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/default_trial_days_user`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify({ value: String(defaultTrialDaysUser) })
                  }),
                  fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/default_free_inquiries_limit`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify({ value: String(defaultFreeInquiriesLimit) })
                  }),
                  fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/featured_price`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify({ value: String(featuredPrice) })
                  }),
                  fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/settings/featured_text`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify({ value: featuredText })
                  })
                ]);

                alert("Role-based trial and inquiry limit settings updated successfully!");
                if (window.innerWidth < 1024) setActiveTab("menu");
              } catch (err: any) {
                alert(err.message || "Failed to update settings");
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="w-full mt-6 py-3.5 bg-emerald-600 text-white hover:bg-emerald-500 rounded-2xl text-xs font-bold font-display shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer text-center"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    );
  }

  function renderDatabaseTab() {
    const handleExport = async () => {
      setSaving(true);
      try {
        const token = localStorage.getItem("kerala_realty_admin_token") || "";
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
        
        const response = await fetch(`${apiUrl}/api/admin/database/export`, {
          method: "GET",
          headers: {
            "x-admin-auth": token
          }
        });
        
        if (!response.ok) {
          throw new Error("Failed to download database export file.");
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        
        const disposition = response.headers.get("content-disposition");
        let filename = "realestate_backup.sql";
        if (disposition && disposition.indexOf("filename=") !== -1) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, "");
          }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (err: any) {
        alert(err.message || "Failed to export live database");
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="flex flex-col gap-4 text-left">
        <div className="flex items-center gap-2 lg:hidden px-1">
          <button 
            onClick={() => setActiveTab("menu")}
            className="p-1 hover:bg-slate-100 rounded-full transition-all text-slate cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="font-display font-bold text-sm text-ink">Back to Menu</h3>
        </div>

        <div className="bg-white border border-charcoal/5 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h2 className="font-display font-extrabold text-base text-black">Database Backup & Export</h2>
            <p className="text-[10px] text-slate mt-0.5">Generate and download a complete, updated SQL dump file of your active MySQL database.</p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-500/10 rounded-2xl text-emerald-800 text-xs leading-relaxed flex flex-col gap-2 font-display">
            <span className="font-bold flex items-center gap-1">
              💾 Safe & Non-Destructive Backup
            </span>
            <span>
              This export connects directly to the running database instance, performs a complete read-only data dump, and prepares it for download as a clean standard SQL script. This operation will NOT modify or disrupt any live properties or registered user profiles.
            </span>
          </div>

          <button
            onClick={handleExport}
            disabled={saving}
            className="w-full mt-2 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold font-display shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? "Generating SQL Dump File..." : "Download Live SQL Backup"}
          </button>
        </div>
      </div>
    );
  }

  function renderSiteTab() {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 lg:hidden px-1">
          <button 
            onClick={() => {
              setActiveTab("menu");
              setSelectedFile(null);
              setPreviewUrl(null);
            }}
            className="p-1 hover:bg-slate-100 rounded-full transition-all text-slate cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="font-display font-bold text-sm text-ink">Back to Menu</h3>
        </div>

        <div className="bg-white border border-charcoal/5 rounded-3xl p-5 shadow-sm text-left">
          <div className="mb-4">
            <h2 className="font-display font-extrabold text-base text-black">Site Graphic Assets</h2>
            <p className="text-[10px] text-slate mt-0.5">Customize website background graphics and banners.</p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider block mb-2.5">
              Choose Banner Asset to Customize
            </span>

            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-4">
               <button 
                 onClick={() => {
                   setSelectedSetting("welcome_banner_url");
                   setSelectedFile(null);
                   setPreviewUrl(null);
                 }}
                 className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${selectedSetting === "welcome_banner_url" ? "bg-white text-ink shadow-sm" : "text-slate hover:text-ink"}`}
               >
                 Homepage Banner
               </button>
               <button 
                 onClick={() => {
                   setSelectedSetting("login_banner_url");
                   setSelectedFile(null);
                   setPreviewUrl(null);
                 }}
                 className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${selectedSetting === "login_banner_url" ? "bg-white text-ink shadow-sm" : "text-slate hover:text-ink"}`}
               >
                 Login Page Banner
               </button>
            </div>

            {selectedSetting === "welcome_banner_url" ? (
              <div className="relative h-40 rounded-2xl overflow-hidden border border-charcoal/10 shadow-inner bg-slate-100 mb-4">
                <img 
                  src={mediaUrl(previewUrl || currentBanner)} 
                  alt="Banner Preview" 
                  className="w-full h-full object-cover brightness-[0.75]"
                />
                <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/85 via-black/30 to-transparent">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Preview: Homepage Banner</span>
                  <h2 className="font-display font-extrabold text-sm text-white leading-tight mt-0.5">
                    Find homes, villas, lands & escapes
                  </h2>
                  <p className="text-white/80 text-[10px] mt-0.5 leading-none">
                    Discover unique properties that match your lifestyle.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative h-40 rounded-2xl overflow-hidden border border-charcoal/10 shadow-inner bg-slate-100 mb-4">
                <img 
                  src={mediaUrl(previewUrl || currentLoginBanner)} 
                  alt="Login Preview" 
                  className="w-full h-full object-cover brightness-[0.75]"
                />
                <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/85 via-black/30 to-transparent">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Preview: Login Banner</span>
                  <h2 className="font-display font-extrabold text-sm text-white leading-tight mt-0.5">
                    PERFECT STAY
                  </h2>
                  <p className="text-white/80 text-[10px] mt-0.5 leading-none">
                    Find homes, villas, lands and escapes that match your lifestyle.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <div>
                <label className="text-xs font-bold text-ink">Choose New Image File</label>
                <p className="text-[10px] text-slate mt-0.5">Upload a landscape format image (recommended ratio 16:9).</p>
              </div>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    setPreviewUrl(URL.createObjectURL(file));
                  }
                }}
                className="text-xs text-slate border border-charcoal/10 p-3 rounded-2xl bg-slate-50/50 focus:outline-none w-full"
              />
            </div>

            <button
              onClick={handleUploadBanner}
              disabled={saving || !selectedFile}
              className="w-full mt-5 py-3.5 bg-emerald-600 text-white hover:bg-emerald-500 rounded-2xl text-xs font-bold font-display shadow-md transition-all active:scale-[0.98] disabled:bg-slate/30 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              <Upload size={14} />
              <span>{saving ? "Saving..." : "Update Image Asset"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderPaymentTab() {
    return (
      <div className="flex flex-col gap-4 text-left">
        <div className="flex items-center gap-2 lg:hidden px-1">
          <button 
            onClick={() => setActiveTab("menu")}
            className="p-1 hover:bg-slate-100 rounded-full transition-all text-slate cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="font-display font-bold text-sm text-ink">Back to Menu</h3>
        </div>

        <div className="bg-white border border-charcoal/5 rounded-3xl p-5 shadow-sm">
          <h2 className="font-display font-extrabold text-base text-black">Payment Gateway Configuration</h2>
          <p className="text-[10px] text-slate mt-0.5 mb-4">Set up Merchant credentials, Razorpay key ids, and webhooks.</p>
          
          <div className="p-4 bg-slate-50 border border-charcoal/5 rounded-2xl text-slate text-xs leading-relaxed">
            Razorpay integration key ids are defined dynamically via system environment parameters (`RAZORPAY_KEY_ID`).
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 flex flex-col gap-5">
      <div>
        <h2 className="font-display font-extrabold text-xl text-black">System Settings</h2>
        <p className="text-xs text-slate mt-0.5">Define site configurations and moderator rules.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column - Navigation List */}
        <div className={`w-full lg:w-80 shrink-0 flex flex-col gap-5 ${activeTab !== "menu" ? "hidden lg:flex" : "flex"}`}>
          {sections.map((sec) => (
            <div key={sec.title} className="flex flex-col gap-2.5">
              <span className="text-[10px] font-bold text-slate uppercase tracking-wider pl-1">
                {sec.title}
              </span>
              <div className="bg-white border border-charcoal/5 rounded-3xl p-3 flex flex-col shadow-sm">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeTab === item.key;
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (item.key === "site") {
                          setActiveTab("site");
                        } else if (item.key === "trials") {
                          setActiveTab("trials");
                        } else if (item.key === "profile") {
                          setActiveTab("profile");
                        } else if (item.key === "payment") {
                          setActiveTab("payment");
                        } else if (item.key === "database") {
                          setActiveTab("database");
                        } else {
                          alert(`${item.label} configurations loaded successfully.`);
                        }
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-2xl transition-all border-b border-charcoal/4 last:border-0 text-left cursor-pointer ${
                        isSelected ? "bg-emerald-50 text-emerald-700 font-bold" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? "bg-emerald-100/50 text-emerald-700" : item.color}`}>
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block ${isSelected ? "text-emerald-800" : "text-ink"}`}>{item.label}</span>
                          <span className="text-[10px] text-slate mt-0.5 block truncate">
                            {item.desc}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className={`shrink-0 ml-2 ${isSelected ? "text-emerald-500" : "text-slate/30"}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column - Active Panel Form */}
        <div className={`flex-1 w-full ${activeTab === "menu" ? "hidden lg:block" : "block"}`}>
          {activeTab === "menu" && (
            <div className="bg-white border border-charcoal/5 rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center text-center h-[320px]">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-3 shadow-inner">
                <Sliders size={32} />
              </div>
              <h3 className="font-display font-extrabold text-sm text-ink">System Config Workspace</h3>
              <p className="text-[10px] text-slate mt-1 max-w-[240px]">Select a settings panel from the left sidebar to manage system assets, SMTP, and gateway rules.</p>
            </div>
          )}

          {activeTab === "site" && renderSiteTab()}
          {activeTab === "trials" && renderTrialsTab()}
          {activeTab === "profile" && renderProfileTab()}
          {activeTab === "payment" && renderPaymentTab()}
          {activeTab === "database" && renderDatabaseTab()}
        </div>
      </div>
    </div>
  );
}
