import { PropertyStatus } from "@/lib/types";

const statusStyles: Record<PropertyStatus, string> = {
  Active: "bg-forest/10 text-forest",
  Pending: "bg-amber/15 text-amber",
  Draft: "bg-slate/15 text-slate",
  Inactive: "bg-coral/10 text-coral",
  Rejected: "bg-coral/10 text-coral",
};

export default function StatusBadge({ status }: { status: PropertyStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
