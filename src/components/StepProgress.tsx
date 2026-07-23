export default function StepProgress({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center gap-2 px-6 pb-5">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex items-center flex-1 last:flex-none">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
              n === step
                ? "bg-emerald-600 text-white"
                : n < step
                ? "bg-emerald-50 text-emerald-600"
                : "bg-slate-200 text-slate-400"
            }`}
          >
            {n}
          </div>
          {n !== 4 && (
            <div
              className={`h-0.5 flex-1 mx-1.5 rounded ${
                n < step ? "bg-emerald-600/30" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
