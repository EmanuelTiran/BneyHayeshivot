import { useEffect, useState } from 'react';
import { fetchCommemorations } from '../services/api';

// אייקון ברירת מחדל כאשר אין תמונה
const PlaceholderIcon = () => (
  <div className="w-full h-48 bg-gradient-to-br from-[#0d2340] to-[#1a365d] flex items-center justify-center">
    <svg
      className="w-20 h-20 text-[#cfa756] opacity-60"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
           2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
           C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
           c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
  </div>
);

// כרטיס הנצחה בודד
function CommemorationCard({ item }) {
  const formattedDate = new Date(item.date).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedAmount = new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
  }).format(item.amount);

  return (
    <div
      dir="rtl"
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 flex flex-col"
    >
      {/* תמונה */}
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={`הנצחת ${item.commemoratedName}`}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      {/* ברירת מחדל אם אין תמונה או שהתמונה נשברה */}
      <div style={{ display: item.imageUrl ? 'none' : 'flex' }} className="w-full h-48 bg-gradient-to-br from-[#0d2340] to-[#1a365d] items-center justify-center">
        <svg
          className="w-20 h-20 text-[#cfa756] opacity-60"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
               2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
               C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
               c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
      </div>

      {/* גוף הכרטיס */}
      <div className="p-5 flex flex-col flex-1">
        {/* שם הפריט */}
        <h3 className="text-lg font-bold text-[#0d2340] mb-3 border-b border-[#cfa756]/30 pb-2">
          {item.itemName}
        </h3>

        {/* פרטי ההנצחה */}
        <div className="space-y-2 text-sm text-gray-700 flex-1">
          <div className="flex items-start gap-2">
            <span className="text-[#cfa756] font-bold min-w-[90px]">לעילוי נשמת:</span>
            <span className="font-semibold text-[#0d2340]">{item.commemoratedName}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#cfa756] font-bold min-w-[90px]">נתרם ע"י:</span>
            <span>{item.contributorName}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#cfa756] font-bold min-w-[90px]">סכום:</span>
            <span className="font-medium">{formattedAmount}</span>
          </div>
        </div>

        {/* תאריך */}
        <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100 text-left">
          {formattedDate}
        </p>
      </div>
    </div>
  );
}

// עמוד ראשי
export default function Commemorations() {
  const [commemorations, setCommemorations] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);

  useEffect(() => {
    fetchCommemorations()
      .then((res) => setCommemorations(res.data))
      .catch(() => setError('אירעה שגיאה בטעינת ההנצחות. אנא נסה שוב מאוחר יותר.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* כותרת עמוד */}
      <div className="bg-gradient-to-r from-[#0d2340] to-[#1a365d] py-12 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-[#cfa756] mb-2">לוח הנצחות</h1>
        <p className="text-[#f7f4e9]/80 text-base md:text-lg">
          הנצחות ותרומות לעילוי נשמת יקירינו
        </p>
        <div className="w-20 h-1 bg-[#cfa756] mx-auto mt-4 rounded-full" />
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* מצב טעינה */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-[#cfa756] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* שגיאה */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center max-w-md mx-auto">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* ריק */}
        {!loading && !error && commemorations.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <p className="text-lg">אין הנצחות להצגה כרגע</p>
          </div>
        )}

        {/* רשת הכרטיסים */}
        {!loading && !error && commemorations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {commemorations.map((item) => (
              <CommemorationCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
