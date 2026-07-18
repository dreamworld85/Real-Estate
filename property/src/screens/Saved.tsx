import { useEffect, useState } from "react";
import { api, ApiProperty } from "@/lib/api";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import PropertyCard from "@/components/PropertyCard";

export default function Saved() {
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .fetchSavedProperties()
      .then(setProperties)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pb-28">
      <Header title="Saved Properties" />

      <div className="px-4">
        {loading && <p className="text-sm text-slate">Loading…</p>}
        {error && <p className="text-sm text-coral">{error}</p>}
        {!loading && properties.length === 0 && !error && (
          <p className="text-sm text-slate py-8 text-center">
            Nothing saved yet. Tap the heart on a listing to save it here.
          </p>
        )}
        <div className="flex flex-col gap-4">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
