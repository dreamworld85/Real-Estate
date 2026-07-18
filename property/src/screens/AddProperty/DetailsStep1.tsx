import { useNavigate } from "react-router-dom";
import { Crosshair } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
import Header from "@/components/Header";
import StepProgress from "@/components/StepProgress";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";

const propertyTypes = ["House", "Villa", "Apartment", "Land", "Commercial Space"];
const purposes = ["For Sale", "For Rent"];
const districts = [
  "Wayanad", "Kozhikode", "Kannur", "Kasaragod", "Malappuram", "Palakkad",
  "Thrissur", "Ernakulam", "Idukki", "Kottayam", "Alappuzha", "Pathanamthitta",
  "Kollam", "Thiruvananthapuram",
];

export default function DetailsStep1() {
  const navigate = useNavigate();
  const { form, update } = useAddProperty();

  const canContinue = form.propertyType && form.purpose && form.price && form.areaSqft && form.address && form.district;

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Add Property" showBack />
      <StepProgress step={1} />

      <div className="px-4 flex flex-col gap-5 flex-1">
        <h2 className="font-display font-bold text-lg text-ink -mt-1">Property Details</h2>

        <Select
          label="Property Type"
          options={propertyTypes}
          value={form.propertyType}
          onChange={(e) => update({ propertyType: e.target.value })}
        />
        <Select
          label="Purpose"
          options={purposes}
          value={form.purpose}
          onChange={(e) => update({ purpose: e.target.value })}
        />
        <Input
          label="Price"
          type="number"
          placeholder="Enter price"
          value={form.price}
          onChange={(e) => update({ price: e.target.value })}
        />
        <Input
          label="Area (sq.ft)"
          type="number"
          placeholder="Enter area"
          value={form.areaSqft}
          onChange={(e) => update({ areaSqft: e.target.value })}
        />
        <Input
          label="Location"
          placeholder="Enter address"
          value={form.address}
          onChange={(e) => update({ address: e.target.value })}
        />
        <div>
          <Select
            label="District"
            options={districts}
            value={form.district}
            onChange={(e) => update({ district: e.target.value })}
          />
          <button className="flex items-center gap-1.5 text-sm font-semibold text-forest mt-2">
            <Crosshair size={14} /> Use Current Location
          </button>
        </div>
      </div>

      <div className="px-4 pb-8 pt-6">
        <Button disabled={!canContinue} onClick={() => navigate("/add-property/media")}>
          Next
        </Button>
      </div>
    </div>
  );
}
