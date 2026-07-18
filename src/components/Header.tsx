import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  trailing?: ReactNode;
}

export default function Header({ title, showBack, trailing }: HeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-cream/95 backdrop-blur px-4 py-4 border-b border-charcoal/5">
      <div className="flex items-center gap-2">
        {showBack && (
          <button onClick={() => navigate(-1)} aria-label="Go back">
            <ChevronLeft size={22} className="text-ink" />
          </button>
        )}
        <h1 className="font-display font-bold text-lg text-ink">{title}</h1>
      </div>
      {trailing}
    </header>
  );
}
