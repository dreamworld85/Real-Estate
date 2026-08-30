import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Flag, 
  MoreHorizontal, 
  Bell, 
  LogOut, 
  TrendingUp, 
  FileClock, 
  Settings, 
  X,
  ChevronLeft,
  ShieldCheck,
  CreditCard,
  User,
  Sliders
} from "lucide-react";
import { adminApi, AdminUser } from "@/lib/adminApi";

export default function AdminLayout() {
  const token = localStorage.getItem("kerala_realty_admin_token");
  const location = useLocation();
  const navigate = useNavigate();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  async function fetchNotifications() {
    setLoadingNotifications(true);
    try {
      const data = await adminApi.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load admin notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  const toggleNotifications = () => {
    const nextVal = !showNotifications;
    setShowNotifications(nextVal);
    if (nextVal) {
      fetchNotifications();
    }
  };

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  const currentPath = location.pathname;

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Users", path: "/admin/users", icon: Users },
    { label: "Properties", path: "/admin/properties", icon: Building2 },
    { label: "Reports", path: "/admin/reports", icon: Flag },
  ];

  function handleLogout() {
    localStorage.removeItem("kerala_realty_admin_token");
    navigate("/admin/login");
  }

  const isDetailsPage = currentPath !== "/admin";
  let pageTitle = "Admin Panel";
  if (currentPath === "/admin") pageTitle = "Admin Dashboard";
  else if (currentPath === "/admin/users") pageTitle = "Users";
  else if (currentPath.startsWith("/admin/users/")) pageTitle = "User Details";
  else if (currentPath === "/admin/properties") pageTitle = "Properties";
  else if (currentPath.startsWith("/admin/properties/")) pageTitle = "Property Details";
  else if (currentPath === "/admin/reports") pageTitle = "Reported Listings";
  else if (currentPath === "/admin/analytics") pageTitle = "Analytics";
  else if (currentPath === "/admin/logs") pageTitle = "Activity Logs";
  else if (currentPath === "/admin/settings") pageTitle = "Settings";
  else if (currentPath === "/admin/role-upgrades") pageTitle = "Role Upgrades";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      {/* Sidebar Navigation - Desktop only */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-charcoal/5 h-screen sticky top-0 z-30 shrink-0">
        {/* Sidebar Brand/Header */}
        <div className="p-5 border-b border-charcoal/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-display font-extrabold text-sm shadow-md">
            SP
          </div>
          <div>
            <h2 className="font-display font-extrabold text-sm text-black leading-tight">Sparrows Property Admin</h2>
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block mt-0.5">Admin Workspace</span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5">
          <span className="text-[9px] font-bold text-slate/50 uppercase tracking-wider px-3 mb-2 block">Menu Options</span>
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  isActive 
                    ? "bg-emerald-50 text-emerald-700 shadow-sm" 
                    : "text-slate hover:bg-slate-50 hover:text-black"
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <span className="text-[9px] font-bold text-slate/50 uppercase tracking-wider px-3 mt-5 mb-2 block">System Settings</span>
          <Link
            to="/admin/role-upgrades"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              currentPath === "/admin/role-upgrades"
                ? "bg-emerald-50 text-emerald-700 shadow-sm"
                : "text-slate hover:bg-slate-50 hover:text-black"
            }`}
          >
            <ShieldCheck size={16} />
            <span>Role Upgrades</span>
          </Link>
          <Link
            to="/admin/subscriptions"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              currentPath === "/admin/subscriptions"
                ? "bg-emerald-50 text-emerald-700 shadow-sm"
                : "text-slate hover:bg-slate-50 hover:text-black"
            }`}
          >
            <CreditCard size={16} />
            <span>Pricing Settings</span>
          </Link>
          <Link
            to="/admin/settings?tab=profile"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              currentPath === "/admin/settings" && new URLSearchParams(location.search).get("tab") === "profile"
                ? "bg-emerald-50 text-emerald-700 shadow-sm"
                : "text-slate hover:bg-slate-50 hover:text-black"
            }`}
          >
            <User size={16} />
            <span>Admin Profile</span>
          </Link>
          <Link
            to="/admin/settings?tab=site"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              currentPath === "/admin/settings" && (new URLSearchParams(location.search).get("tab") === "site" || !new URLSearchParams(location.search).get("tab"))
                ? "bg-emerald-50 text-emerald-700 shadow-sm"
                : "text-slate hover:bg-slate-50 hover:text-black"
            }`}
          >
            <Settings size={16} />
            <span>Site Settings</span>
          </Link>
          <Link
            to="/admin/settings?tab=trials"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              currentPath === "/admin/settings" && new URLSearchParams(location.search).get("tab") === "trials"
                ? "bg-emerald-50 text-emerald-700 shadow-sm"
                : "text-slate hover:bg-slate-50 hover:text-black"
            }`}
          >
            <Sliders size={16} />
            <span>Trial Settings</span>
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-charcoal/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all active:scale-[0.99] cursor-pointer"
          >
            <LogOut size={14} />
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* Main Work Area (Right Side on Desktop) */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header - Full width on desktop */}
        <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-charcoal/5 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2.5">
            {isDetailsPage && (
              <button 
                onClick={() => navigate(-1)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                aria-label="Go back"
              >
                <ChevronLeft size={20} className="text-black" />
              </button>
            )}
            <span className="font-display font-extrabold text-sm md:text-base text-black">{pageTitle}</span>
          </div>

          <div className="flex items-center gap-3 relative">
            <button 
              onClick={toggleNotifications}
              className="relative p-2 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
            >
              <Bell size={18} className="text-charcoal" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-coral animate-ping" />
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shadow-inner">
              AD
            </div>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-3xl border border-charcoal/10 shadow-2xl p-4 z-50 flex flex-col gap-3 animate-fade-in">
                <div className="flex justify-between items-center border-b border-charcoal/5 pb-2">
                  <span className="text-xs font-bold text-ink">Administrative Alerts</span>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-[10px] font-bold text-slate hover:text-ink cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto no-scrollbar">
                  {loadingNotifications ? (
                    <p className="text-[11px] text-slate italic py-4 text-center">Loading alerts...</p>
                  ) : notifications.length > 0 ? (
                    notifications.map((item) => {
                      const badgeColor = 
                        item.type === "Registration" ? "bg-blue-50 text-blue-600" :
                        item.type === "Activation" ? "bg-emerald-50 text-emerald-600" :
                        item.type === "Deletion" ? "bg-rose-50 text-rose-600" :
                        "bg-amber-50 text-amber-600";
                      
                      const badgeLetter = item.type.charAt(0);

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setShowNotifications(false);
                            if (item.link) navigate(item.link);
                          }}
                          className={`w-full flex items-start gap-3 p-2 rounded-2xl hover:bg-slate-50 text-left transition-all active:scale-[0.98] ${item.link ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${badgeColor}`}>
                            {badgeLetter}
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-xs font-bold text-ink truncate">{item.title}</span>
                            <span className="text-[10px] text-slate/85 leading-snug">{item.message}</span>
                            <span className="text-[8px] text-slate/50 mt-0.5">{new Date(item.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-[11px] text-slate italic py-4 text-center">No recent alerts.</p>
                  )}
                </div>

                <button 
                  onClick={() => {
                    setShowNotifications(false);
                    navigate("/admin/logs");
                  }}
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 rounded-2xl text-[10px] font-bold text-ink text-center border border-charcoal/5 transition-all mt-1 cursor-pointer"
                >
                  View Activity Audit Logs
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content Outlet Container - Responsive width on desktop */}
        <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom Nav Bar - Mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-charcoal/8 py-2 px-4 flex items-center justify-between z-40 shadow-lg">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive ? "text-emerald-600 scale-105 font-bold" : "text-slate/60 hover:text-slate"
              }`}
            >
              <Icon size={19} />
              <span className="text-[9px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setShowMoreMenu(true)}
          className={`flex flex-col items-center gap-1 transition-all ${
            ["/admin/analytics", "/admin/logs", "/admin/settings", "/admin/subscriptions", "/admin/role-upgrades"].some((p) => currentPath.startsWith(p))
              ? "text-emerald-600 font-bold"
              : "text-slate/60 hover:text-slate"
          }`}
        >
          <MoreHorizontal size={19} />
          <span className="text-[9px] font-semibold">More</span>
        </button>
      </nav>

      {/* More Options Drawer Overlay - Mobile only */}
      {showMoreMenu && (
        <div 
          className="absolute inset-0 bg-black/40 z-50 flex flex-col justify-end"
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            className="bg-white rounded-t-3xl p-5 shadow-2xl animate-slideUp flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-charcoal/6 pb-2.5">
              <span className="font-display font-bold text-sm text-black">Administrative Controls</span>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              >
                <X size={18} className="text-charcoal" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 py-2">
              <Link
                to="/admin/analytics"
                onClick={() => setShowMoreMenu(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-charcoal/5 hover:border-emerald-600/30 transition-all gap-1.5"
              >
                <TrendingUp size={20} className="text-sky-600" />
                <span className="text-[10px] font-bold text-ink">Analytics</span>
              </Link>
              <Link
                to="/admin/logs"
                onClick={() => setShowMoreMenu(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-charcoal/5 hover:border-emerald-600/30 transition-all gap-1.5"
              >
                <FileClock size={20} className="text-purple-600" />
                <span className="text-[10px] font-bold text-ink">Audit Logs</span>
              </Link>
              <Link
                to="/admin/settings"
                onClick={() => setShowMoreMenu(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-charcoal/5 hover:border-emerald-600/30 transition-all gap-1.5"
              >
                <Settings size={20} className="text-amber-600" />
                <span className="text-[10px] font-bold text-ink">Settings</span>
              </Link>
              <Link
                to="/admin/role-upgrades"
                onClick={() => setShowMoreMenu(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-charcoal/5 hover:border-emerald-600/30 transition-all gap-1.5"
              >
                <ShieldCheck size={20} className="text-teal-600" />
                <span className="text-[10px] font-bold text-ink">Upgrades</span>
              </Link>
              <Link
                to="/admin/subscriptions"
                onClick={() => setShowMoreMenu(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-charcoal/5 hover:border-emerald-600/30 transition-all gap-1.5"
              >
                <CreditCard size={20} className="text-emerald-600" />
                <span className="text-[10px] font-bold text-ink">Pricing</span>
              </Link>
            </div>

            <button
              onClick={() => {
                setShowMoreMenu(false);
                handleLogout();
              }}
              className="w-full py-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-[0.99] hover:bg-rose-100 cursor-pointer"
            >
              <LogOut size={16} />
              Logout from Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
