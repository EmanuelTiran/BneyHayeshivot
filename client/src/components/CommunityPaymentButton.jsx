import React from 'react';
import { CreditCard, ArrowLeft } from 'lucide-react';

const CommunityPaymentButton = () => {
  return (
    <div 
      // המעטפת הותאמה בדיוק לרוחב ולריווח של הקומפוננטה השנייה: max-w-md, mx-auto, my-8, rounded-xl
      className="bg-[#162641] rounded-xl p-6  max-w-md w-full mx-auto my-8 flex items-center justify-center shadow-lg"
      dir="rtl"
    >
      <a
        href="https://www.matara.pro/nedarimplus/online/?mosad=7011308"
        target="_blank"
        rel="noopener noreferrer"
        // הכפתור עצמו נשאר באותו עיצוב שביקשת
        className="group relative flex w-full sm:w-auto items-center justify-center gap-3 px-8 py-4 bg-[#f7f4e9] text-[#162641] font-bold text-lg tracking-wide rounded-full border-2 border-[#d3a84e] overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(211,168,78,0.15)] hover:shadow-[0_0_25px_rgba(211,168,78,0.35)]"
      >
        {/* אפקט הברקה */}
        <div className="absolute inset-0 w-full h-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-[#d3a84e]/30 to-transparent -skew-x-12 translate-x-[150%] group-hover:-translate-x-[150%]" />

        <span className="relative z-10 flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-[#d3a84e]" strokeWidth={2.5} />
          לתשלומי הקהילה
          <ArrowLeft 
            className="w-5 h-5 text-[#d3a84e] transition-transform duration-300 group-hover:-translate-x-1.5" 
            strokeWidth={2.5} 
          />
        </span>
      </a>
    </div>
  );
};

export default CommunityPaymentButton;