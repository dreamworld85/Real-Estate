import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer 
      className="bg-white border-t border-gray-200 px-6 pt-8 pb-24 mt-12 text-center select-none relative"
      style={{
        backgroundImage: "url('/images/footer-image.png')",
        backgroundRepeat: "repeat-x",
        backgroundPosition: "bottom center",
        backgroundSize: "auto 70px",
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-1.5 font-display font-bold text-gray-900">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#60A963]">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Kerala Realty</span>
        </div>
        <p className="text-xs text-gray-600 max-w-[280px] leading-relaxed">
          Find your dream home, villa, land, or commercial space across Kerala's finest locations.
        </p>
        <div className="flex items-center gap-4 text-xs font-semibold text-gray-900">
          <Link to="/terms" className="text-gray-900 hover:text-[#60A963] transition-colors">Terms</Link>
          <span className="text-gray-300">&bull;</span>
          <Link to="/privacy" className="text-gray-900 hover:text-[#60A963] transition-colors">Privacy</Link>
          <span className="text-gray-300">&bull;</span>
          <Link to="/contact-us" className="text-gray-900 hover:text-[#60A963] transition-colors">Support</Link>
        </div>
        <p className="text-[11px] text-gray-500 mt-2">
          &copy; {new Date().getFullYear()} Kerala Realty. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
