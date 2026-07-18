import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="min-h-screen pb-24">
      <Header title={title} showBack />
      <div className="flex flex-col items-center justify-center text-center px-8 py-24">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mb-4">
          <path
            d="M4 60C10 34 26 6 60 4C54 30 38 58 4 60Z"
            fill="#E8F0EA"
            stroke="#1B5E4F"
            strokeWidth="1.5"
          />
        </svg>
        <p className="font-display font-semibold text-ink">
          {title} is next in line
        </p>
        <p className="text-sm text-slate mt-1">
          This screen will be built once the current one is approved.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
