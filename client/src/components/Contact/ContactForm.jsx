// components/Contact/ContactForm.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { sendContactMessage } from '../../services/api';
import PageHeader from '../common/PageHeader';

function ContactCard({ children }) {
  return (
    <div className="bg-white rounded-xl border border-[#cfa756]/30 shadow-md overflow-hidden">
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function ContactForm() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
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

  const pageShell = (content) => (
    <div dir="rtl" className="min-h-screen bg-[#f7f4ee]">
      <PageHeader
        title="צור קשר"
        subtitle="שלח הודעה למנהל המערכת"
      />
      <div className="max-w-lg mx-auto py-8 px-4">{content}</div>
    </div>
  );

  if (authLoading) {
    return pageShell(
      <ContactCard>
        <div className="p-3 text-center text-gray-400">טוען...</div>
      </ContactCard>
    );
  }

  if (!isAuthenticated) {
    return pageShell(
      <ContactCard>
        <div className="text-center">
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
      </ContactCard>
    );
  }

  if (submitted) {
    return pageShell(
      <ContactCard>
        <div className="text-center">
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
      </ContactCard>
    );
  }

  return pageShell(
    <ContactCard>
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 mb-4 text-right text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-600">שם</label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-[#0d2340] font-medium text-right">
            {user.name}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-600">אימייל</label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-[#0d2340] font-medium text-right">
            {user.email}
          </div>
        </div>

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
    </ContactCard>
  );
}
