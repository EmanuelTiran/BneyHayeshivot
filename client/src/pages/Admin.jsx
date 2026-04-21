import { useEffect, useState } from 'react';

import { fetchContactMessages, updateContactMessageHandled } from '../services/api';
import CommemorationForm from '../components/Admin/CommemorationForm';

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
        const sortedData = rawData.sort((a, b) => new Date(b.date) - new Date(a.date));
        setMessages(sortedData);
      } catch (err) {
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
    } catch (err) {
      setError('עדכון סטטוס נכשל, נסה שוב');
    } finally {
      setUpdatingIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const filteredMessages = messages.filter((item) => {
    if (activeFilter === 'handled')   return Boolean(item.handled);
    if (activeFilter === 'unhandled') return !item.handled;
    return true;
  });

  return (
    <section className="max-w-5xl mx-auto">
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <button type="button" onClick={() => setActiveFilter('all')}
          className={`px-3 py-1 rounded border ${activeFilter === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
          הכל ({messages.length})
        </button>
        <button type="button" onClick={() => setActiveFilter('unhandled')}
          className={`px-3 py-1 rounded border ${activeFilter === 'unhandled' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
          לא טופל ({messages.filter((item) => !item.handled).length})
        </button>
        <button type="button" onClick={() => setActiveFilter('handled')}
          className={`px-3 py-1 rounded border ${activeFilter === 'handled' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
          טופל ({messages.filter((item) => item.handled).length})
        </button>
      </div>

      {isLoading && <p className="text-center">טוען הודעות...</p>}
      {error    && <p className="text-center text-red-600">{error}</p>}
      {!isLoading && !error && filteredMessages.length === 0 && (
        <p className="text-center text-gray-600">אין הודעות להצגה כרגע</p>
      )}

      {!isLoading && !error && filteredMessages.length > 0 && (
        <div className="grid gap-4">
          {filteredMessages.map((item) => {
            const messageId = item._id || item.id;
            const isUpdating = messageId ? updatingIds.includes(messageId) : false;
            return (
              <article
                key={messageId || `${item.email}-${item.date}`}
                className={`bg-white shadow rounded p-4 border ${item.handled ? 'border-green-300 bg-green-50/40' : 'border-gray-200'}`}
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

// ── הגדרת הטאבים ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'contact',          label: 'הודעות צור קשר' },
  { id: 'commemorations',   label: 'ניהול הנצחות'   },
];

// ── Admin ראשי ────────────────────────────────────────────────────────────────
export default function Admin() {
  const [activeTab, setActiveTab] = useState('contact');

  return (
    <div dir="rtl" className="max-w-5xl mx-auto p-4">
      {/* כותרת */}
      <h1 className="text-2xl font-bold mb-6 text-center text-[#0d2340]">פאנל ניהול</h1>

      {/* רצועת טאבים */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors focus:outline-none
              ${activeTab === tab.id
                ? 'border-b-2 border-[#cfa756] text-[#0d2340] font-bold'
                : 'text-gray-500 hover:text-[#0d2340]'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* תוכן הטאב הפעיל */}
      {activeTab === 'contact'        && <ContactMessages />}
      {activeTab === 'commemorations' && <CommemorationForm />}
    </div>
  );
}