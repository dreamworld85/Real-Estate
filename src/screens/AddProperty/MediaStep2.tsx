import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Plus, UploadCloud, X, Check, Camera, Crop } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
import BottomNav from "@/components/BottomNav";
import StepProgress from "@/components/StepProgress";

export default function MediaStep2() {
  const navigate = useNavigate();
  const { form, update } = useAddProperty();
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Cropper states
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<File | null>(null);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [attemptedNext, setAttemptedNext] = useState(false);

  function handlePhotosSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const [first, ...rest] = files;
      setSelectedImageForCrop(first);
      setCropQueue(rest);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
    e.target.value = "";
  }

  function saveCroppedImage() {
    if (!selectedImageForCrop) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    const img = new Image();
    img.src = URL.createObjectURL(selectedImageForCrop);
    img.onload = () => {
      const containerWidth = 320;
      const containerHeight = 240;
      const scaleFactor = canvas.width / containerWidth;

      // Draw background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate((pan.x * scaleFactor) / zoom, (pan.y * scaleFactor) / zoom);

      const imgRatio = img.width / img.height;
      const targetRatio = canvas.width / canvas.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      if (imgRatio > targetRatio) {
        drawHeight = canvas.width / imgRatio;
      } else {
        drawWidth = canvas.height * imgRatio;
      }

      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], selectedImageForCrop.name, { type: "image/jpeg" });
          update({ images: [...form.images, croppedFile].slice(0, 12) });
          
          // Process next image in queue
          if (cropQueue.length > 0) {
            const [next, ...rest] = cropQueue;
            setSelectedImageForCrop(next);
            setCropQueue(rest);
            setZoom(1);
            setPan({ x: 0, y: 0 });
          } else {
            setSelectedImageForCrop(null);
          }
        }
      }, "image/jpeg", 0.85);
    };
  }

  function cancelCrop() {
    if (cropQueue.length > 0) {
      const [next, ...rest] = cropQueue;
      setSelectedImageForCrop(next);
      setCropQueue(rest);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setSelectedImageForCrop(null);
    }
  }

  function removePhoto(index: number) {
    update({ images: form.images.filter((_, i) => i !== index) });
  }

  function handleVideoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        alert("Video file size must be less than 100MB.");
        return;
      }
      update({ video: file });
    }
    e.target.value = "";
  }

  function removeVideo() {
    update({ video: null });
  }

  const canContinue = form.images.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pb-28">
      {/* Header Section */}
      <div className="flex justify-between items-center px-6 pt-6 pb-2">
        <button 
          onClick={() => navigate("/add-property/details")} 
          className="text-ink p-1 -ml-1 hover:bg-charcoal/5 rounded-full transition-colors"
          aria-label="Back"
        >
          <Menu size={24} />
        </button>
      </div>

      <StepProgress step={2} />

      <div className="px-6 pb-4">
        <h1 className="font-display font-extrabold text-2xl text-ink leading-tight">
          Upload Photos & Videos
        </h1>
        <p className="text-[10px] font-bold text-slate tracking-widest uppercase mt-1">
          STEP 2 OF 4
        </p>
      </div>

      <div className="px-6 flex flex-col gap-6 flex-1">
        <div className="flex flex-col gap-2.5">
          <div>
            <div className="flex justify-between items-center">
              <label className="font-display font-bold text-[15px] text-ink">
                Add Photos of your property
              </label>
              {attemptedNext && form.images.length === 0 && (
                <span className="text-[10px] text-rose-500 font-bold">Required (Add at least 1 photo)</span>
              )}
            </div>
            <p className="text-xs text-slate mt-0.5">Upload up to 12 high-quality photos.</p>
          </div>



          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotosSelected}
          />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotosSelected}
          />

          <div className="grid grid-cols-3 gap-3 mt-3">
            {form.images.map((file, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-2xl bg-slate-100 border border-charcoal/8 overflow-hidden shadow-sm"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Property photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 rounded-full p-1 transition-colors"
                  aria-label="Remove photo"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
            
            {form.images.length < 12 && (
              <button
                onClick={() => setShowSourceSelector(true)}
                className={`aspect-square rounded-2xl border-2 border-dashed bg-white flex flex-col items-center justify-center gap-1.5 transition-all shadow-sm ${
                  attemptedNext && form.images.length === 0
                    ? "border-rose-500 text-rose-500 bg-rose-50/5 shadow-rose-100"
                    : "border-charcoal/15 text-slate hover:border-sky-500 hover:text-sky-600"
                }`}
              >
                <Plus size={20} className={attemptedNext && form.images.length === 0 ? "text-rose-500" : "text-slate/60"} />
                <span className="text-[11px] font-semibold">
                  {form.images.length === 0 ? "Add Photo" : "Add More"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Field 2 - Videos Section */}
        <div className="flex flex-col gap-2.5">
          <div>
            <label className="font-display font-bold text-[15px] text-ink">
              Add Video (Optional)
            </label>
            <p className="text-xs text-slate mt-0.5">Add a property walkthrough video (max 100MB).</p>
          </div>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoSelected}
          />

          {form.video ? (
            <div className="flex items-center justify-between bg-emerald-50/40 rounded-xl border border-emerald-500/20 px-4 py-3.5 shadow-sm">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="bg-emerald-100 rounded-full p-1">
                  <Check size={14} className="text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-emerald-800 truncate">
                  {form.video.name}
                </span>
              </div>
              <button 
                type="button" 
                onClick={removeVideo}
                className="text-slate hover:text-coral transition-colors p-1"
                aria-label="Remove video"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => videoInputRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-charcoal/15 bg-white py-6 flex flex-col items-center gap-2 hover:border-sky-500 hover:text-sky-600 transition-colors shadow-sm"
            >
              <UploadCloud size={24} className="text-slate/50" />
              <span className="text-xs font-semibold text-charcoal">
                Upload Video
              </span>
              <span className="text-[10px] text-slate/60">MP4, Max 100MB</span>
            </button>
          )}
        </div>

        {/* Field 3 - YouTube Link Section */}
        <div className="flex flex-col gap-2.5">
          <div>
            <label className="font-display font-bold text-[15px] text-ink">
              YouTube Video Link (Optional)
            </label>
            <p className="text-xs text-slate mt-0.5">Paste a YouTube video link of your property tour.</p>
          </div>
          <input
            type="url"
            value={form.youtubeUrl}
            onChange={(e) => update({ youtubeUrl: e.target.value })}
            placeholder="e.g. https://www.youtube.com/watch?v=..."
            className="w-full bg-white rounded-xl border border-charcoal/15 px-4 py-3 text-sm text-ink placeholder-slate/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Footer next button container */}
      <div className="px-6 pb-8 pt-6">
        <button
          onClick={() => {
            setAttemptedNext(true);
            if (canContinue) {
              navigate("/add-property/more-info");
            } else {
              setTimeout(() => {
                const firstError = document.querySelector(".border-rose-500");
                if (firstError) {
                  firstError.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }, 100);
            }
          }}
          className="w-full py-4 rounded-xl font-display font-semibold text-[15px] transition-all shadow-md bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.99]"
        >
          Next
        </button>
      </div>

      {/* Crop Modal Overlay */}
      {selectedImageForCrop && (
        <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl w-full max-w-[360px] p-5 shadow-2xl flex flex-col gap-4 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-white">
                <Crop size={18} className="text-emerald-500" />
                <span className="font-display font-bold text-sm">Crop Property Photo</span>
              </div>
              <button 
                onClick={cancelCrop}
                className="text-white/60 hover:text-white p-1 hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Panning/Zooming Crop Viewport */}
            <div 
              className="w-full aspect-[4/3] relative overflow-hidden bg-black rounded-2xl border border-white/5 cursor-move touch-none"
              onPointerDown={(e) => {
                setIsDragging(true);
                setDragStart({ x: e.clientX, y: e.clientY });
                setPanStart({ x: pan.x, y: pan.y });
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!isDragging) return;
                const dx = e.clientX - dragStart.x;
                const dy = e.clientY - dragStart.y;
                setPan({ x: panStart.x + dx, y: panStart.y + dy });
              }}
              onPointerUp={(e) => {
                setIsDragging(false);
                e.currentTarget.releasePointerCapture(e.pointerId);
              }}
              onPointerCancel={(e) => {
                setIsDragging(false);
                e.currentTarget.releasePointerCapture(e.pointerId);
              }}
            >
              <img
                src={URL.createObjectURL(selectedImageForCrop)}
                alt="Image to crop"
                draggable={false}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center",
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                className="select-none pointer-events-none"
              />
              {/* Aspect grid lines helper */}
              <div className="absolute inset-0 border border-emerald-500/25 pointer-events-none grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white/10"></div>
                <div className="border-r border-b border-white/10"></div>
                <div className="border-b border-white/10"></div>
                <div className="border-r border-b border-white/10"></div>
                <div className="border-r border-b border-white/10"></div>
                <div className="border-b border-white/10"></div>
                <div className="border-r border-white/10"></div>
                <div className="border-r border-white/10"></div>
                <div></div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Drag to pan</span>
                <span>Zoom: {zoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={cancelCrop}
                className="py-3 rounded-xl border border-white/15 hover:bg-white/5 font-semibold text-xs text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCroppedImage}
                className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold text-xs text-white transition-colors shadow-lg active:scale-[0.98]"
              >
                Add Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Source Selector Bottom Drawer / Modal */}
      {showSourceSelector && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 flex flex-col justify-end"
          onClick={() => setShowSourceSelector(false)}
        >
          <div 
            className="bg-white rounded-t-3xl p-5 shadow-2xl animate-slide-up flex flex-col gap-4 max-w-[420px] mx-auto w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-charcoal/6 pb-2.5">
              <span className="font-display font-bold text-sm text-black">Add Photo Option</span>
              <button 
                onClick={() => setShowSourceSelector(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-all"
                aria-label="Close"
              >
                <X size={18} className="text-charcoal" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5 py-2">
              <button
                type="button"
                onClick={() => {
                  setShowSourceSelector(false);
                  cameraInputRef.current?.click();
                }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-charcoal/5 hover:border-emerald-600/30 transition-all gap-2"
              >
                <div className="p-3 rounded-full bg-emerald-50 text-emerald-600">
                  <Camera size={20} />
                </div>
                <span className="text-xs font-bold text-ink">Take Photo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSourceSelector(false);
                  photoInputRef.current?.click();
                }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-charcoal/5 hover:border-emerald-600/30 transition-all gap-2"
              >
                <div className="p-3 rounded-full bg-sky-50 text-sky-600">
                  <UploadCloud size={20} />
                </div>
                <span className="text-xs font-bold text-ink">Upload from Gallery</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
