import { Home, Search, PlusCircle, MessageSquare, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const items = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: PlusCircle, label: "Add", path: "/add-property" },
  { icon: MessageSquare, label: "Enquiries", path: "/visitors-enquiries" },
  { icon: User, label: "Profile", path: "/profile" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav-container fixed bottom-0 left-0 right-0 mx-auto max-w-[420px] bg-white shadow-nav border-t border-charcoal/5 px-2 pb-safe z-30">
      <div className="flex items-center justify-between px-2 py-2">
        {items.map(({ icon: Icon, label, path }) => {
          const active =
            location.pathname === path ||
            (path === "/visitors-enquiries" &&
              (location.pathname === "/visitors-enquiries" ||
                location.pathname === "/enquiries"));
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="relative flex flex-col items-center gap-1 px-3 py-1.5 group"
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.4 : 1.8}
                className={active ? "text-ink" : "text-slate"}
              />
              <span
                className={`text-[11px] font-medium ${
                  active ? "text-ink" : "text-slate"
                }`}
              >
                {label}
              </span>
              {active && (
                <svg
                  width="18"
                  height="7"
                  viewBox="0 0 18 7"
                  className="absolute -bottom-0.5"
                  fill="none"
                >
                  <path
                    d="M1 5.5C4 1 8 0.5 9 0.5C10 0.5 14 1 17 5.5"
                    stroke="#C89B3C"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
