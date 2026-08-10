import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import { Mail, Phone, MapPin, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { api } from "../../lib/api";

export default function ContactUs() {
  const [email, setEmail] = useState("support@greensparrows.com");
  const [phone, setPhone] = useState("+91 484 2901234 (10 AM - 6 PM)");
  const [address, setAddress] = useState("GreenSparrows Ventures Private Limited,\nSkyline Signature Heights, Kakkanad,\nKochi, Kerala - 682030");

  useEffect(() => {
    api.fetchSetting("contact_email")
      .then(d => { if (d && d.value) setEmail(d.value); })
      .catch(e => console.error("Error fetching email:", e));

    api.fetchSetting("contact_phone")
      .then(d => { if (d && d.value) setPhone(d.value); })
      .catch(e => console.error("Error fetching phone:", e));

    api.fetchSetting("contact_address")
      .then(d => { if (d && d.value) setAddress(d.value); })
      .catch(e => console.error("Error fetching address:", e));
  }, []);

  return (
    <div className="min-h-screen pb-28 bg-cream">
      <Header title="Contact Us" showBack />
      
      <div className="p-5 flex flex-col gap-4 text-xs text-slate leading-relaxed">
        {/* Support Channels */}
        <div className="bg-white rounded-3xl p-5 border border-charcoal/5 shadow-sm flex flex-col gap-4">
          <div className="flex gap-3 items-start border-b border-slate-100 pb-3">
            <Mail className="text-forest mt-0.5" size={16} />
            <div className="text-left">
              <p className="font-bold text-charcoal">Support & Billing Email</p>
              <p className="text-[11px] text-slate/75">{email}</p>
            </div>
          </div>

          <div className="flex gap-3 items-start border-b border-slate-100 pb-3">
            <Phone className="text-forest mt-0.5" size={16} />
            <div className="text-left">
              <p className="font-bold text-charcoal">Phone Hotline</p>
              <p className="text-[11px] text-slate/75">{phone}</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <MapPin className="text-forest mt-0.5" size={16} />
            <div className="text-left">
              <p className="font-bold text-charcoal">Registered Enterprise Office</p>
              <p className="text-[11px] text-slate/75 leading-normal mt-0.5 whitespace-pre-line">
                {address}
              </p>
            </div>
          </div>
        </div>

        {/* Razorpay Compliance Badge Section */}
        <div className="bg-ink text-cream rounded-3xl p-5 flex flex-col items-center text-center gap-3 shadow-md">
          <div className="flex gap-2.5 text-gold mb-1">
            <ShieldCheck size={22} />
            <Lock size={22} />
          </div>
          <h4 className="font-display font-extrabold text-sm text-white">Secure Payments via Razorpay</h4>
          <p className="text-[10px] text-cream/70 leading-relaxed max-w-[280px]">
            Your payment processing is strictly PCI-DSS Compliant. Your transaction is safeguarded by 256-bit secure SSL encryption tunnels.
          </p>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-[9px] font-bold mt-1 text-gold">
            <CheckCircle2 size={12} className="text-gold" />
            <span>Verified Merchant Checkout</span>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
