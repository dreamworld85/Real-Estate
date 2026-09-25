import { useNavigate } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

export default function DesktopFooter() {
  const navigate = useNavigate();

  return (
    <footer 
      className="w-full bg-white text-gray-700 pt-12 pb-44 px-8 border-t border-gray-200 font-sans mt-auto select-none relative"
      style={{
        backgroundImage: "url('/images/footer-image.png')",
        backgroundRepeat: "repeat-x",
        backgroundPosition: "bottom center",
        backgroundSize: "auto 166px",
      }}
    >
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
                className="h-10 sm:h-11 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-gray-600 leading-relaxed max-w-md font-medium">
              Discover, buy, and lease properties across Kerala. GreenReal is the premier real estate platform connecting buyers and verified listing promoters.
            </p>
          </div>

          {/* Column 2: Legal Policies (3 Columns) */}
          <div className="md:col-span-3 flex flex-col gap-3 text-left">
            <h4 className="text-gray-900 font-bold uppercase tracking-wider text-xs">
              Legal Policies
            </h4>
            <div className="flex flex-col gap-2.5 text-xs font-semibold text-gray-900">
              <span 
                onClick={() => navigate("/services")} 
                className="text-gray-900 hover:text-[#60A963] transition-colors cursor-pointer w-fit"
              >
                Our Services (Plans)
              </span>
              <span 
                onClick={() => navigate("/privacy")} 
                className="text-gray-900 hover:text-[#60A963] transition-colors cursor-pointer w-fit"
              >
                Privacy Policy
              </span>
              <span 
                onClick={() => navigate("/terms")} 
                className="text-gray-900 hover:text-[#60A963] transition-colors cursor-pointer w-fit"
              >
                Terms & Conditions
              </span>
              <span 
                onClick={() => navigate("/refund")} 
                className="text-gray-900 hover:text-[#60A963] transition-colors cursor-pointer w-fit"
              >
                Refund Policy
              </span>
            </div>
          </div>

          {/* Column 3: Customer Support (4 Columns) */}
          <div className="md:col-span-4 flex flex-col gap-3 text-left">
            <h4 className="text-gray-900 font-bold uppercase tracking-wider text-xs">
              Customer Support
            </h4>
            <div className="flex flex-col gap-2.5 text-xs text-gray-700 font-medium">
              <a 
                href="mailto:support@greensparrows.com" 
                className="flex items-center gap-2.5 text-gray-900 hover:text-[#60A963] transition-colors cursor-pointer w-fit"
              >
                <Mail className="w-4 h-4 text-[#60A963] shrink-0" />
                <span>support@greensparrows.com</span>
              </a>
              <a 
                href="tel:+914842901234" 
                className="flex items-center gap-2.5 text-gray-900 hover:text-[#60A963] transition-colors cursor-pointer w-fit"
              >
                <Phone className="w-4 h-4 text-[#60A963] shrink-0" />
                <span>+91 484 2901234 (10 AM - 6 PM)</span>
              </a>
              <div className="flex items-start gap-2.5 text-gray-700">
                <MapPin className="w-4 h-4 text-[#60A963] shrink-0 mt-0.5" />
                <span>Green Sparrows, Infopark Phase II, Kochi, Kerala</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div className="w-full h-[1px] bg-gray-200/90" />

        {/* Bottom Bar Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-600 font-medium">
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
