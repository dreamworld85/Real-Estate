import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { api, ApiProperty } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import BottomNav from "@/components/BottomNav";
import Select from "@/components/Select";

const propertyTypes = ["House", "Villa", "Apartment", "Land", "Commercial Space"];
const purposes = ["For Sale", "For Rent"];
const districts = [
  "Wayanad", "Kozhikode", "Kannur", "Kasaragod", "Malappuram", "Palakkad",
  "Thrissur", "Ernakulam", "Idukki", "Kottayam", "Alappuzha", "Pathanamthitta",
  "Kollam", "Thiruvananthapuram",
];

export default function Search() {
  const [district, setDistrict] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch() {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const params: Record<string, string> = {};
      if (district) params.district = district;
      if (propertyType) params.propertyType = propertyType;
      if (purpose) params.purpose = purpose;
      const data = await api.fetchProperties(params);
      const filtered = query
        ? data.filter(
            (p) =>
              p.title.toLowerCase().includes(query.toLowerCase()) ||
              p.address.toLowerCase().includes(query.toLowerCase())
          )
        : data;
      setResults(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pb-28">
      <div className="px-4 pt-5 pb-3">
        <h1 className="font-display font-bold text-lg text-ink mb-4">Search</h1>

        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-charcoal/10 mb-4">
          <SearchIcon size={18} className="text-slate" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="Search by title or address..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate/60"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Select
            label="Property Type"
            options={propertyTypes}
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
          />
          <Select label="Purpose" options={purposes} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          <Select label="District" options={districts} value={district} onChange={(e) => setDistrict(e.target.value)} />
        </div>

        <button
          onClick={runSearch}
          className="w-full mt-4 rounded-2xl py-3.5 font-display font-semibold text-[15px] bg-ink text-cream"
        >
          Search
        </button>
      </div>

      <div className="px-4">
        {loading && <p className="text-sm text-slate">Searching…</p>}
        {error && <p className="text-sm text-coral">{error}</p>}
        {!loading && searched && results.length === 0 && !error && (
          <p className="text-sm text-slate">No properties matched your search.</p>
        )}
        <div className="flex flex-col gap-4">
          {results.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
