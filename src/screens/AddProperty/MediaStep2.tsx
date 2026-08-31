import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Plus, UploadCloud, X, Check, Camera, Crop, ChevronLeft } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
import BottomNav from "@/components/BottomNav";
import StepProgress from "@/components/StepProgress";
import { api } from "@/lib/api";

export default function MediaStep2() {
  const navigate = useNavigate();
  const { form, update } = useAddProperty();
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [whatsappLink, setWhatsappLink] = useState("https://wa.me/917012021221");

  useEffect(() => {
    api.fetchSetting("admin_contact_number")
      .then((data) => {
        if (data && data.value) {
          const cleanNum = data.value.replace(/\D/g, "");
          setWhatsappLink(`https://wa.me/${cleanNum.startsWith("91") ? cleanNum : `91${cleanNum}`}`);
        }
      })
      .catch((err) => console.error("Error loading admin contact number:", err));
  }, []);

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
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    const videoFiles = files.filter(f => f.type.startsWith("video/"));
    
    if (videoFiles.length > 0) {
      const selectedVideo = videoFiles[0];
      if (selectedVideo.size > 100 * 1024 * 1024) {
        alert("Video file size must be less than 100MB.");
      } else {
        update({ video: selectedVideo });
      }
    }
    
    if (imageFiles.length > 0) {
      const [first, ...rest] = imageFiles;
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
          update((prev) => ({ images: [...prev.images, croppedFile].slice(0, 12) }));
          
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
    <div className="min-h-screen flex flex-col bg-white pb-24 text-left font-display select-none overflow-x-hidden relative">
      {/* Top Blue Progress Bar Line (100% completed) */}
      <div className="w-full h-1 bg-slate-100 flex shrink-0">
        <div className="h-full bg-[#59AD63] w-[100%] transition-all duration-300" />
      </div>

      {/* Header Row */}
      <div className="flex justify-between items-center px-6 pt-5 pb-2 shrink-0">
        <button 
          type="button"
          onClick={() => navigate("/add-property/more-info")}
          className="text-charcoal p-1.5 -ml-1.5 hover:bg-charcoal/5 rounded-full transition-all duration-200 cursor-pointer active:scale-95"
          aria-label="Back"
        >
          <ChevronLeft size={22} className="text-[#091F40]" />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="font-bold text-sm text-[#091F40]">Property Media</span>
          <span className="text-[9px] font-bold text-slate/50 tracking-wider uppercase leading-none mt-0.5">
            Step 3 of 3
          </span>
        </div>

        <a 
          href={whatsappLink} 
          target="_blank" 
          rel="noreferrer" 
          className="flex items-center gap-1 text-[11.5px] font-bold text-[#59AD63] hover:underline"
        >
          <span>Need Help?</span>
          <svg className="w-4 h-4 text-[#25D366] fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.516.002 10.003-4.484 10.006-9.998.002-2.673-1.039-5.187-2.932-7.082C16.43 1.63 13.918.585 11.244.585 5.729.585 1.24 5.07 1.238 10.586c-.001 1.516.398 2.998 1.157 4.312L1.336 21.05l6.311-1.657-.001-.239zM18.06 14.86c-.329-.165-1.953-.965-2.253-1.074-.3-.109-.519-.165-.738.165-.219.329-.848 1.074-1.039 1.293-.19.219-.382.246-.71.082-1.393-.697-2.316-1.229-3.232-2.81-.242-.415.242-.385.693-1.284.076-.153.038-.287-.019-.396-.057-.109-.519-1.25-.71-1.71-.186-.447-.376-.386-.519-.393-.134-.007-.288-.008-.442-.008-.154 0-.404.058-.616.287-.211.23-.807.788-.807 1.921 0 1.134.826 2.23.94 2.385.115.155 1.625 2.483 3.937 3.48.55.237 1.03.396 1.385.508.558.177 1.066.152 1.468.092.448-.067 1.953-.799 2.228-1.573.275-.774.275-1.439.192-1.573-.082-.134-.3-.213-.629-.379z"/>
          </svg>
        </a>
      </div>

      <div className="px-6 flex flex-col gap-6 mt-3 flex-1">
        {/* Title */}
        <h1 className="font-display font-extrabold text-[18px] text-[#091F40] leading-none">
          Upload Photos & Videos
        </h1>

        {/* Section 1: Photos */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center px-0.5">
            <label className="text-sm font-bold text-[#091F40]">
              Property Photos
            </label>
            {attemptedNext && form.images.length === 0 && (
              <span className="text-[11px] text-rose-500 font-bold">Required</span>
            )}
          </div>
          <p className="text-[11px] text-slate/50 leading-none px-0.5 -mt-1">Upload up to 12 property photos.</p>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*,video/*"
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

          <div className="grid grid-cols-4 gap-2.5 mt-1">
            {form.images.map((file, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-[8px] bg-slate-100 border border-charcoal/8 overflow-hidden shadow-sm transition-all"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Property photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 rounded-full p-0.5 transition-colors cursor-pointer"
                  aria-label="Remove photo"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
            
            {form.images.length < 12 && (
              <button
                type="button"
                onClick={() => setShowSourceSelector(true)}
                className={`aspect-square rounded-[8px] border border-dashed flex flex-col items-center justify-center gap-1 transition-all shadow-sm cursor-pointer ${
                  attemptedNext && form.images.length === 0
                    ? "border-rose-500 text-rose-500 bg-rose-50/5 shadow-rose-100"
                    : "border-[#59AD63]/30 text-slate hover:border-[#59AD63] hover:text-[#59AD63] bg-white"
                }`}
              >
                <Plus size={16} className={attemptedNext && form.images.length === 0 ? "text-rose-500" : "text-slate/40"} />
                <span className="text-[9px] font-bold uppercase tracking-wider">
                  {form.images.length === 0 ? "Add" : "More"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Section 2: Walkthrough Video */}
        <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-4 mt-2">
          <label className="text-sm font-bold text-[#091F40] px-0.5">
            Walkthrough Video (Optional)
          </label>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoSelected}
          />

          {form.video ? (
            <div className="flex items-center justify-between bg-emerald-50 rounded-[8px] border border-emerald-100 px-4 py-3 shadow-sm mt-1">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="bg-emerald-100 rounded-full p-0.5">
                  <Check size={12} className="text-[#25D366]" />
                </div>
                <span className="text-xs font-semibold text-emerald-800 truncate">
                  {form.video.name}
                </span>
              </div>
              <button 
                type="button" 
                onClick={removeVideo}
                className="text-slate hover:text-rose-500 transition-colors p-1 cursor-pointer"
                aria-label="Remove video"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="w-full rounded-[8px] border border-dashed border-[#59AD63]/30 bg-white py-4 flex items-center justify-center gap-2.5 hover:border-[#59AD63] hover:bg-[#F0F8FF] transition-all shadow-sm cursor-pointer mt-1"
            >
              <UploadCloud size={18} className="text-slate/50" />
              <div className="text-left">
                <span className="text-[11.5px] font-bold text-charcoal block">Upload Walkthrough Video</span>
                <span className="text-[9px] text-slate/40 block">MP4 format (Max 100MB)</span>
              </div>
            </button>
          )}
        </div>

        {/* Section 3: YouTube Link */}
        <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-4 mt-2">
          <label className="text-sm font-bold text-[#091F40] px-0.5">
            YouTube Video Link (Optional)
          </label>
          <input
            type="url"
            value={form.youtubeUrl}
            onChange={(e) => update({ youtubeUrl: e.target.value })}
            placeholder="e.g. https://www.youtube.com/watch?v=..."
            className="w-full h-[50px] rounded-[8px] bg-white border border-[#59AD63]/30 px-4 text-[13.5px] font-semibold text-charcoal placeholder:text-slate/30 focus:border-[#59AD63] focus:ring-1 focus:ring-[#59AD63]/30 outline-none transition-all mt-1"
          />
        </div>

        {/* Post & Review Action Button */}
        <div className="mt-6 pb-6">
          <button
            onClick={() => {
              setAttemptedNext(true);
              if (canContinue) {
                navigate("/add-property/map-picker");
              } else {
                setTimeout(() => {
                  const firstError = document.querySelector(".border-rose-500");
                  if (firstError) {
                    firstError.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }, 100);
              }
            }}
            className="w-full py-4 rounded-[2px] font-display font-bold text-[14px] text-white bg-[#59AD63] hover:bg-[#3F8F4B] transition-all duration-200 cursor-pointer active:scale-98 shadow-sm shadow-[#59AD63]/10 flex items-center justify-center"
          >
            Continue to Review
          </button>
        </div>
      </div>

      {/* Crop Modal Overlay */}
      {selectedImageForCrop && (
        <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="bg-slate-900 rounded-[8px] w-full max-w-[360px] p-5 shadow-2xl flex flex-col gap-4 border border-white/10">
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
                className="py-3 rounded-[2px] border border-white/15 hover:bg-white/5 font-semibold text-xs text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCroppedImage}
                className="py-3 rounded-[2px] bg-emerald-600 hover:bg-emerald-700 font-semibold text-xs text-white transition-colors shadow-lg active:scale-[0.98]"
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
            className="bg-white rounded-t-[8px] p-5 shadow-2xl animate-slide-up flex flex-col gap-4 max-w-[420px] mx-auto w-full"
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
                className="flex flex-col items-center justify-center p-4 rounded-[8px] bg-slate-50 border border-charcoal/5 hover:border-emerald-600/30 transition-all gap-2"
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
                className="flex flex-col items-center justify-center p-4 rounded-[8px] bg-slate-50 border border-charcoal/5 hover:border-emerald-600/30 transition-all gap-2"
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
