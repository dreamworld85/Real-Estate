import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
import Button from "@/components/Button";
import BottomNav from "@/components/BottomNav";

export default function Success() {
  const navigate = useNavigate();
  const { reset } = useAddProperty();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center pb-28">
      <div className="w-20 h-20 rounded-full bg-forest flex items-center justify-center mb-6">
        <CheckCircle2 size={40} className="text-cream" strokeWidth={2} />
      </div>

      <h1 className="font-display font-extrabold text-2xl text-ink mb-2">
        Congratulations!
      </h1>
      <p className="text-slate leading-relaxed mb-1">
        Your property has been submitted successfully.
      </p>
      <span className="inline-block mt-3 mb-10 text-xs font-semibold text-amber bg-amber/15 rounded-full px-3 py-1.5">
        Pending Admin Approval
      </span>

      <div className="w-full flex flex-col gap-3">
        <Button
          onClick={() => {
            reset();
            navigate("/my-properties");
          }}
        >
          View My Property
        </Button>
        <button
          className="text-sm font-semibold text-forest py-2"
          onClick={() => {
            reset();
            navigate("/add-property");
          }}
        >
          Add Another Property
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
