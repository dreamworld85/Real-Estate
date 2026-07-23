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
  ChevronLeft
} from "lucide-react";
import { adminApi, AdminUser } from "@/lib/adminApi";

export default function AdminLayout() {
  const token = localStorage.getItem("kerala_realty_admin_token");
  const location = useLocation();
  const navigate = useNavigate();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastUsers, setLastUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  async function fetchLastUsers() {
    setLoadingUsers(true);
    try {
      const data = await adminApi.getUsers("", "All");
      setLastUsers(data.slice(0, 5));
    } catch (err) {
      console.error("Failed to load last users for notifications:", err);
    } finally {
      setLoadingUsers(false);
    }
  }

  const toggleNotifications = () => {
    const nextVal = !showNotifications;
    setShowNotifications(nextVal);
    if (nextVal) {
      fetchLastUsers();
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative pb-20">
      {/* Top Header */}
      <header className="px-4 py-3 flex items-center justify-between bg-white border-b border-charcoal/5 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5">
          {isDetailsPage ? (
            <button 
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-slate-100 rounded-full transition-all"
              aria-label="Go back"
            >
              <ChevronLeft size={20} className="text-black" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-display font-extrabold text-xs">
              KR
            </div>
          )}
          <span className="font-display font-bold text-sm text-black">{pageTitle}</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleNotifications}
            className="relative p-1 hover:bg-slate-100 rounded-full transition-all"
          >
            <Bell size={20} className="text-charcoal" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-coral" />
          </button>
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
            AD
          </div>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-4 top-14 w-80 bg-white rounded-3xl border border-charcoal/5 shadow-2xl p-4 z-50 flex flex-col gap-3 animate-fade-in">
              <div className="flex justify-between items-center border-b border-charcoal/5 pb-2">
                <span className="text-xs font-bold text-ink">Recent Registrations</span>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="text-[10px] font-bold text-slate hover:text-ink"
                >
                  Close
                </button>
              </div>

              <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto no-scrollbar">
                {loadingUsers ? (
                  <p className="text-[11px] text-slate italic py-4 text-center">Loading new users...</p>
                ) : lastUsers.length > 0 ? (
                  lastUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate(`/admin/users/${u.id}`);
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 text-left transition-all active:scale-[0.98]"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-xs shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-bold text-ink truncate">{u.name}</span>
                        <span className="text-[10px] text-slate truncate">{u.email || u.phone || "No contact"}</span>
                        <span className="text-[8px] text-slate/50">Joined: {new Date(u.created_at).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-[11px] text-slate italic py-4 text-center">No recent registrations.</p>
                )}
              </div>

              <button 
                onClick={() => {
                  setShowNotifications(false);
                  navigate("/admin/users");
                }}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 rounded-2xl text-[10px] font-bold text-ink text-center border border-charcoal/5 transition-all mt-1"
              >
                View User Directory
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[420px] mx-auto">
        <Outlet />
      </main>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto bg-white border-t border-charcoal/8 py-2 px-4 flex items-center justify-between z-40 shadow-lg">
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
            ["/admin/analytics", "/admin/logs", "/admin/settings"].some((p) => currentPath.startsWith(p))
              ? "text-emerald-600 font-bold"
              : "text-slate/60 hover:text-slate"
          }`}
        >
          <MoreHorizontal size={19} />
          <span className="text-[9px] font-semibold">More</span>
        </button>
      </nav>

      {/* More Options Drawer Overlay */}
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
                className="p-1 hover:bg-slate-100 rounded-full transition-all"
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
            </div>

            <button
              onClick={() => {
                setShowMoreMenu(false);
                handleLogout();
              }}
              className="w-full py-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-[0.99] hover:bg-rose-100"
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
