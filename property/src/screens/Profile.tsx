import { useNavigate } from "react-router-dom";
import { User as UserIcon, Home, Heart, MessageSquare, BarChart3, Pencil, Settings, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";

const menuItems = [
  { icon: Home, label: "My Properties", path: "/my-properties" },
  { icon: Heart, label: "Saved Properties", path: "/saved" },
  { icon: MessageSquare, label: "My Enquiries", path: "/visitors-enquiries" },
  { icon: BarChart3, label: "Visitors & Insights", path: "/visitors-enquiries" },
  { icon: Pencil, label: "Edit Profile", path: "/profile/edit" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen pb-28">
      <header className="px-4 pt-6 pb-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-sage flex items-center justify-center">
          <UserIcon size={28} className="text-forest" />
        </div>
        <div>
          <p className="font-display font-bold text-lg text-ink">{user?.name || "Your Name"}</p>
          <p className="text-sm text-slate">{user?.phone || user?.email}</p>
        </div>
      </header>

      <div className="px-4 flex flex-col gap-2">
        {menuItems.map(({ icon: Icon, label, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex items-center justify-between bg-white rounded-2xl shadow-card px-4 py-3.5"
          >
            <span className="flex items-center gap-3 text-charcoal font-medium text-[15px]">
              <Icon size={18} className="text-ink" /> {label}
            </span>
            <ChevronRight size={16} className="text-slate" />
          </button>
        ))}

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="flex items-center gap-3 text-coral font-medium text-[15px] px-4 py-3.5 mt-2"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
