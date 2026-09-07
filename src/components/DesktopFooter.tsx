import { useNavigate } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

export default function DesktopFooter() {
  const navigate = useNavigate();

  return (
    <footer className="w-full bg-[#182623] text-white pt-12 pb-8 px-8 border-t border-gray-800 font-sans mt-auto select-none">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Top 3-Column Section matching user mockup media_1788721045135.png */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Column 1: Logo & Description (5 Columns) */}
          <div className="md:col-span-5 flex flex-col gap-4 text-left">
            <div 
              onClick={() => navigate("/")} 
              className="flex items-center cursor-pointer select-none shrink-0 w-fit"
            >
              <img 
                src="/brand_logo-web.png" 
                alt="Brand Logo" 
                className="h-10 sm:h-11 w-auto object-contain brightness-110"
              />
            </div>
            <p className="text-xs text-gray-300 leading-relaxed max-w-md font-medium">
              Discover, buy, and lease properties across Kerala. GreenReal is the premier real estate platform connecting buyers and verified listing promoters.
            </p>
          </div>

          {/* Column 2: Legal Policies (3 Columns) */}
          <div className="md:col-span-3 flex flex-col gap-3 text-left">
            <h4 className="text-[#C89B3C] font-bold uppercase tracking-wider text-xs">
              Legal Policies
            </h4>
            <div className="flex flex-col gap-2.5 text-xs font-medium text-gray-300">
              <span 
                onClick={() => navigate("/privacy")} 
                className="hover:text-white transition-colors cursor-pointer w-fit"
              >
                Privacy Policy
              </span>
              <span 
                onClick={() => navigate("/terms")} 
                className="hover:text-white transition-colors cursor-pointer w-fit"
              >
                Terms & Conditions
              </span>
              <span 
                onClick={() => navigate("/refund")} 
                className="hover:text-white transition-colors cursor-pointer w-fit"
              >
                Refund Policy
              </span>
            </div>
          </div>

          {/* Column 3: Customer Support (4 Columns) */}
          <div className="md:col-span-4 flex flex-col gap-3 text-left">
            <h4 className="text-[#C89B3C] font-bold uppercase tracking-wider text-xs">
              Customer Support
            </h4>
            <div className="flex flex-col gap-2.5 text-xs text-gray-300 font-medium">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#C89B3C] shrink-0" />
                <span>support@greensparrows.com</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#C89B3C] shrink-0" />
                <span>+91 484 2901234 (10 AM - 6 PM)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C89B3C] shrink-0 mt-0.5" />
                <span>Green Sparrows, Infopark Phase II, Kochi, Kerala</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div className="w-full h-[1px] bg-gray-800/80" />

        {/* Bottom Bar Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-400 font-medium">
          <p>© {new Date().getFullYear()} Kerala Realty. All rights reserved. Managed by Green Sparrows.</p>
          <div className="flex items-center gap-6">
            <span>Standard SSL Secured checkout</span>
            <span>Certified payment processes</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
