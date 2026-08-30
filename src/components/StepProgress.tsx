export default function StepProgress({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center gap-2 px-6 pb-5">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex items-center flex-1 last:flex-none">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 shadow-sm transition-all duration-300 ${
              n === step
                ? "bg-[#60A963] text-white shadow-md shadow-[#60A963]/20"
                : n < step
                ? "bg-[#60A963]/15 text-[#60A963] font-bold"
                : "bg-slate-200 text-slate-400"
            }`}
          >
            {n}
          </div>
          {n !== 4 && (
            <div
              className={`h-0.5 flex-1 mx-1.5 rounded transition-all duration-300 ${
                n < step ? "bg-[#60A963]/40" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
