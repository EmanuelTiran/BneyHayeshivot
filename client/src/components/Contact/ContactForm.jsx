// components/Contact/ContactForm.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { sendContactMessage } from '../../services/api';

export default function ContactForm() {
  const { user, isAuthenticated,  loading: authLoading } = useAuth(); // ← הוסף loading

  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await sendContactMessage({
        name: user.name,
        email: user.email,
        message,
      });
      setSubmitted(true);
      setMessage('');
    } catch {
      setError('שגיאה בשליחת ההודעה, נסה שוב');
    } finally {
      setSubmitting(false);
    }
  };
  if (authLoading) {
    return (
      <div dir="rtl" className="max-w-lg mx-auto py-8 px-4">
        <div className="bg-white rounded-xl border border-[#cfa756]/30 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-[#0d2340] to-[#1a365d] px-5 py-3 flex items-center gap-2">
            <span className="text-[#cfa756] text-xl">✉️</span>
            <h2 className="text-[#f7f4e9] font-bold text-lg">צור קשר</h2>
          </div>
          <div className="p-8 text-center text-gray-400">טוען...</div>
        </div>
      </div>
    );
  }
  // ── לא מחובר ─────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div dir="rtl" className="max-w-lg mx-auto py-8 px-4">
        <div className="bg-white rounded-xl border border-[#cfa756]/30 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-[#0d2340] to-[#1a365d] px-5 py-3 flex items-center gap-2">
            <span className="text-[#cfa756] text-xl">✉️</span>
            <h2 className="text-[#f7f4e9] font-bold text-lg">צור קשר</h2>
          </div>
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-[#0d2340] font-semibold text-lg mb-2">
              כדי לשלוח הודעה למנהל, עליך להתחבר למערכת
            </p>
            <p className="text-gray-500 text-sm mb-6">
              ההתחברות מאפשרת לנו לזהות אותך ולחזור אליך בהקדם
            </p>
            <Link
              to="/login"
              className="inline-block bg-gradient-to-r from-[#cfa756] to-[#b8860b] text-[#0d2340] font-bold px-8 py-2.5 rounded-lg hover:scale-105 transition-transform shadow-sm"
            >
              התחבר למערכת
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── נשלח בהצלחה ──────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div dir="rtl" className="max-w-lg mx-auto py-8 px-4">
        <div className="bg-white rounded-xl border border-[#cfa756]/30 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-[#0d2340] to-[#1a365d] px-5 py-3 flex items-center gap-2">
            <span className="text-[#cfa756] text-xl">✉️</span>
            <h2 className="text-[#f7f4e9] font-bold text-lg">צור קשר</h2>
          </div>
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-green-700 font-bold text-lg mb-2">הודעה נשלחה בהצלחה!</p>
            <p className="text-gray-500 text-sm mb-6">נחזור אליך בהקדם האפשרי</p>
            <button
              onClick={() => setSubmitted(false)}
              className="bg-[#0d2340] hover:bg-[#1a365d] text-[#cfa756] font-bold px-6 py-2 rounded-lg transition-colors"
            >
              שלח הודעה נוספת
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── טופס ─────────────────────────────────────────────────────────────────

  return (
    <div dir="rtl" className="max-w-lg mx-auto py-8 px-4">
      <div className="bg-white rounded-xl border border-[#cfa756]/30 shadow-md overflow-hidden">

        {/* כותרת */}
        <div className="bg-gradient-to-r from-[#0d2340] to-[#1a365d] px-5 py-3 flex items-center gap-2">
          <span className="text-[#cfa756] text-xl">✉️</span>
          <h2 className="text-[#f7f4e9] font-bold text-lg">צור קשר</h2>
        </div>

        <div className="p-5">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 mb-4 text-right text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* שם — readonly */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-600">שם</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-[#0d2340] font-medium text-right">
                {user.name}
              </div>
            </div>

            {/* אימייל — readonly */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-600">אימייל</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-[#0d2340] font-medium text-right">
                {user.email}
              </div>
            </div>

            {/* הודעה */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-600">הודעה</label>
              <textarea
                required
                rows={5}
                placeholder="כתוב את הודעתך כאן..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-right focus:ring-2 focus:ring-[#cfa756] focus:border-[#cfa756] outline-none resize-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-[#0d2340] hover:bg-[#1a365d] disabled:opacity-50 text-[#cfa756] font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              {submitting ? 'שולח...' : 'שלח הודעה ✉️'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}