import { useNavigate } from "react-router-dom";
import { useAddProperty } from "@/lib/AddPropertyContext";
import Header from "@/components/Header";
import StepProgress from "@/components/StepProgress";
import Select from "@/components/Select";
import Button from "@/components/Button";

const counts = ["1", "2", "3", "4", "5+"];
const furnishingOptions = ["Unfurnished", "Semi-Furnished", "Fully Furnished"];
const facingOptions = ["East", "West", "North", "South", "North-East", "North-West", "South-East", "South-West"];
const ageOptions = ["Under Construction", "0-1 Years", "1-5 Years", "5-10 Years", "10+ Years"];

export default function MoreInfoStep3() {
  const navigate = useNavigate();
  const { form, update } = useAddProperty();

  const isLand = form.propertyType === "Land";
  const canContinue = isLand || (form.bedrooms && form.bathrooms && form.furnishing && form.facing && form.propertyAge);

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Add Property" showBack />
      <StepProgress step={3} />

      <div className="px-4 flex flex-col gap-5 flex-1">
        <h2 className="font-display font-bold text-lg text-ink -mt-1">More Information</h2>

        {!isLand && (
          <>
            <Select
              label="Bedrooms"
              options={counts}
              value={form.bedrooms}
              onChange={(e) => update({ bedrooms: e.target.value })}
            />
            <Select
              label="Bathrooms"
              options={counts}
              value={form.bathrooms}
              onChange={(e) => update({ bathrooms: e.target.value })}
            />
            <Select
              label="Furnishing"
              options={furnishingOptions}
              value={form.furnishing}
              onChange={(e) => update({ furnishing: e.target.value })}
            />
          </>
        )}
        <Select
          label="Facing"
          options={facingOptions}
          value={form.facing}
          onChange={(e) => update({ facing: e.target.value })}
        />
        {!isLand && (
          <Select
            label="Property Age"
            options={ageOptions}
            value={form.propertyAge}
            onChange={(e) => update({ propertyAge: e.target.value })}
          />
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-charcoal/80">Description</label>
          <textarea
            rows={4}
            placeholder="Write about your property..."
            value={form.description}
            onChange={(e) => update({ description: e.target.value })}
            className="w-full rounded-xl border border-charcoal/12 bg-white px-4 py-3 text-[15px] text-charcoal placeholder:text-slate/60 focus:border-ink/40 resize-none"
          />
        </div>
      </div>

      <div className="px-4 pb-8 pt-6">
        <Button disabled={!canContinue} onClick={() => navigate("/add-property/review")}>
          Next
        </Button>
      </div>
    </div>
  );
}
