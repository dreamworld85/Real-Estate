import React, { useEffect, useState } from "react";
import { X, User, Calendar, Mail, Phone, Eye } from "lucide-react";
import { api } from "../lib/api";

interface Viewer {
  id: number;
  viewed_at: string;
  visitor_id: number | null;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  visitor_avatar: string | null;
}

interface PropertyViewersModalProps {
  propertyId: number;
  propertyTitle: string;
  onClose: () => void;
}

export default function PropertyViewersModal({
  propertyId,
  propertyTitle,
  onClose
}: PropertyViewersModalProps) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.fetchPropertyViewers(propertyId)
      .then((data) => setViewers(data))
      .catch((err) => setError(err.message || "Failed to load viewers list"))
      .finally(() => setLoading(false));
  }, [propertyId]);

  return (
    <div 
      className="fixed inset-0 bg-black/45 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div 
        className="bg-cream w-full max-w-[420px] rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl relative flex flex-col max-h-[85vh] sm:max-h-[75vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-slate-100/80 rounded-full text-slate transition-all"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-4 pr-8">
          <div className="flex items-center gap-1.5 text-ink">
            <Eye size={20} />
            <h3 className="font-display font-extrabold text-lg">Property Views Log</h3>
          </div>
          <p className="text-[11px] text-slate mt-0.5 truncate font-medium">
            For: <span className="font-semibold text-charcoal">{propertyTitle}</span>
          </p>
        </div>

        {/* Viewers List */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate font-medium">Fetching visitor log...</p>
            </div>
          ) : error ? (
            <p className="text-xs text-center text-coral py-8 font-medium">{error}</p>
          ) : viewers.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate/50">
                <User size={20} />
              </div>
              <p className="text-xs text-slate font-semibold">No views recorded yet.</p>
              <p className="text-[10px] text-slate/60 px-6">Once someone views this listing, their details will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {viewers.map((viewer) => {
                const isAnonymous = !viewer.visitor_id;
                return (
                  <div 
                    key={viewer.id} 
                    className="bg-white rounded-2xl p-3.5 border border-charcoal/5 shadow-sm flex items-start gap-3 transition-colors hover:border-charcoal/10"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-sage flex items-center justify-center text-forest font-bold shrink-0 shadow-inner">
                      {viewer.visitor_avatar && !isAnonymous ? (
                        <img 
                          src={viewer.visitor_avatar} 
                          className="w-full h-full rounded-full object-cover border border-charcoal/8" 
                          alt="" 
                        />
                      ) : (
                        <User size={16} className={isAnonymous ? "text-slate/60" : "text-forest"} />
                      )}
                    </div>

                    {/* Visitor Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-charcoal">
                        {isAnonymous ? "Anonymous Visitor" : viewer.visitor_name}
                      </p>

                      {!isAnonymous && (
                        <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-slate/75">
                          {viewer.visitor_phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={10} className="text-slate/60" />
                              <span className={viewer.visitor_phone.includes("XXXXX") ? "filter blur-[4px] select-none pointer-events-none" : ""}>
                                {viewer.visitor_phone}
                              </span>
                            </span>
                          )}
                          {viewer.visitor_email && (
                            <span className="flex items-center gap-1">
                              <Mail size={10} className="text-slate/60" />
                              <span className={viewer.visitor_email.includes("locked") ? "filter blur-[4px] select-none pointer-events-none" : ""}>
                                {viewer.visitor_email}
                              </span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Log time */}
                      <span className="text-[9px] text-slate/50 flex items-center gap-1 mt-1.5 font-medium">
                        <Calendar size={10} className="text-slate/40" /> 
                        {new Date(viewer.viewed_at).toLocaleDateString()} at {new Date(viewer.viewed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
