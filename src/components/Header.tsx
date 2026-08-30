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
    <header className="sticky top-0 z-10 flex items-center justify-between bg-cream/95 backdrop-blur px-4 py-4.5 mt-2">
      <div className="flex items-center gap-1.5 -ml-1">
        {showBack && (
          <button onClick={() => navigate(-1)} aria-label="Go back" className="cursor-pointer p-0.5 active:scale-95 transition-all">
            <ChevronLeft size={22} className="text-black" />
          </button>
        )}
        <h1 className="font-display font-medium text-[14px] text-black">{title}</h1>
      </div>
      {trailing}
    </header>
  );
}
