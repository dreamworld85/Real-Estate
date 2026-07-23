import { useState, useEffect } from "react";
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
import { mediaUrl } from "@/lib/api";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<"menu" | "site">("menu");
  const [selectedSetting, setSelectedSetting] = useState<"welcome_banner_url" | "login_banner_url">("welcome_banner_url");
  const [currentBanner, setCurrentBanner] = useState("/kerala_house_banner.jpg");
  const [currentLoginBanner, setCurrentLoginBanner] = useState("/kerala_house_login.jpg");
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
        { key: "site", label: "Site Settings", desc: "Configure welcome banner, login image, logos", icon: Sliders, color: "text-blue-600 bg-blue-50" },
        { key: "email", label: "Email Settings", desc: "SMTP, notification preferences", icon: Mail, color: "text-sky-600 bg-sky-50" },
        { key: "sms", label: "SMS Settings", desc: "OTP gateways, verification", icon: MessageSquare, color: "text-purple-600 bg-purple-50" },
        { key: "payment", label: "Payment Settings", desc: "Gateway configurations", icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
      ],
    },
    {
      title: "User & Access Controls",
      items: [
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

  if (activeTab === "site") {
    return (
      <div className="px-4 py-5 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setActiveTab("menu");
              setSelectedFile(null);
              setPreviewUrl(null);
            }}
            className="p-1 hover:bg-slate-100 rounded-full transition-all text-slate"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="font-display font-extrabold text-xl text-black">Site Settings</h2>
            <p className="text-xs text-slate mt-0.5">Customize website graphics and settings.</p>
          </div>
        </div>

        <div className="bg-white border border-charcoal/5 rounded-3xl p-5 shadow-sm flex flex-col gap-5">
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
                className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${selectedSetting === "welcome_banner_url" ? "bg-white text-ink shadow-sm" : "text-slate hover:text-ink"}`}
              >
                Homepage Banner
              </button>
              <button 
                onClick={() => {
                  setSelectedSetting("login_banner_url");
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${selectedSetting === "login_banner_url" ? "bg-white text-ink shadow-sm" : "text-slate hover:text-ink"}`}
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
                  <span className="text-[9px] font-bold text-gold uppercase tracking-widest">Preview: Homepage Banner</span>
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
                  <span className="text-[9px] font-bold text-gold uppercase tracking-widest">Preview: Login Banner</span>
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
              className="w-full mt-5 py-3.5 bg-ink text-cream hover:bg-black rounded-2xl text-xs font-bold font-display shadow-md transition-all active:scale-[0.98] disabled:bg-slate/30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Upload size={14} />
              <span>{saving ? "Saving..." : "Update Image Asset"}</span>
            </button>
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

      <div className="flex flex-col gap-5">
        {sections.map((sec) => (
          <div key={sec.title} className="flex flex-col gap-2.5">
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider pl-1">
              {sec.title}
            </span>
            <div className="bg-white border border-charcoal/5 rounded-3xl p-3 flex flex-col shadow-sm">
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.key === "site") {
                        setActiveTab("site");
                      } else {
                        alert(`${item.label} configurations loaded successfully.`);
                      }
                    }}
                    className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-2xl transition-all border-b border-charcoal/4 last:border-0 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2.5 rounded-xl shrink-0 ${item.color}`}>
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-ink block">{item.label}</span>
                        <span className="text-[10px] text-slate mt-0.5 block truncate">
                          {item.desc}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate/30 shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
