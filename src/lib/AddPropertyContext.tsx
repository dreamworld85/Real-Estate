import { createContext, useContext, useState, ReactNode } from "react";
import { ListingRole } from "./types";

export interface NewPropertyForm {
  role: ListingRole | null;
  propertyType: string;
  propertyCategory: string;
  purpose: string;
  price: string;
  areaSqft: string;
  areaUnit: string;
  address: string;
  district: string;
  images: File[];
  video: File | null;
  youtubeUrl: string;
  bedrooms: string;
  bathrooms: string;
  furnishing: string;
  facing: string;
  propertyAge: string;
  description: string;
  contactPhone: string;
  whatsappNumber: string;
  sameAsContact: boolean;
  ownerName: string;
  brokerName: string;
  agencyName: string;
  agencyLogo: File | null;
  agencyAddress?: string;
  agencyDistrict?: string;
  useAdminContact?: boolean;
  isBrokerPersonalProperty?: boolean;
  isPriceNegotiable?: boolean;
}

const initialForm: NewPropertyForm = {
  role: null,
  propertyType: "",
  propertyCategory: "Residential",
  purpose: "For Sale",
  price: "",
  areaSqft: "",
  areaUnit: "Cents",
  address: "",
  district: "",
  images: [],
  video: null,
  youtubeUrl: "",
  bedrooms: "",
  bathrooms: "",
  furnishing: "",
  facing: "",
  propertyAge: "",
  description: "",
  contactPhone: "",
  whatsappNumber: "",
  sameAsContact: false,
  ownerName: "",
  brokerName: "",
  agencyName: "",
  agencyLogo: null,
  agencyAddress: "",
  agencyDistrict: "",
  useAdminContact: false,
  isBrokerPersonalProperty: false,
  isPriceNegotiable: false,
};

interface AddPropertyContextValue {
  form: NewPropertyForm;
  update: (patch: Partial<NewPropertyForm>) => void;
  reset: () => void;
  isEditing: boolean;
  editingId: number | null;
  startEditing: (property: any) => void;
  lastSubmittedStatus: { status: string; isOverLimit: boolean } | null;
  setLastSubmittedStatus: (status: { status: string; isOverLimit: boolean } | null) => void;
}

const AddPropertyContext = createContext<AddPropertyContextValue | null>(null);

export function AddPropertyProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<NewPropertyForm>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [lastSubmittedStatus, setLastSubmittedStatus] = useState<{ status: string; isOverLimit: boolean } | null>(null);

  function update(patch: Partial<NewPropertyForm>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function reset() {
    setForm(initialForm);
    setEditingId(null);
    setLastSubmittedStatus(null);
  }

  function startEditing(property: any) {
    setEditingId(property.id);
    setForm({
      role: property.listingRole || null,
      propertyType: property.propertyType || "",
      propertyCategory: property.propertyCategory || "Residential",
      purpose: property.purpose || "For Sale",
      price: String(property.price || ""),
      areaSqft: String(property.areaSqft || ""),
      areaUnit: property.areaUnit || "Cents",
      address: property.address || "",
      district: property.district || "",
      images: [], // New images to upload
      video: null,
      youtubeUrl: property.youtubeUrl || "",
      bedrooms: String(property.bedrooms || "0"),
      bathrooms: String(property.bathrooms || "0"),
      furnishing: property.furnishing || "",
      facing: property.facing || "",
      propertyAge: property.propertyAge || "",
      description: property.description || "",
      contactPhone: property.contactNumber || "",
      whatsappNumber: property.whatsappNumber || "",
      sameAsContact: property.whatsappNumber === property.contactNumber,
      ownerName: property.ownerName || "",
      brokerName: property.brokerName || "",
      agencyName: property.agencyName || "",
      agencyLogo: null,
      useAdminContact: !!property.useAdminContact,
      isBrokerPersonalProperty: !!property.isBrokerPersonalProperty,
    });
  }

  return (
    <AddPropertyContext.Provider 
      value={{ 
        form, 
        update, 
        reset, 
        isEditing: editingId !== null, 
        editingId, 
        startEditing,
        lastSubmittedStatus,
        setLastSubmittedStatus
      }}
    >
      {children}
    </AddPropertyContext.Provider>
  );
}

export function useAddProperty() {
  const ctx = useContext(AddPropertyContext);
  if (!ctx) {
    throw new Error("useAddProperty must be used within AddPropertyProvider");
  }
  return ctx;
}
