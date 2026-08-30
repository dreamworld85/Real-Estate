import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { api, mediaUrl } from "@/lib/api";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export default function TopLocationsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topLocations, setTopLocations] = useState<{ id: number; name: string; image_url: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.fetchTopLocations()
      .then((locs) => {
        if (locs) setTopLocations(locs);
      })
      .catch(err => {
        console.error("Failed to load TopLocations:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const trailing = (
    <button 
      onClick={() => navigate("/profile")} 
      className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shadow-sm flex items-center justify-center cursor-pointer active:scale-95 transition-all"
    >
      {user?.avatarUrl ? (
        <img src={mediaUrl(user.avatarUrl)} alt="Profile" className="w-full h-full object-cover" />
      ) : (
        <User size={15} className="text-slate-500" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col pb-28 bg-[#FAF8F3] font-display select-none">
      <Header title="Top Locations" showBack trailing={trailing} />

      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#59AD63]" />
        </div>
      ) : (
        <div className="px-6 pt-4 flex flex-col gap-6 flex-1">
          {/* Top Locations Grid */}
          <div className="grid grid-cols-2 gap-4">
            {topLocations.map((loc) => (
              <div 
                key={loc.id} 
                onClick={() => navigate(`/location/${encodeURIComponent(loc.name)}`)}
                className="flex flex-col bg-white border border-charcoal/5 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer hover:shadow-md transition-all duration-200 active:scale-[0.98]"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-50">
                  <img 
                    src={mediaUrl(loc.image_url)} 
                    alt={loc.name} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3 bg-white">
                  <span className="text-[13px] font-medium text-slate-800 truncate block">{loc.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
