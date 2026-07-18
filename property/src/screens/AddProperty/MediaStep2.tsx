import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, UploadCloud, X } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
import Header from "@/components/Header";
import StepProgress from "@/components/StepProgress";
import Button from "@/components/Button";

export default function MediaStep2() {
  const navigate = useNavigate();
  const { form, update } = useAddProperty();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  function handlePhotosSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    update({ images: [...form.images, ...files].slice(0, 12) });
    e.target.value = "";
  }

  function removePhoto(index: number) {
    update({ images: form.images.filter((_, i) => i !== index) });
  }

  function handleVideoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) update({ video: file });
    e.target.value = "";
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Add Property" showBack />
      <StepProgress step={2} />

      <div className="px-4 flex flex-col gap-6 flex-1">
        <div>
          <h2 className="font-display font-bold text-lg text-ink">Photos</h2>
          <p className="text-sm text-slate mb-3">Add clear photos of your property</p>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotosSelected}
          />

          <div className="grid grid-cols-3 gap-3">
            {form.images.map((file, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-xl bg-sage border border-forest/20 overflow-hidden"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Property photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-charcoal/70 rounded-full p-1"
                  aria-label="Remove photo"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
            {form.images.length < 12 && (
              <button
                onClick={() => photoInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-charcoal/15 flex flex-col items-center justify-center gap-1 text-slate hover:border-ink/30 hover:text-ink transition-colors"
              >
                <Plus size={18} />
                <span className="text-xs font-medium">
                  {form.images.length === 0 ? "Add Photo" : "Add More"}
                </span>
              </button>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-display font-bold text-lg text-ink">Videos (Optional)</h2>
          <p className="text-sm text-slate mb-3">Add property videos (max 50MB)</p>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoSelected}
          />

          <button
            onClick={() => videoInputRef.current?.click()}
            className={`w-full rounded-xl border-2 border-dashed py-6 flex flex-col items-center gap-2 transition-colors ${
              form.video ? "border-forest bg-forest/5 text-forest" : "border-charcoal/15 text-slate hover:border-ink/30"
            }`}
          >
            <UploadCloud size={22} />
            <span className="text-sm font-semibold">
              {form.video ? form.video.name : "Upload Video"}
            </span>
            <span className="text-xs">MP4, Max 50MB</span>
          </button>
        </div>
      </div>

      <div className="px-4 pb-8 pt-6">
        <Button disabled={form.images.length === 0} onClick={() => navigate("/add-property/more-info")}>
          Next
        </Button>
      </div>
    </div>
  );
}
