import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchItemById, submitSponsorshipRequest } from '../services/portalService';
import {ROUTES} from '../constants/routes';
import CommunityPaymentButton from '../components/CommunityPaymentButton';

const DEDICATION_TYPES = ['לזכות', 'לעילוי נשמת', 'לרפואת', 'לעילוי נשמת ולהצלחת', 'אחר'];

function SuccessBanner({ onClose }) {
  return (
    <div className="fixed inset-0 bg-[#0d2340]/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-[#cfa756] p-8 max-w-sm w-full text-center" dir="rtl">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-[#0d2340] mb-2">בקשתך נשלחה!</h3>
        <p className="text-gray-600 mb-6 text-sm">הגבאי יצור עמך קשר בהקדם לאישור הבקשה. תודה רבה!</p>
        <button onClick={onClose} className="bg-[#0d2340] text-[#cfa756] font-bold px-6 py-2.5 rounded-lg hover:bg-[#1a365d] w-full">
          סגור
        </button>
      </div>
    </div>
  );
}

export default function PortalItem() {
  const { itemId } = useParams();
  const navigate   = useNavigate();
  const [item, setItem]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [sending, setSending]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', email: '', dedicationType: 'לזכות', dedicationName: '', adminNote: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchItemById(itemId);
        setItem(res.data);
      } catch { setError('שגיאה בטעינת הפריט'); }
      finally { setLoading(false); }
    };
    load();
  }, [itemId]);

  const handleSubmit = async () => {
    setFormError('');
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      setFormError('נא למלא את כל השדות המסומנים');
      return;
    }
    setSending(true);
    try {
      await submitSponsorshipRequest({
        ...form,
        itemId,
        categoryId: item.categoryId?._id || item.categoryId,
      });
      setSuccess(true);
      setForm({ name: '', phone: '', email: '', dedicationType: 'לזכות', dedicationName: '', adminNote: '' });
    } catch { setFormError('שגיאה בשליחה — נסה שוב'); }
    finally { setSending(false); }
  };

  if (loading) return <div dir="rtl" className="text-center py-20">טוען...</div>;
  if (error)   return <div dir="rtl" className="text-center py-20 text-red-600">{error}</div>;
  if (!item)   return null;

  const categoryId = item.categoryId?._id || item.categoryId;

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f4e9]">
      <div className="bg-gradient-to-b from-[#0d2340] to-[#1a365d] py-10 px-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate(ROUTES.PORTAL_CATEGORY.replace(':categoryId', categoryId))}
            className="text-[#cfa756] text-sm mb-4 flex items-center gap-1 hover:underline">
            → חזרה לרשימה
          </button>
          <h1 className="text-3xl font-bold text-[#cfa756]">{item.title}</h1>
          {item.date && <p className="text-[#f7f4e9]/70 mt-1">📅 {item.date}</p>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-xl shadow border border-[#cfa756]/30 p-6">
          <div className="h-1 -mt-6 -mx-6 mb-5 bg-gradient-to-r from-[#0d2340] via-[#cfa756] to-[#0d2340] rounded-t-xl" />
          {item.description && <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">{item.description}</p>}
          {item.price > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-gray-500">סכום תמיכה מומלץ:</span>
              <span className="text-lg font-bold text-[#0d2340] bg-[#cfa756]/15 border border-[#cfa756] px-3 py-0.5 rounded-full">
                ₪{item.price}
              </span>
            </div>
          )}
          {!item.available && <p className="mt-4 text-sm text-red-500 font-medium">⚠️ פריט זה אינו זמין כרגע לתמיכה</p>}
        </div>

        {item.available && (
          <div className="bg-white rounded-xl shadow border border-[#cfa756]/30 p-6">
            <div className="h-1 -mt-6 -mx-6 mb-5 bg-gradient-to-r from-[#cfa756] via-[#0d2340] to-[#cfa756] rounded-t-xl" />
            <h2 className="text-xl font-bold text-[#0d2340] mb-5">📝 טופס הקדשה / תמיכה</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#0d2340]">שם מלא *</label>
                <input className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#cfa756] outline-none"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ישראל ישראלי" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-[#0d2340]">טלפון *</label>
                  <input type="tel" dir="ltr"
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#cfa756] outline-none"
                    value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="050-0000000" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-[#0d2340]">אימייל *</label>
                  <input type="email" dir="ltr"
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#cfa756] outline-none"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#0d2340]">סוג ההנצחה</label>
                <select className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#cfa756] outline-none bg-white"
                  value={form.dedicationType} onChange={(e) => setForm({ ...form, dedicationType: e.target.value })}>
                  {DEDICATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#0d2340]">שם לציון בהנצחה</label>
                <input className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#cfa756] outline-none"
                  value={form.dedicationName} onChange={(e) => setForm({ ...form, dedicationName: e.target.value })} placeholder="לדוג': חנה בת רות" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#0d2340]">הערה לגבאי</label>
                <textarea className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#cfa756] outline-none"
                  rows={3} value={form.adminNote} onChange={(e) => setForm({ ...form, adminNote: e.target.value })}
                  placeholder="פרטים נוספים, בקשות מיוחדות..." />
              </div>
              <CommunityPaymentButton />
              {formError && <p className="text-red-600 text-sm font-medium">{formError}</p>}
              <button onClick={handleSubmit} disabled={sending}
                className="w-full bg-[#0d2340] text-[#cfa756] font-bold py-3 rounded-lg hover:bg-[#1a365d] disabled:opacity-50 shadow-md text-base">
                {sending ? '⏳ שולח...' : '📤 שלח בקשת הנצחה'}
              </button>
            </div>
          </div>
        )}
      </div>
      {success && <SuccessBanner onClose={() => navigate(ROUTES.PORTAL)} />}
    </div>
  );
}