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
};

interface AddPropertyContextValue {
  form: NewPropertyForm;
  update: (patch: Partial<NewPropertyForm>) => void;
  reset: () => void;
}

const AddPropertyContext = createContext<AddPropertyContextValue | null>(null);

export function AddPropertyProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<NewPropertyForm>(initialForm);

  function update(patch: Partial<NewPropertyForm>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function reset() {
    setForm(initialForm);
  }

  return (
    <AddPropertyContext.Provider value={{ form, update, reset }}>
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
