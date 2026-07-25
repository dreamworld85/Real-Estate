/// <reference types="vite/client" />
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export interface ApiUser {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  avatarUrl: string | null;
}

export interface ApiProperty {
  id: number;
  ownerId: number;
  title: string;
  propertyType: string;
  purpose: string;
  price: number;
  areaSqft: number;
  address: string;
  district: string;
  bedrooms: number;
  bathrooms: number;
  furnishing: string | null;
  facing: string | null;
  propertyAge: string | null;
  description: string | null;
  listingRole: "Owner" | "Broker" | "Agency";
  status: "Draft" | "Pending" | "Active" | "Inactive" | "Rejected";
  views: number;
  images: string[];
  videos: string[];
  youtubeUrl?: string | null;
  createdAt: string;
  isSaved?: boolean;
  avgRating?: number;
  ratingCount?: number;
}

export interface ApiPropertyDetail extends ApiProperty {
  ownerName: string;
  ownerPhone: string | null;
  saveCount: number;
  enquiryCount: number;
  isSaved: boolean;
  contactNumber?: string | null;
  whatsappNumber?: string | null;
  brokerName?: string | null;
  agencyName?: string | null;
  agencyLogoUrl?: string | null;
}

export interface ApiPublicProfile extends ApiUser {
  totalListings: number;
  distinctEnquirers: number;
  yearsActive: number;
}

export interface ApiReview {
  id: number;
  rating: number;
  comment: string | null;
  reviewer_name: string;
  created_at: string;
}

export interface ApiDashboardStats {
  totalViews: number;
  totalEnquiries: number;
  recentVisitors: {
    visitorName: string;
    visitorLocation: string | null;
    propertyTitle: string;
    enquiredAt: string;
  }[];
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("kr_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  async register(input: { name: string; email?: string; phone?: string; password: string }) {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handle<{ token: string; user: ApiUser }>(res);
  },

  async login(identifier: string, password: string) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    return handle<{ token: string; user: ApiUser }>(res);
  },

  async fetchProperties(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/api/properties${query ? `?${query}` : ""}`, {
      headers: authHeaders(),
    });
    return handle<ApiProperty[]>(res);
  },

  async fetchMyProperties() {
    const res = await fetch(`${API_URL}/api/properties/mine`, { headers: authHeaders() });
    return handle<ApiProperty[]>(res);
  },

  async fetchProperty(id: number | string) {
    const res = await fetch(`${API_URL}/api/properties/${id}`, { headers: authHeaders() });
    return handle<ApiPropertyDetail>(res);
  },

  async toggleSaveProperty(id: number) {
    const res = await fetch(`${API_URL}/api/properties/${id}/save`, {
      method: "POST",
      headers: authHeaders(),
    });
    return handle<{ saved: boolean }>(res);
  },

  async fetchSavedProperties() {
    const res = await fetch(`${API_URL}/api/properties/saved/mine`, { headers: authHeaders() });
    return handle<ApiProperty[]>(res);
  },

  async sendEnquiry(propertyId: number, message?: string) {
    const res = await fetch(`${API_URL}/api/properties/${propertyId}/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ message }),
    });
    return handle<{ ok: boolean }>(res);
  },

  async fetchMyProfile() {
    const res = await fetch(`${API_URL}/api/users/me`, { headers: authHeaders() });
    return handle<ApiUser>(res);
  },

  async updateMyProfile(input: Partial<Pick<ApiUser, "name" | "phone" | "email" | "location">>) {
    const res = await fetch(`${API_URL}/api/users/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(input),
    });
    return handle<ApiUser>(res);
  },

  async fetchMyStats() {
    const res = await fetch(`${API_URL}/api/users/me/stats`, { headers: authHeaders() });
    return handle<ApiDashboardStats>(res);
  },

  async fetchPublicProfile(userId: number) {
    const res = await fetch(`${API_URL}/api/users/${userId}/profile`);
    return handle<ApiPublicProfile>(res);
  },

  async createProperty(formData: FormData) {
    const res = await fetch(`${API_URL}/api/properties`, {
      method: "POST",
      headers: authHeaders(), // don't set Content-Type — browser sets multipart boundary
      body: formData,
    });
    return handle<{ id: number; status: string }>(res);
  },

  async updatePropertyStatus(id: number, status: "Active" | "Inactive" | "Draft") {
    const res = await fetch(`${API_URL}/api/properties/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ status }),
    });
    return handle<{ id: number; status: string }>(res);
  },

  async deleteProperty(id: number) {
    const res = await fetch(`${API_URL}/api/properties/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handle<void>(res);
  },

  async reportProperty(id: number | string, reason: string, description?: string) {
    const res = await fetch(`${API_URL}/api/properties/${id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ reason, description }),
    });
    return handle<{ message: string }>(res);
  },

  async fetchReviews(propertyId: number | string) {
    const res = await fetch(`${API_URL}/api/properties/${propertyId}/reviews`);
    return handle<ApiReview[]>(res);
  },

  async submitReview(propertyId: number | string, rating: number, comment?: string) {
    const res = await fetch(`${API_URL}/api/properties/${propertyId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ rating, comment }),
    });
    return handle<{ message: string }>(res);
  },

  async fetchSetting(key: string): Promise<{ key: string; value: string }> {
    const res = await fetch(`${API_URL}/api/admin/settings/${key}`);
    return handle<{ key: string; value: string }>(res);
  },
};

export function mediaUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/uploads")) {
    return `${API_URL}${path}`;
  }
  return path;
}

export function formatArea(areaSqft: number, propertyType: string): string {
  const isLand = propertyType === "Land" || propertyType === "Plot / Land" || propertyType?.toLowerCase().includes("land");
  if (isLand) {
    const cents = areaSqft / 435.6;
    if (cents >= 100) {
      const acres = cents / 100;
      return `${Number(acres.toFixed(2))} Acres`;
    }
    return `${Number(cents.toFixed(1))} Cents`;
  }
  return `${areaSqft.toLocaleString("en-IN")} sq.ft`;
}
