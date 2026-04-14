import { useEffect, useState } from 'react';
import { fetchContactMessages, updateContactMessageHandled } from '../services/api';

export default function Admin() {
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
          
          // 1. מוודאים שיש לנו מערך
          const rawData = Array.isArray(response.data) ? response.data : [];
          
          // 2. מיון: b פחות a נותן סדר יורד (החדש ביותר למעלה)
          const sortedData = rawData.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
          });
      
          // 3. עדכון ה-State
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
    if (!id) {
      setError('לא ניתן לעדכן הודעה ללא מזהה תקין');
      return;
    }

    setUpdatingIds((prev) => [...prev, id]);
    setError('');

    try {
      await updateContactMessageHandled(id, nextHandled);
      setMessages((prev) =>
        prev.map((item) =>
          item._id === id
            ? {
                ...item,
                handled: nextHandled,
                handledAt: nextHandled ? new Date().toISOString() : null
              }
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
    if (activeFilter === 'handled') {
      return Boolean(item.handled);
    }

    if (activeFilter === 'unhandled') {
      return !item.handled;
    }

    return true;
  });

  return (
    <section className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">ניהול הודעות צור קשר</h1>

      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1 rounded border ${activeFilter === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
        >
          הכל ({messages.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('unhandled')}
          className={`px-3 py-1 rounded border ${activeFilter === 'unhandled' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
        >
          לא טופל ({messages.filter((item) => !item.handled).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('handled')}
          className={`px-3 py-1 rounded border ${activeFilter === 'handled' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
        >
          טופל ({messages.filter((item) => item.handled).length})
        </button>
      </div>

      {isLoading && <p className="text-center">טוען הודעות...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

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
              key={messageId || `${item.email || 'unknown'}-${item.date || Math.random()}`}
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
                  <span className="text-sm font-medium">
                    {item.handled ? 'טופל' : 'סמן כטופל'}
                  </span>
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