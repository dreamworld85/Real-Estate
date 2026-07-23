import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-charcoal/6 px-6 py-8 mt-12 text-center pb-24">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-1.5 font-display font-bold text-ink">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Kerala Realty</span>
        </div>
        <p className="text-xs text-slate max-w-[280px] leading-relaxed">
          Find your dream home, villa, land, or commercial space across Kerala's finest locations.
        </p>
        <div className="flex items-center gap-4 text-xs font-semibold text-forest">
          <Link to="/settings" className="hover:underline">Terms</Link>
          <span className="text-charcoal/10">&bull;</span>
          <Link to="/settings" className="hover:underline">Privacy</Link>
          <span className="text-charcoal/10">&bull;</span>
          <Link to="/settings" className="hover:underline">Support</Link>
        </div>
        <p className="text-[11px] text-slate/60 mt-2">
          &copy; {new Date().getFullYear()} Kerala Realty. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
