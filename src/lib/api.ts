/// <reference types="vite/client" />
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const originalFetch = window.fetch;
window.fetch = function (input, init) {
  const options = init || {};
  options.credentials = "include";
  return originalFetch(input, options);
};

export interface ApiUser {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  whatsappNumber?: string | null;
  location: string | null;
  avatarUrl: string | null;
  trialEndsAt?: string | null;
  subscriptionStatus?: "trial" | "active" | "expired" | "canceled" | null;
  razorpaySubscriptionId?: string | null;
  role?: "Owner" | "Broker" | "Agency" | "User" | null;
  hasAccess?: boolean;
  hasTrial?: boolean;
  remainingDays?: number;
  inquiryCount?: number;
  propertiesCount?: number;
  createdAt?: string | null;
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
  isFeatured?: boolean;
  isPriceNegotiable?: boolean;
  useAdminContact?: boolean;
  avgRating?: number;
  ratingCount?: number;
  ownerName?: string;
  contactNumber?: string | null;
  whatsappNumber?: string | null;
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
  contactAccess?: boolean;
  isMasked?: boolean;
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
    visitorPhone?: string | null;
    visitorEmail?: string | null;
    propertyTitle: string;
    enquiredAt: string;
    isLocked?: boolean;
  }[];
  isTrialExpired?: boolean;
  hasTrial?: boolean;
  remainingDays?: number;
  role?: string;
  isSubscribed?: boolean;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("kr_token");
  const adminToken = localStorage.getItem("kerala_realty_admin_token");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (adminToken && window.location.pathname.startsWith("/admin")) {
    headers["x-admin-auth"] = adminToken;
  }
  return headers;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed with status ${res.status}`);
    Object.assign(err, body);
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  async register(input: { name: string; email?: string; phone?: string; password: string; role?: string }) {
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

  async fetchFeaturedStatus() {
    const res = await fetch(`${API_URL}/api/properties/featured-status`, { headers: authHeaders() });
    return handle<{
      isSubscribed: boolean;
      featuredCount: number;
      freeFeaturedLimit: number;
      featuredPrice: number;
      featuredText: string;
      isEligibleForFree: boolean;
    }>(res);
  },

  async fetchMyProperties() {
    const res = await fetch(`${API_URL}/api/properties/mine`, { headers: authHeaders() });
    return handle<ApiProperty[]>(res);
  },

  async fetchProperty(id: number | string) {
    const res = await fetch(`${API_URL}/api/properties/${id}`, { headers: authHeaders() });
    return handle<ApiPropertyDetail>(res);
  },

  async fetchPropertyViewers(id: number | string) {
    const res = await fetch(`${API_URL}/api/properties/${id}/viewers`, { headers: authHeaders() });
    return handle<{
      id: number;
      viewed_at: string;
      visitor_id: number | null;
      visitor_name: string | null;
      visitor_email: string | null;
      visitor_phone: string | null;
      visitor_avatar: string | null;
    }[]>(res);
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

  async recordClickInquiry(propertyId: number) {
    const res = await fetch(`${API_URL}/api/properties/${propertyId}/click-inquiry`, {
      method: "POST",
      headers: authHeaders(),
    });
    return handle<{ success: boolean; remainingClicks?: number }>(res);
  },

  async fetchMyProfile() {
    const res = await fetch(`${API_URL}/api/users/me`, { headers: authHeaders() });
    return handle<ApiUser & { hasTrial: boolean; remainingDays: number; isSubscribed: boolean; inquiryCount: number; propertiesCount: number }>(res);
  },

  async validateSession() {
    const res = await fetch(`${API_URL}/api/auth/me`, { headers: authHeaders() });
    return handle<{ user: ApiUser }>(res);
  },

  async logout() {
    const res = await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: authHeaders()
    });
    return handle<{ success: boolean }>(res);
  },

  async updateMyProfile(input: Partial<Pick<ApiUser, "name" | "phone" | "email" | "location">>) {
    const res = await fetch(`${API_URL}/api/users/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(input),
    });
    return handle<ApiUser>(res);
  },

  async setupRole(formData: FormData) {
    const res = await fetch(`${API_URL}/api/users/setup-role`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("kr_token")}`
      },
      body: formData,
    });
    return handle<{ success: boolean; message: string; user: ApiUser }>(res);
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
    return handle<{ id: number; status: string; isOverLimit?: boolean; user?: ApiUser }>(res);
  },

  async updateProperty(id: number | string, formData: FormData) {
    const res = await fetch(`${API_URL}/api/properties/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: formData,
    });
    return handle<{ success: boolean; message: string }>(res);
  },

  async updatePropertyStatus(id: number, status: "Active" | "Inactive" | "Draft", useAdminContact?: boolean) {
    const res = await fetch(`${API_URL}/api/properties/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ status, useAdminContact }),
    });
    return handle<{ id: number; status: string; useAdminContact?: boolean }>(res);
  },

  async restorePropertyContact(id: number | string) {
    const res = await fetch(`${API_URL}/api/properties/${id}/restore-contact`, {
      method: "POST",
      headers: authHeaders(),
    });
    return handle<{ success: boolean; message: string }>(res);
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

  async initiateSubscription(durationMonths: number) {
    const res = await fetch(`${API_URL}/api/payments/create-subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ durationMonths }),
    });
    return handle<{ id: string; amount: number; currency: string }>(res);
  },

  async verifySubscription(paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    durationMonths: number;
  }) {
    const res = await fetch(`${API_URL}/api/payments/verify-subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(paymentData),
    });
    return handle<{ success: boolean }>(res);
  },

  async initiateFeaturedPayment(propertyId: number) {
    const res = await fetch(`${API_URL}/api/payments/create-featured-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ propertyId }),
    });
    return handle<{ id: string; amount: number; currency: string; propertyId: number }>(res);
  },

  async verifyFeaturedPayment(paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    propertyId: number;
  }) {
    const res = await fetch(`${API_URL}/api/payments/verify-featured-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(paymentData),
    });
    return handle<{ success: boolean }>(res);
  },

  async featureProperty(id: number) {
    const res = await fetch(`${API_URL}/api/properties/${id}/feature`, {
      method: "POST",
      headers: authHeaders(),
    });
    return handle<{ success: boolean; message: string }>(res);
  },

  async fetchSetting(key: string): Promise<{ key: string; value: string }> {
    const res = await fetch(`${API_URL}/api/admin/settings/${key}`);
    return handle<{ key: string; value: string }>(res);
  },

  async requestRoleSwitch(requestedRole: string) {
    const res = await fetch(`${API_URL}/api/users/me/role-switch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ requestedRole }),
    });
    return handle<{ message: string }>(res);
  },

  async fetchRoleSwitchStatus() {
    const res = await fetch(`${API_URL}/api/users/me/role-switch`, {
      headers: authHeaders(),
    });
    return handle<{ status: "Pending" | "Approved" | "Rejected"; created_at: string } | null>(res);
  },

  async fetchSubscriptionPlans() {
    const res = await fetch(`${API_URL}/api/admin/subscription-plans`);
    return handle<{ role: "user" | "owner" | "broker" | "agency"; price: string; discount: string; description: string; duration_months: number; features?: string }[]>(res);
  },

  async adminUpdateSubscriptionPlans(plans: { role: string; price: number; description?: string; discount?: number; duration_months?: number; features?: string[] | string }[]) {
    const res = await fetch(`${API_URL}/api/admin/subscription-plans`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "x-admin-auth": localStorage.getItem("kerala_realty_admin_token") || ""
      },
      body: JSON.stringify({ plans }),
    });
    return handle<{ success: boolean }>(res);
  },

  async adminFetchRoleSwitches() {
    const res = await fetch(`${API_URL}/api/admin/role-switches`, {
      headers: { "x-admin-auth": localStorage.getItem("kerala_realty_admin_token") || "" },
    });
    return handle<{
      id: number;
      requested_role: string;
      status: "Pending" | "Approved" | "Rejected";
      created_at: string;
      user_id: number;
      user_name: string;
      user_email: string;
      user_phone: string;
    }[]>(res);
  },

  async adminApproveRoleSwitch(id: number) {
    const res = await fetch(`${API_URL}/api/admin/role-switches/${id}/approve`, {
      method: "PUT",
      headers: { "x-admin-auth": localStorage.getItem("kerala_realty_admin_token") || "" },
    });
    return handle<{ success: boolean }>(res);
  },

  async adminRejectRoleSwitch(id: number) {
    const res = await fetch(`${API_URL}/api/admin/role-switches/${id}/reject`, {
      method: "PUT",
      headers: { "x-admin-auth": localStorage.getItem("kerala_realty_admin_token") || "" },
    });
    return handle<{ success: boolean }>(res);
  },

  async adminFetchSubscriptionStats() {
    const res = await fetch(`${API_URL}/api/admin/subscription-stats`, {
      headers: { "x-admin-auth": localStorage.getItem("kerala_realty_admin_token") || "" },
    });
    return handle<{ User: number; Owner: number; Broker: number; Agency: number }>(res);
  },

  async fetchNotifications() {
    const res = await fetch(`${API_URL}/api/users/me/notifications`, { headers: authHeaders() });
    return handle<ApiNotification[]>(res);
  },

  async markNotificationsRead() {
    const res = await fetch(`${API_URL}/api/users/me/notifications/read-all`, {
      method: "POST",
      headers: authHeaders(),
    });
    return handle<{ success: boolean }>(res);
  },

  async deleteAccount() {
    const res = await fetch(`${API_URL}/api/users/me`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handle<{ success: boolean; message: string }>(res);
  },

  async fetchAppDownloadSettings() {
    const res = await fetch(`${API_URL}/api/admin/app-download-settings`);
    return handle<ApiAppDownloadSettings>(res);
  },

  async updateAppDownloadSettings(formData: FormData) {
    const res = await fetch(`${API_URL}/api/admin/app-download-settings`, {
      method: "PUT",
      headers: { "x-admin-auth": localStorage.getItem("kerala_realty_admin_token") || "" },
      body: formData
    });
    return handle<{ message: string; brand_logo_url: string }>(res);
  },

  async fetchMobileShareSettings() {
    const res = await fetch(`${API_URL}/api/admin/mobile-share-settings`);
    return handle<ApiMobileShareSettings>(res);
  },

  async updateMobileShareSettings(formData: FormData) {
    const res = await fetch(`${API_URL}/api/admin/mobile-share-settings`, {
      method: "PUT",
      headers: { "x-admin-auth": localStorage.getItem("kerala_realty_admin_token") || "" },
      body: formData
    });
    return handle<{ message: string; brand_logo_url: string; illustration_url: string }>(res);
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

export interface ApiNotification {
  id: number;
  user_id: number;
  sender_id: number | null;
  type: string;
  message: string;
  property_id: number | null;
  is_read: number;
  created_at: string;
  sender_name?: string | null;
  sender_role?: string | null;
  sender_avatar?: string | null;
}

export interface ApiAppDownloadSettings {
  id?: number;
  brand_logo_url: string;
  main_title: string;
  subtitle: string;
  google_play_url: string;
  app_store_url: string;
  safe_secure_title: string;
  safe_secure_desc: string;
  trusted_users_title: string;
  trusted_users_desc: string;
  footer_brand: string;
  footer_tagline: string;
}

export interface ApiMobileShareSettings {
  id?: number;
  brand_name: string;
  brand_logo_url: string;
  tagline: string;
  illustration_url: string;
  description_quote: string;
  button_text: string;
  google_play_url: string;
  app_store_url: string;
  trust_text: string;
}

