import { ListingRole } from "@/lib/types";

const roleStyles: Record<ListingRole, string> = {
  Owner: "bg-forest/10 text-forest",
  Broker: "bg-ink/10 text-ink",
  Agency: "bg-gold/15 text-gold",
};

export default function RoleBadge({ role }: { role: ListingRole }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[role]}`}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path
          d="M0.5 7.5C1 4 3 1 7.5 0.5C7 4 5 6.5 0.5 7.5Z"
          fill="currentColor"
        />
      </svg>
      {role}
    </span>
  );
}
