import { createContext, useContext, useState, ReactNode } from "react";
import { ListingRole } from "./types";

export interface NewPropertyForm {
  role: ListingRole | null;
  propertyType: string;
  purpose: string;
  price: string;
  areaSqft: string;
  address: string;
  district: string;
  images: File[];
  video: File | null;
  bedrooms: string;
  bathrooms: string;
  furnishing: string;
  facing: string;
  propertyAge: string;
  description: string;
}

const initialForm: NewPropertyForm = {
  role: null,
  propertyType: "",
  purpose: "",
  price: "",
  areaSqft: "",
  address: "",
  district: "",
  images: [],
  video: null,
  bedrooms: "",
  bathrooms: "",
  furnishing: "",
  facing: "",
  propertyAge: "",
  description: "",
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
