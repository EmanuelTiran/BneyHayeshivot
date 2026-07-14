import { useCallback, useEffect, useRef, useState } from 'react';
import api, {
  fetchContactMessages, updateContactMessageHandled,
  fetchAllUsers, addMailingListUser, updateMailingListUser,
  deleteMailingListUser, toggleUserNewsletter,
} from '../services/api';
import { fetchAllSponsorships, updateSponsorshipStatus } from '../services/portalService';
import PageHeader from '../components/common/PageHeader';
import { useAdminAlerts } from '../hooks/useAdminAlerts';

// ── וולידציית אימייל משותפת ────────────────────────────────────────────────
const isValidEmail = (email) => {
  const regex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  return regex.test((email || '').trim());
};

// ── אנימציית כניסה לטאב ───────────────────────────────────────────────────────
const tabInStyle = `
  @keyframes tabIn {
    from { opacity: 0; transform: translateY(3px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes adminGlowDot {
    0%, 100% { opacity: .3; transform: scale(.75); }
    50%      { opacity: 1; transform: scale(1.25); }
  }

  @keyframes adminGoldLine {
    0%, 100% { opacity: .55; filter: drop-shadow(0 0 3px rgba(207,167,86,.35)); }
    50%      { opacity: 1; filter: drop-shadow(0 0 9px rgba(247,217,138,.9)); }
  }
`;

// ── כותרת אחידה לטאבים ──────────────────────────────────────────────────────
function AdminTabHeader({ title, subtitle }) {
  const dots = [
    { top: '18%', right: '8%', delay: '0s' },
    { top: '32%', right: '18%', delay: '.7s' },
    { top: '20%', left: '11%', delay: '1.2s' },
    { top: '62%', left: '20%', delay: '.35s' },
    { top: '70%', right: '27%', delay: '1.7s' },
  ];

  return (
    <header
      className="relative overflow-hidden rounded-2xl px-5 py-6 mb-6 text-center border border-[#cfa756]/35"
      style={{
        background: 'linear-gradient(135deg, #0a192f 0%, #0d2340 52%, #122b4d 100%)',
        boxShadow: '0 12px 30px rgba(13,35,64,.22), inset 0 0 32px rgba(207,167,86,.045)',
      }}
    >
      {dots.map((dot, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="absolute h-1.5 w-1.5 rounded-full bg-[#f7d98a] pointer-events-none"
          style={{
            ...dot,
            boxShadow: '0 0 7px #f7d98a, 0 0 14px rgba(207,167,86,.8)',
            animation: `adminGlowDot 2.4s ease-in-out ${dot.delay} infinite`,
          }}
        />
      ))}

      <div className="relative z-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#f7d98a] drop-shadow-[0_0_10px_rgba(207,167,86,.38)]">
          {title}
        </h2>
        {subtitle && <p className="mt-2 text-sm text-[#f7f4e9]/70">{subtitle}</p>}
        <div
          aria-hidden="true"
          className="mx-auto mt-4 h-[2px] w-32 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent, #cfa756, #f7d98a, #cfa756, transparent)',
            animation: 'adminGoldLine 2.2s ease-in-out infinite',
          }}
        />
      </div>
    </header>
  );
}

// ── מודאל עריכת משתמש ─────────────────────────────────────────────────────
function EditUserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ name: user.name, email: user.email });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const emailInvalid = form.email.trim() !== '' && !isValidEmail(form.email);
  const canSubmit = form.name.trim() && form.email.trim() && !emailInvalid && !saving;

  const handleSubmit = async () => {
    setError('');
    if (!form.name.trim() || !form.email.trim()) {
      setError('נא למלא שם ואימייל');
      return;
    }
    if (!isValidEmail(form.email)) {
      setError('כתובת האימייל אינה תקינה');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0d2340]/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#f7f4e9] rounded-xl shadow-2xl border-2 border-[#cfa756] p-6 w-full max-w-md" dir="rtl">
        <h3 className="text-xl font-bold text-[#0d2340] mb-4 border-b border-[#cfa756]/40 pb-2">
          עריכת פרטי משתמש
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-[#0d2340]">שם מלא *</label>
            <input
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#cfa756] outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#0d2340]">אימייל *</label>
            <input
              type="email"
              dir="ltr"
              className={`mt-1 w-full rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#cfa756] border ${emailInvalid ? 'border-red-500' : 'border-gray-300'
                }`}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          {emailInvalid && (
            <p className="text-red-600 text-sm font-medium">כתובת האימייל אינה תקינה</p>
          )}
          {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">ביטול</button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="px-4 py-2 bg-[#0d2340] text-[#cfa756] font-bold rounded-md hover:bg-[#1a365d] disabled:opacity-50">
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── טאב: הודעות צור קשר ──────────────────────────────────────────────────────
function ContactMessages({ onAlertsChange }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [updatingIds, setUpdatingIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);

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
      await onAlertsChange?.();
    } catch {
      setError('עדכון סטטוס נכשל, נסה שוב');
    } finally {
      setUpdatingIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const handleDelete = async (id) => {
    if (!id || !window.confirm('למחוק את הודעת צור הקשר לצמיתות?')) return;

    setDeletingIds((prev) => [...prev, id]);
    setError('');
    try {
      await api.delete(`/contact/${id}`);
      setMessages((prev) => prev.filter((item) => (item._id || item.id) !== id));
      await onAlertsChange?.();
    } catch {
      setError('מחיקת ההודעה נכשלה. ודא שקיים בשרת נתיב DELETE /api/contact/:id');
    } finally {
      setDeletingIds((prev) => prev.filter((itemId) => itemId !== id));
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
      {/* <AdminTabHeader title="הודעות צור קשר" subtitle="צפייה, טיפול ומחיקה של הודעות שהתקבלו מהאתר" /> */}
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
            const isDeleting = messageId ? deletingIds.includes(messageId) : false;
            return (
              <article
                key={messageId || `${item.email}-${item.date}`}
                className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(18,32,56,.98) 0%, rgba(13,35,64,.97) 45%, rgba(10,25,47,.98) 100%)",

                  border: item.handled
                    ? "1px solid rgba(76,175,80,.45)"
                    : "2px solid #a61b1b",

                  boxShadow: item.handled
                    ? "0 10px 30px rgba(76,175,80,.18)"
                    : "0 10px 30px rgba(0,0,0,.35), 0 0 16px rgba(166,27,27,.35)",

                  backdropFilter: "blur(18px)",
                }}
              >
                {/* Glow רקע */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `
        radial-gradient(
          circle at 15% 20%,
          rgba(207,167,86,.08),
          transparent 35%
        ),
        radial-gradient(
          circle at 85% 15%,
          rgba(207,167,86,.05),
          transparent 40%
        )
      `,
                  }}
                />

                <div className="relative z-10 p-5">
                  {/* Header */}
                  <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:justify-between sm:items-start">
                    <div>
                      <h2
                        className="text-xl font-bold"
                        style={{
                          color: "#f7d98a",
                          textShadow: "0 0 10px rgba(207,167,86,.35)",
                        }}
                      >
                        {item.name || "ללא שם"}
                      </h2>

                      <p
                        className="mt-1 text-sm"
                        style={{
                          color: "rgba(247,244,233,.72)",
                        }}
                      >
                        {item.email || "ללא אימייל"}
                      </p>
                    </div>

                    <time
                      className="text-sm whitespace-nowrap"
                      style={{
                        color: "rgba(247,244,233,.55)",
                      }}
                    >
                      {item.date
                        ? new Date(item.date).toLocaleString("he-IL")
                        : "ללא תאריך"}
                    </time>
                  </div>

                  {/* Divider */}
                  <div
                    className="mb-4"
                    style={{
                      height: "1px",
                      background:
                        "linear-gradient(90deg, transparent, rgba(207,167,86,.5), transparent)",
                    }}
                  />

                  {/* Message */}
                  <p
                    className="whitespace-pre-wrap leading-8"
                    style={{
                      color: "#f7f4e9",
                    }}
                  >
                    {item.message || "ללא תוכן הודעה"}
                  </p>

                  {/* Footer */}
                  <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <label
                      className="inline-flex items-center gap-3 cursor-pointer select-none px-4 py-2 rounded-full"
                      style={{
                        border: item.handled
                          ? "1px solid rgba(76,175,80,.45)"
                          : "1px solid rgba(166,27,27,.65)",

                        background: item.handled
                          ? "rgba(76,175,80,.12)"
                          : "rgba(166,27,27,.10)",

                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(item.handled)}
                        disabled={!messageId || isUpdating}
                        onChange={(e) =>
                          handleToggleHandled(messageId, e.target.checked)
                        }
                        className="accent-[#cfa756]"
                      />

                      <span
                        className="font-semibold"
                        style={{
                          color: item.handled ? "#7be495" : "#ff8b8b",
                        }}
                      >
                        {item.handled ? "✓ טופל" : "ממתין לטיפול"}
                      </span>
                    </label>

                    {item.handledAt && (
                      <span
                        className="text-sm"
                        style={{
                          color: "rgba(247,244,233,.55)",
                        }}
                      >
                        טופל ב־
                        {new Date(item.handledAt).toLocaleString("he-IL")}
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={!messageId || isDeleting}
                      onClick={() => handleDelete(messageId)}
                      className="px-4 py-2 rounded-full text-xs font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        color: '#ff8b8b',
                        border: '1px solid rgba(255,80,80,.5)',
                        background: 'rgba(255,80,80,.1)',
                      }}
                    >
                      {isDeleting ? 'מוחק...' : '🗑 מחק הודעה'}
                    </button>
                  </div>
                </div>

                {/* פס תחתון — ירוק אם טופל ואדום אם ממתין */}
                <div
                  style={{
                    height: "2px",

                    background: item.handled
                      ? "linear-gradient(90deg, #276738, #4caf50, #7be495, #4caf50, #276738)"
                      : "linear-gradient(90deg, #6f1010, #a61b1b, #ff8b8b, #a61b1b, #6f1010)",

                    boxShadow: item.handled
                      ? "0 0 12px rgba(76,175,80,.45)"
                      : "0 0 12px rgba(166,27,27,.55)",
                  }}
                />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── טאב: בקשות הקדשה ─────────────────────────────────────────────────────────
function SponsorshipRequests({ onAlertsChange }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [updatingIds, setUpdatingIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);

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
    setUpdatingIds((prev) => [...prev, id]);
    setError('');
    try {
      await updateSponsorshipStatus(id, status);
      setRequests((prev) => prev.map((request) =>
        request._id === id ? { ...request, status } : request
      ));
      await onAlertsChange?.();
    } catch {
      setError('עדכון סטטוס הבקשה נכשל');
    } finally {
      setUpdatingIds((prev) => prev.filter((requestId) => requestId !== id));
    }
  };

  const handleDelete = async (id) => {
    if (!id || !window.confirm('למחוק את בקשת ההקדשה לצמיתות?')) return;

    setDeletingIds((prev) => [...prev, id]);
    setError('');
    try {
      await api.delete(`/sponsorships/${id}`);
      setRequests((prev) => prev.filter((request) => request._id !== id));
      await onAlertsChange?.();
    } catch {
      setError('מחיקת הבקשה נכשלה. ודא שקיים בשרת נתיב DELETE /api/sponsorships/:id');
    } finally {
      setDeletingIds((prev) => prev.filter((requestId) => requestId !== id));
    }
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
      {/* <AdminTabHeader title="בקשות הקדשה" subtitle="אישור, דחייה ומחיקה של בקשות ההקדשה" /> */}
      <FilterBar filters={FILTERS} active={activeFilter} onChange={setActiveFilter} />

      {loading && <p className="text-center py-6">טוען...</p>}
      {error && <p className="text-center text-red-600 py-4">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-center text-gray-500 py-10">אין בקשות להצגה</p>
      )}

      <div className="grid gap-4">
        {filtered.map((r) => {
          const isUpdating = updatingIds.includes(r._id);
          const isDeleting = deletingIds.includes(r._id);

          return (
            <article
              key={r._id}
              className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1"
              style={{
                background:
                  "linear-gradient(180deg, rgba(18,32,56,.98) 0%, rgba(13,35,64,.97) 45%, rgba(10,25,47,.98) 100%)",

                border:
                  r.status === "pending"
                    ? "2px solid #a61b1b"
                    : "1px solid rgba(207,167,86,.35)",

                boxShadow:
                  r.status === "pending"
                    ? "0 10px 30px rgba(0,0,0,.35), 0 0 16px rgba(166,27,27,.35)"
                    : "0 10px 30px rgba(0,0,0,.35)",

                backdropFilter: "blur(18px)",
              }}
            >
              {/* Glow רקע */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                radial-gradient(circle at 15% 20%, rgba(207,167,86,.08), transparent 35%),
                radial-gradient(circle at 85% 15%, rgba(207,167,86,.05), transparent 40%)
              `,
                }}
              />

              <div className="relative z-10 p-5">
                {/* Header */}
                <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:justify-between sm:items-start">
                  <div>
                    <h2
                      className="text-xl font-bold"
                      style={{
                        color: "#f7d98a",
                        textShadow: "0 0 10px rgba(207,167,86,.35)",
                      }}
                    >
                      {r.name || "ללא שם"}
                    </h2>

                    <p
                      className="mt-1 text-sm"
                      style={{
                        color: "rgba(247,244,233,.72)",
                      }}
                    >
                      {r.email || "ללא אימייל"}
                      {r.phone && ` | ${r.phone}`}
                    </p>
                  </div>

                  {/* סטטוס */}
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap"
                    style={{
                      color:
                        r.status === "approved"
                          ? "#7be495"
                          : r.status === "rejected"
                            ? "#ff8b8b"
                            : "#f7d98a",

                      border:
                        r.status === "approved"
                          ? "1px solid rgba(76,175,80,.45)"
                          : r.status === "rejected"
                            ? "1px solid rgba(255,80,80,.45)"
                            : "1px solid rgba(207,167,86,.45)",

                      background:
                        r.status === "approved"
                          ? "rgba(76,175,80,.12)"
                          : r.status === "rejected"
                            ? "rgba(255,80,80,.12)"
                            : "rgba(207,167,86,.08)",
                    }}
                  >
                    {STATUS_LABELS[r.status] || r.status}
                  </span>
                </div>

                {/* Divider */}
                <div
                  className="mb-4"
                  style={{
                    height: "1px",
                    background:
                      "linear-gradient(90deg, transparent, rgba(207,167,86,.5), transparent)",
                  }}
                />

                {/* Details */}
                <div
                  className="space-y-2 text-sm"
                  style={{
                    color: "#f7f4e9",
                  }}
                >
                  <p>
                    <span
                      className="font-semibold"
                      style={{
                        color: "#f7d98a",
                      }}
                    >
                      קטגוריה:
                    </span>{" "}
                    {r.categoryId?.name || "—"}
                  </p>

                  <p>
                    <span
                      className="font-semibold"
                      style={{
                        color: "#f7d98a",
                      }}
                    >
                      פריט:
                    </span>{" "}
                    {r.itemId?.title || r.itemName || "—"}
                  </p>

                  <p>
                    <span
                      className="font-semibold"
                      style={{
                        color: "#f7d98a",
                      }}
                    >
                      סוג הנצחה:
                    </span>{" "}
                    {r.dedicationType || "—"} — {r.dedicationName || "—"}
                  </p>

                  {r.adminNote && (
                    <p>
                      <span
                        className="font-semibold"
                        style={{
                          color: "#f7d98a",
                        }}
                      >
                        הערה:
                      </span>{" "}
                      {r.adminNote}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3 justify-end">
                  {/* כפתור אישור */}
                  {r.status !== "approved" && (
                    <button
                      type="button"
                      disabled={isUpdating || isDeleting}
                      onClick={() => handleStatus(r._id, "approved")}
                      className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        color: "#7be495",
                        border: "1px solid rgba(76,175,80,.45)",
                        background: "rgba(76,175,80,.12)",
                      }}
                    >
                      ✓ אשר
                    </button>
                  )}

                  {/* כפתור דחייה */}
                  {r.status !== "rejected" && (
                    <button
                      type="button"
                      disabled={isUpdating || isDeleting}
                      onClick={() => handleStatus(r._id, "rejected")}
                      className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        color: "#ff8b8b",
                        border: "1px solid rgba(255,80,80,.45)",
                        background: "rgba(255,80,80,.12)",
                      }}
                    >
                      ✕ דחה
                    </button>
                  )}

                  {/* כפתור החזרה לממתין */}
                  {r.status !== "pending" && (
                    <button
                      type="button"
                      disabled={isUpdating || isDeleting}
                      onClick={() => handleStatus(r._id, "pending")}
                      className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        color: "#f7d98a",
                        border: "1px solid rgba(207,167,86,.45)",
                        background: "rgba(207,167,86,.08)",
                      }}
                    >
                      ↻ החזר לממתין
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isUpdating || isDeleting}
                    onClick={() => handleDelete(r._id)}
                    className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      color: '#ff8b8b',
                      border: '1px solid rgba(255,80,80,.55)',
                      background: 'rgba(255,80,80,.1)',
                    }}
                  >
                    {isDeleting ? 'מוחק...' : '🗑 מחק'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
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

// ── טאב: ניהול רשימת תפוצה ────────────────────────────────────────────────
function MailingListManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [editingUser, setEditingUser] = useState(null);
  const [togglingIds, setTogglingIds] = useState([]);

  const emailInvalid = form.email.trim() !== '' && !isValidEmail(form.email);
  const canSubmit = form.name.trim() && form.email.trim() && !emailInvalid && !submitting;

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchAllUsers();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('שגיאה בטעינת המשתמשים');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── הוספת משתמש ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setFormError('');
    setFormSuccess('');
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('נא למלא שם ואימייל');
      return;
    }
    if (!isValidEmail(form.email)) {
      setFormError('כתובת האימייל אינה תקינה');
      return;
    }
    setSubmitting(true);
    try {
      await addMailingListUser(form);
      setFormSuccess(`${form.name} נוסף/ה בהצלחה לרשימת התפוצה`);
      setForm({ name: '', email: '' });
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'שגיאה בהוספת המשתמש');
    } finally {
      setSubmitting(false);
    }
  };

  // ── עריכה ──────────────────────────────────────────────────────────────
  const handleEditSave = async (formData) => {
    const res = await updateMailingListUser(editingUser._id, formData);
    setUsers((prev) => prev.map((u) => (u._id === editingUser._id ? res.data : u)));
    setEditingUser(null);
  };

  // ── מחיקה ──────────────────────────────────────────────────────────────
  const handleDelete = async (user) => {
    if (!window.confirm(`למחוק את ${user.name} לצמיתות?`)) return;
    try {
      await deleteMailingListUser(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
    } catch (err) {
      alert(err.response?.data?.message || 'שגיאה במחיקת המשתמש');
    }
  };

  // ── צ'קבוקס קבלת עדכוני מייל ──────────────────────────────────────────
  const handleToggleNewsletter = async (user, checked) => {
    setTogglingIds((prev) => [...prev, user._id]);
    setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, receivesNewsletter: checked } : u)));
    try {
      await toggleUserNewsletter(user._id, checked);
    } catch {
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, receivesNewsletter: !checked } : u)));
      alert('שגיאה בעדכון סטטוס העדכונים');
    } finally {
      setTogglingIds((prev) => prev.filter((id) => id !== user._id));
    }
  };

  // ── סינון + מיון ──────────────────────────────────────────────────────
  const displayedUsers = users
    .filter((u) => (u.name || '').toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => {
      const cmp = (a.name || '').localeCompare(b.name || '', 'he');
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const newsletterCount = users.filter((u) => u.receivesNewsletter !== false).length;

  return (
    <section className="max-w-3xl mx-auto">
      {/* <AdminTabHeader title="ניהול רשימת תפוצה" subtitle="הוספה, עריכה וניהול של מקבלי עדכוני הקהילה" /> */}
      {/* טופס הוספה */}
      <div className="bg-white shadow rounded-lg p-5 border border-gray-200 mb-8">
        <h2 className="text-lg font-bold text-[#0d2340] mb-4">הוספת חבר קהילה לרשימת התפוצה</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-[#0d2340]">שם מלא *</label>
            <input
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#cfa756] outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="ישראל ישראלי"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#0d2340]">אימייל *</label>
            <input
              type="email"
              dir="ltr"
              className={`mt-1 w-full rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#cfa756]
                ${emailInvalid ? 'border-red-500' : 'border-gray-300'} border`}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
          {emailInvalid && (
            <p className="text-red-600 text-sm font-medium">כתובת האימייל אינה תקינה</p>
          )}
          {formError && <p className="text-red-600 text-sm font-medium">{formError}</p>}
          {formSuccess && <p className="text-green-600 text-sm font-medium">{formSuccess}</p>}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-[#0d2340] text-[#cfa756] font-bold px-5 py-2.5 rounded-lg hover:bg-[#1a365d] disabled:opacity-50 shadow-md"
          >
            {submitting ? 'מוסיף...' : '+ הוסף לרשימת תפוצה'}
          </button>
        </div>
      </div>

      {/* חיפוש + מיון */}
      <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
        <h3 className="text-md font-bold text-[#0d2340]">
          חברי קהילה ({displayedUsers.length}/{users.length}) — {newsletterCount} מנויים לעדכונים
        </h3>
        <div className="flex gap-2 flex-wrap">
          <input
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#cfa756] outline-none"
            placeholder="חיפוש לפי שם..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            className="text-sm font-medium bg-white border border-gray-300 rounded-md px-3 py-1.5 hover:border-[#cfa756] hover:text-[#0d2340]"
          >
            מיון לפי שם {sortDir === 'asc' ? '↓ א-ת' : '↑ ת-א'}
          </button>
        </div>
      </div>

      {loading && <p className="text-center py-6">טוען...</p>}
      {error && <p className="text-center text-red-600 py-4">{error}</p>}
      {!loading && !error && displayedUsers.length === 0 && (
        <p className="text-center text-gray-500 py-10">לא נמצאו משתמשים תואמים</p>
      )}

      {!loading && !error && displayedUsers.length > 0 && (
        <div className="grid gap-2">
          {displayedUsers.map((u) => (
            <div
              key={u._id}
              className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-wrap justify-between items-center gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  title="קבלת עדכוני מייל"
                  checked={u.receivesNewsletter !== false}
                  disabled={togglingIds.includes(u._id)}
                  onChange={(e) => handleToggleNewsletter(u, e.target.checked)}
                  className="w-4 h-4 shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-medium text-[#0d2340] truncate">{u.name}</p>
                  <p className="text-xs text-gray-500 truncate" dir="ltr">{u.email}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full border whitespace-nowrap ${u.isFullyRegistered === false
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  : 'bg-green-100 text-green-800 border-green-300'
                  }`}>
                  {u.isFullyRegistered === false ? 'רשימת תפוצה בלבד' : 'משתמש רשום'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingUser(u)}
                  className="text-xs bg-[#cfa756] text-[#0d2340] font-bold px-3 py-1.5 rounded hover:bg-[#b8860b]"
                >
                  ✎ עריכה
                </button>
                <button
                  onClick={() => handleDelete(u)}
                  className="text-xs bg-[#a61b1b] text-white font-bold px-3 py-1.5 rounded hover:bg-red-800"
                >
                  ✕ מחיקה
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 leading-relaxed">
        הצ'קבוקס קובע האם המשתמש יקבל את עדכון המייל הבא (זמני תפילה והודעות).
        ביטול הסימון אינו מוחק את המשתמש — רק חוסם ממנו את שליחת המיילים.
      </p>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleEditSave}
        />
      )}
    </section>
  );
}

// ── הגדרת הטאבים ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'mailing', label: 'ניהול רשימת תפוצה' },
  { id: 'contact', label: 'הודעות צור קשר' },
  { id: 'sponsorships', label: 'בקשות הקדשה' },
];

// ── Admin ראשי ────────────────────────────────────────────────────────────────
export default function Admin() {
  const [activeTab, setActiveTab] = useState('mailing');
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const tabBarRef = useRef(null);
  const { contact: contactAlertCount, sponsorships: sponsorAlertCount, refresh: refreshAlerts } =
    useAdminAlerts(true);

  const handleAlertsChange = useCallback(async () => {
    try {
      await refreshAlerts();
    } finally {
      window.dispatchEvent(new Event('admin-alerts-changed'));
    }
  }, [refreshAlerts]);

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
    <div dir="rtl" className="min-h-screen bg-[#f7f4ee]">
      <PageHeader
        title="פאנל ניהול"
        subtitle="ניהול הודעות, בקשות הקדשה ורשימת תפוצה"
      />

      <div className="max-w-5xl mx-auto p-4">
        {/* הזרקת keyframes לאנימציה */}
        <style>{tabInStyle}</style>

        {/* רצועת טאבים עם underline נע */}
        <div
          ref={tabBarRef}
          className="flex border-b border-gray-200 mb-6  relative"
        >
          {TABS.map((tab) => {
            const badgeCount =
              tab.id === 'contact'
                ? contactAlertCount
                : tab.id === 'sponsorships'
                  ? sponsorAlertCount
                  : 0;

            return (
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

                {badgeCount > 0 && (
                  <span className="mr-1.5 inline-flex items-center justify-center bg-[#a61b1b] text-white text-[10px] font-bold rounded-full w-4 h-4">
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}

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
          {activeTab === 'contact' && (
            <ContactMessages onAlertsChange={handleAlertsChange} />
          )}

          {activeTab === 'sponsorships' && (
            <SponsorshipRequests onAlertsChange={handleAlertsChange} />
          )}
          {activeTab === 'mailing' && <MailingListManagement />}
        </div>
      </div>
    </div>
  );
}