import { useEffect, useState } from "react";
import { 
  PhoneCall, 
  Search, 
  Trash2, 
  RefreshCw, 
  Filter, 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Tag
} from "lucide-react";
import { adminApi, ServiceEnquiry } from "@/lib/adminApi";

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-50 text-blue-700 border-blue-200",
  Contacted: "bg-purple-50 text-purple-700 border-purple-200",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
  Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Closed: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function ServiceEnquiries() {
  const [enquiries, setEnquiries] = useState<ServiceEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getServiceEnquiries();
      setEnquiries(data);
    } catch (err: any) {
      console.error("Failed to load service enquiries:", err);
      setError(err.message || "Failed to load enquiries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      await adminApi.updateServiceEnquiryStatus(id, newStatus);
      setEnquiries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this service enquiry?")) return;
    setDeletingId(id);
    try {
      await adminApi.deleteServiceEnquiry(id);
      setEnquiries((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(`Failed to delete enquiry: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered List
  const filteredEnquiries = enquiries.filter((item) => {
    const matchesSearch =
      search === "" ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.phone.includes(search) ||
      item.city.toLowerCase().includes(search.toLowerCase()) ||
      item.service_name.toLowerCase().includes(search.toLowerCase()) ||
      item.user_class.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const totalCount = enquiries.length;
  const newCount = enquiries.filter((e) => e.status === "New").length;
  const contactedCount = enquiries.filter((e) => e.status === "Contacted").length;
  const resolvedCount = enquiries.filter((e) => e.status === "Resolved" || e.status === "Closed").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-display">
            User Enquiries
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Manage callback requests and service enquiries submitted by users across the portal
          </p>
        </div>
        <button
          onClick={fetchEnquiries}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-2xs active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-2xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Enquiries</span>
            <PhoneCall className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 font-display">{totalCount}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-2xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">New Enquiries</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-display">{newCount}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-2xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Contacted</span>
            <AlertCircle className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600 font-display">{contactedCount}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-2xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-display">{resolvedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, city, service..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-emerald-600 transition"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar py-1">
          {["All", "New", "Contacted", "In Progress", "Resolved", "Closed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Enquiries Data List / Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center text-gray-500 font-medium text-xs">
          Loading user service enquiries...
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-2xl border border-red-200 p-6 text-center text-red-600 font-semibold text-xs">
          {error}
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
            <PhoneCall className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-800">No Service Enquiries Found</h3>
          <p className="text-xs text-gray-500 max-w-sm">
            {search || statusFilter !== "All"
              ? "No enquiries match your search or filter criteria."
              : "No callback requests have been submitted yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-150 shadow-2xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-150 text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-5">ID & Date</th>
                  <th className="py-3.5 px-5">User Details</th>
                  <th className="py-3.5 px-5">Location & Class</th>
                  <th className="py-3.5 px-5">Service</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-800">
                {filteredEnquiries.map((item) => {
                  const statusClass =
                    STATUS_COLORS[item.status] || "bg-gray-50 text-gray-700 border-gray-200";

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition">
                      {/* ID & Date */}
                      <td className="py-4 px-5">
                        <div className="font-extrabold text-gray-900">#{item.id}</div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(item.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                        </div>
                      </td>

                      {/* User Details */}
                      <td className="py-4 px-5 space-y-1">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{item.name}</span>
                        </div>
                        <div className="text-[11px] text-gray-600 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{item.email}</span>
                        </div>
                        <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{item.phone}</span>
                        </div>
                      </td>

                      {/* Location & Class */}
                      <td className="py-4 px-5 space-y-1">
                        <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>{item.city}</span>
                        </div>
                        <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-150">
                          {item.user_class}
                        </span>
                      </td>

                      {/* Service Name */}
                      <td className="py-4 px-5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-bold text-xs">
                          <Tag className="w-3.5 h-3.5 text-amber-600" />
                          <span>{item.service_name}</span>
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-4 px-5">
                        <select
                          value={item.status}
                          disabled={updatingId === item.id}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer focus:outline-none transition ${statusClass}`}
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Enquiry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden divide-y divide-gray-100">
            {filteredEnquiries.map((item) => {
              const statusClass =
                STATUS_COLORS[item.status] || "bg-gray-50 text-gray-700 border-gray-200";

              return (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-gray-900 text-sm">#{item.id}</span>
                    <select
                      value={item.status}
                      disabled={updatingId === item.id}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer ${statusClass}`}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="font-bold text-gray-900 text-sm">{item.name}</div>
                    <div className="text-xs text-gray-600 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span>{item.email}</span>
                    </div>
                    <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{item.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> {item.city}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-150">
                        {item.user_class}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {item.service_name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px] text-gray-400">
                    <span>
                      {new Date(item.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-rose-600 font-bold flex items-center gap-1 px-2 py-1 bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
