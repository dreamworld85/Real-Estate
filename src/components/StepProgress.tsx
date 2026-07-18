export default function StepProgress({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center gap-2 px-4 pb-5">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex items-center flex-1 last:flex-none">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
              n === step
                ? "bg-ink text-cream"
                : n < step
                ? "bg-forest/15 text-forest"
                : "bg-sage text-slate"
            }`}
          >
            {n}
          </div>
          {n !== 4 && (
            <div
              className={`h-0.5 flex-1 mx-1.5 rounded ${
                n < step ? "bg-forest/30" : "bg-sage"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
