// Shared enum-like types used across components (RoleBadge, StatusBadge, the
// Add Property wizard). The full data shapes returned by the API live in
// src/lib/api.ts (ApiUser, ApiProperty) since they must match the backend
// response exactly.

export type ListingRole = "Owner" | "Broker" | "Agency";

export type PropertyStatus = "Draft" | "Pending" | "Active" | "Inactive" | "Rejected";
