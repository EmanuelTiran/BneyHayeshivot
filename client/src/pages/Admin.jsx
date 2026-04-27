import { useEffect, useRef, useState } from 'react';
import { fetchContactMessages, updateContactMessageHandled } from '../services/api';
import CommemorationForm from '../components/Admin/CommemorationForm';
import { fetchAllSponsorships, updateSponsorshipStatus } from '../services/portalService';

// ── אנימציית כניסה לטאב ───────────────────────────────────────────────────────
const tabInStyle = `
  @keyframes tabIn {
    from { opacity: 0; transform: translateY(3px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// ── טאב: הודעות צור קשר ──────────────────────────────────────────────────────
function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [updatingIds, setUpdatingIds] = useState([]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const response = await fetchContactMessages();
        const rawData = Array.isArray(response.data) ? response.data : [];
        setMessages(rawData.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch {
        setError('לא ניתן לטעון הודעות כרגע');
      } finally {
        setIsLoading(false);
      }
    };
    loadMessages();
  }, []);

  const handleToggleHandled = async (id, nextHandled) => {
    if (!id) { setError('לא ניתן לעדכן הודעה ללא מזהה תקין'); return; }
    setUpdatingIds((prev) => [...prev, id]);
    setError('');
    try {
      await updateContactMessageHandled(id, nextHandled);
      setMessages((prev) =>
        prev.map((item) =>
          item._id === id
            ? { ...item, handled: nextHandled, handledAt: nextHandled ? new Date().toISOString() : null }
            : item
        )
      );
    } catch {
      setError('עדכון סטטוס נכשל, נסה שוב');
    } finally {
      setUpdatingIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const filteredMessages = messages.filter((item) => {
    if (activeFilter === 'handled') return Boolean(item.handled);
    if (activeFilter === 'unhandled') return !item.handled;
    return true;
  });

  const FILTERS = [
    { key: 'all', label: `הכל (${messages.length})` },
    { key: 'unhandled', label: `לא טופל (${messages.filter((i) => !i.handled).length})` },
    { key: 'handled', label: `טופל (${messages.filter((i) => i.handled).length})` },
  ];

  return (
    <section className="max-w-5xl mx-auto">
      <FilterBar filters={FILTERS} active={activeFilter} onChange={setActiveFilter} />

      {isLoading && <p className="text-center py-6">טוען הודעות...</p>}
      {error && <p className="text-center text-red-600 py-4">{error}</p>}
      {!isLoading && !error && filteredMessages.length === 0 && (
        <p className="text-center text-gray-500 py-10">אין הודעות להצגה כרגע</p>
      )}

      {!isLoading && !error && filteredMessages.length > 0 && (
        <div className="grid gap-4">
          {filteredMessages.map((item) => {
            const messageId = item._id || item.id;
            const isUpdating = messageId ? updatingIds.includes(messageId) : false;
            return (
              <article
                key={messageId || `${item.email}-${item.date}`}
                className={`bg-white shadow rounded-lg p-4 border transition-colors ${item.handled ? 'border-green-300 bg-green-50/40' : 'border-gray-200'
                  }`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                  <h2 className="text-lg font-semibold">{item.name || 'ללא שם'}</h2>
                  <time className="text-sm text-gray-500">
                    {item.date ? new Date(item.date).toLocaleString('he-IL') : 'ללא תאריך'}
                  </time>
                </div>
                <p className="text-sm text-gray-600 mb-2">{item.email || 'ללא אימייל'}</p>
                <p className="text-gray-800 whitespace-pre-wrap">{item.message || 'ללא תוכן הודעה'}</p>
                <div className="mt-3 flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(item.handled)}
                      disabled={!messageId || isUpdating}
                      onChange={(e) => handleToggleHandled(messageId, e.target.checked)}
                    />
                    <span className="text-sm font-medium">{item.handled ? 'טופל' : 'סמן כטופל'}</span>
                  </label>
                  {item.handledAt && (
                    <span className="text-xs text-gray-500">
                      טופל ב־{new Date(item.handledAt).toLocaleString('he-IL')}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── טאב: בקשות הקדשה ─────────────────────────────────────────────────────────
function SponsorshipRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchAllSponsorships();
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('שגיאה בטעינת הבקשות');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id, status) => {
    await updateSponsorshipStatus(id, status);
    load();
  };

  const STATUS_LABELS = { pending: 'ממתין', approved: 'אושר', rejected: 'נדחה' };
  const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    approved: 'bg-green-100  text-green-800  border-green-300',
    rejected: 'bg-red-100    text-red-800    border-red-300',
  };

  const FILTERS = [
    { key: 'all', label: `הכל (${requests.length})` },
    { key: 'pending', label: `ממתין (${requests.filter((r) => r.status === 'pending').length})` },
    { key: 'approved', label: `אושר (${requests.filter((r) => r.status === 'approved').length})` },
    { key: 'rejected', label: `נדחה (${requests.filter((r) => r.status === 'rejected').length})` },
  ];

  const filtered = activeFilter === 'all' ? requests : requests.filter((r) => r.status === activeFilter);

  return (
    <section className="max-w-5xl mx-auto">
      <FilterBar filters={FILTERS} active={activeFilter} onChange={setActiveFilter} />

      {loading && <p className="text-center py-6">טוען...</p>}
      {error && <p className="text-center text-red-600 py-4">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-center text-gray-500 py-10">אין בקשות להצגה</p>
      )}

      <div className="grid gap-4">
        {filtered.map((r) => (
          <article key={r._id} className="bg-white shadow rounded-lg p-4 border border-gray-200">
            <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
              <div>
                <h2 className="font-semibold text-[#0d2340]">{r.name}</h2>
                <p className="text-xs text-gray-500">{r.email} | {r.phone}</p>
              </div>
              <span className={`text-xs font-bold border px-2 py-1 rounded-full ${STATUS_COLORS[r.status]}`}>
                {STATUS_LABELS[r.status]}
              </span>
            </div>
            <div className="text-sm text-gray-700 space-y-0.5 mb-3">
              <p><span className="font-medium">קטגוריה:</span> {r.categoryId?.name || '—'}</p>
              <p>
                <span className="font-medium">פריט:</span>{' '}
                {r.itemId?.title || r.itemName || '—'}
              </p>
              <p>
                <span className="font-medium">קטגוריה:</span>{' '}
                {r.categoryId?.name || (r.source === 'commemoration' ? 'הנצחות' : '—')}
              </p>
              <p><span className="font-medium">סוג הנצחה:</span> {r.dedicationType} — {r.dedicationName || '—'}</p>
              {r.adminNote && <p><span className="font-medium">הערה:</span> {r.adminNote}</p>}
            </div>
            <div className="flex gap-2 justify-end">
              {r.status !== 'approved' && (
                <button
                  onClick={() => handleStatus(r._id, 'approved')}
                  className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  ✓ אשר
                </button>
              )}
              {r.status !== 'rejected' && (
                <button
                  onClick={() => handleStatus(r._id, 'rejected')}
                  className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  ✕ דחה
                </button>
              )}
              {r.status !== 'pending' && (
                <button
                  onClick={() => handleStatus(r._id, 'pending')}
                  className="text-xs bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                >
                  ↩ ממתין
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ── קומפוננטת פילטר משותפת ────────────────────────────────────────────────────
function FilterBar({ filters, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mb-5">
      {filters.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${active === key
            ? 'bg-[#0d2340] text-[#cfa756] border-[#0d2340]'
            : 'bg-white text-gray-600 border-gray-300 hover:border-[#0d2340] hover:text-[#0d2340]'
            }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── הגדרת הטאבים ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'contact', label: 'הודעות צור קשר' },
  { id: 'commemorations', label: 'ניהול הנצחות' },
  { id: 'sponsorships', label: 'בקשות הקדשה' },
];

// ── Admin ראשי ────────────────────────────────────────────────────────────────
export default function Admin() {
  const [activeTab, setActiveTab] = useState('contact');
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const tabBarRef = useRef(null);

  // מיקום ראשוני של ה-underline אחרי render
  useEffect(() => {
    const btn = tabBarRef.current?.querySelector(`[data-tab="${activeTab}"]`);
    if (btn) setUnderlineStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, []);

  // עדכן underline בשינוי גודל חלון
  useEffect(() => {
    const handleResize = () => {
      const btn = tabBarRef.current?.querySelector(`[data-tab="${activeTab}"]`);
      if (btn) setUnderlineStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  const handleTabChange = (id) => {
    setActiveTab(id);
    const btn = tabBarRef.current?.querySelector(`[data-tab="${id}"]`);
    if (btn) setUnderlineStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
  };

  return (
    <div dir="rtl" className="max-w-5xl mx-auto p-4">
      {/* הזרקת keyframes לאנימציה */}
      <style>{tabInStyle}</style>

      <h1 className="text-2xl font-bold mb-6 text-center text-[#0d2340]">פאנל ניהול</h1>

      {/* רצועת טאבים עם underline נע */}
      <div
        ref={tabBarRef}
        className="flex border-b border-gray-200 mb-6 overflow-x-auto relative"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            data-tab={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`px-5 py-2.5 text-sm whitespace-nowrap transition-colors duration-200 focus:outline-none
              ${activeTab === tab.id
                ? 'text-[#0d2340] font-bold'
                : 'text-gray-500 hover:text-[#0d2340] font-medium'
              }`}
          >
            {tab.label}
          </button>
        ))}

        {/* underline שנע בצורה חלקה */}
        <div
          className="absolute bottom-[-0.5px] h-[2px] bg-[#cfa756] rounded-sm pointer-events-none"
          style={{
            left: underlineStyle.left,
            width: underlineStyle.width,
            transition: 'left 0.4s cubic-bezier(.4,0,.2,1), width 0.4s cubic-bezier(.4,0,.2,1)',
          }}
        />
      </div>

      {/* תוכן הטאב הפעיל — key גורם ל-React להר mount מחדש ולהפעיל אנימציה */}
      <div
        key={activeTab}
        style={{ animation: 'tabIn 0.8s ease-out both' }}
      >
        {activeTab === 'contact' && <ContactMessages />}
        {activeTab === 'commemorations' && <CommemorationForm />}
        {activeTab === 'sponsorships' && <SponsorshipRequests />}
      </div>
    </div>
  );
}