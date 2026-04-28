import { useEffect, useState } from 'react';
import { fetchCommemorations } from '../services/api';
// TODO (שרת): ייבא כאן את פונקציית submitSponsorshipRequest כשתחבר לשרת
// import { submitSponsorshipRequest } from '../services/portalService';
import { submitCommemorationRequest } from '../services/portalService';
import CommunityPaymentButton from '../components/CommunityPaymentButton';
const DEDICATION_TYPES = ['לזכות', 'לעילוי נשמת', 'לרפואת', 'לעילוי נשמת ולהצלחת', 'אחר'];

// סטטוס הנצחה — ערכים: 'commemorated' | 'pending' | 'none'
const STATUS_CONFIG = {
  commemorated: { label: 'הונצח',           dot: '#3b6d11', bg: '#eaf3de', text: '#3b6d11', border: '#97c459' },
  pending:      { label: 'ממתין לאישור',    dot: '#854f0b', bg: '#faeeda', text: '#854f0b', border: '#ef9f27' },
  none:         { label: 'פנוי להנצחה',     dot: '#185fa5', bg: '#e6f1fb', text: '#185fa5', border: '#85b7eb' },
};

// ── מודאל בקשת הנצחה ──────────────────────────────────────────────────────────
function RequestModal({ item, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    dedicationType: 'לזכות', dedicationName: '', adminNote: '',
  });
  const [sending, setSending]     = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async () => {
    setFormError('');
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      setFormError('נא למלא את כל השדות המסומנים *');
      return;
    }
    setSending(true);
    try {
      await submitCommemorationRequest({
        ...form,
        itemName:        item.itemName,
        commemorationId: item._id,
      });
      onSuccess();
    } catch {
      setFormError('שגיאה בשליחה — נסה שוב');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(13,35,64,.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        dir="rtl"
        style={{
          background: '#fff', borderRadius: '16px',
          border: '1.5px solid rgba(207,167,86,.4)',
          padding: '28px', width: '100%', maxWidth: '440px',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* כותרת */}
        <div style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid rgba(207,167,86,.25)' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0d2340', marginBottom: '4px' }}>
            📝 בקשת הנצחה
          </h3>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>
            פריט: <strong style={{ color: '#0d2340' }}>{item.itemName}</strong>
          </p>
        </div>

        {/* שדות */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Field label="שם מלא *">
            <input
              style={inputStyle}
              placeholder="ישראל ישראלי"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Field label="טלפון *" style={{ flex: 1 }}>
              <input
                style={{ ...inputStyle, direction: 'ltr' }}
                placeholder="050-0000000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="אימייל *" style={{ flex: 1 }}>
              <input
                type="email"
                style={{ ...inputStyle, direction: 'ltr' }}
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>

          <Field label="סוג ההנצחה">
            <select
              style={inputStyle}
              value={form.dedicationType}
              onChange={(e) => setForm({ ...form, dedicationType: e.target.value })}
            >
              {DEDICATION_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>

          <Field label="שם לציון בהנצחה">
            <input
              style={inputStyle}
              placeholder="לדוג׳: חנה בת רות"
              value={form.dedicationName}
              onChange={(e) => setForm({ ...form, dedicationName: e.target.value })}
            />
          </Field>

          <Field label="הערה לגבאי">
            <textarea
              style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
              placeholder="פרטים נוספים, בקשות מיוחדות..."
              value={form.adminNote}
              onChange={(e) => setForm({ ...form, adminNote: e.target.value })}
            />
          </Field>

          {formError && (
            <p style={{ color: '#a32d2d', fontSize: '12px', fontWeight: 600 }}>{formError}</p>
          )}

            <CommunityPaymentButton />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button onClick={onClose} style={cancelBtnStyle}>ביטול</button>
            <button onClick={handleSubmit} disabled={sending} style={submitBtnStyle}>
              {sending ? '⏳ שולח...' : '📤 שלח בקשה'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── באנר הצלחה ────────────────────────────────────────────────────────────────
function SuccessBanner({ onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(13,35,64,.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 60, padding: '16px',
      }}
    >
      <div
        dir="rtl"
        style={{
          background: '#fff', borderRadius: '16px',
          border: '2px solid #cfa756',
          padding: '36px 28px', maxWidth: '360px', width: '100%', textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '52px', marginBottom: '12px' }}>✅</div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0d2340', marginBottom: '8px' }}>
          בקשתך נשלחה!
        </h3>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>
          הגבאי יצור עמך קשר בהקדם לאישור הבקשה. תודה רבה!
        </p>
        <button onClick={onClose} style={submitBtnStyle}>סגור</button>
      </div>
    </div>
  );
}

// ── כרטיס הנצחה ───────────────────────────────────────────────────────────────
function CommemorationCard({ item, onRequest }) {
  const cfg = STATUS_CONFIG[item.commemorationStatus] || STATUS_CONFIG.none;
  const isCommemoratedAlready = item.commemorationStatus === 'commemorated';
  const isPending             = item.commemorationStatus === 'pending';

  const formattedDate = item.date
    ? new Date(item.date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const formattedAmount = item.amount
    ? new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0 }).format(item.amount)
    : null;

  return (
    <div
      dir="rtl"
      style={{
        background: '#fff', borderRadius: '16px',
        border: `1px solid ${isCommemoratedAlready ? 'rgba(97,196,89,.35)' : isPending ? 'rgba(239,159,39,.3)' : 'rgba(207,167,86,.2)'}`,
        boxShadow: '0 2px 8px rgba(13,35,64,.06)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        transition: 'box-shadow .2s, transform .2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(13,35,64,.13)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(13,35,64,.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* תמונה / placeholder */}
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={`הנצחת ${item.commemoratedName}`}
          style={{ width: '100%', height: '140px', objectFit: 'cover' }}
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
      ) : null}
      <div
        style={{
          display: item.imageUrl ? 'none' : 'flex',
          width: '100%', height: '140px',
          background: 'linear-gradient(135deg, #0d2340 0%, #1a365d 100%)',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <HeartIcon />
      </div>

      {/* גוף */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* שם הפריט + סטטוס */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0d2340', lineHeight: 1.3, flex: 1 }}>
            {item.itemName}
          </h3>
          <span
            style={{
              fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '12px', whiteSpace: 'nowrap',
              background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
            }}
          >
            {cfg.label}
          </span>
        </div>

        {/* פרטים */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
          {item.commemoratedName && item.commemorationStatus !== 'none' && (
            <Row label='לעילוי נשמת:' value={item.commemoratedName} bold />
          )}
          {item.contributorName && item.commemorationStatus !== 'none' && (
            <Row label='נתרם ע"י:' value={item.contributorName} />
          )}
          {formattedAmount && <Row label="סכום:" value={formattedAmount} />}
          {formattedDate && (
            <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid #f3f4f6' }}>
              {formattedDate}
            </p>
          )}
        </div>

        {/* כפתור בקשה — רק לפריטים שאינם מונצחים */}
        {!isCommemoratedAlready && (
          <button
            onClick={() => onRequest(item)}
            disabled={isPending}
            style={{
              marginTop: '4px', width: '100%', padding: '8px',
              borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 700,
              cursor: isPending ? 'default' : 'pointer',
              background: isPending ? '#f3f4f6' : '#0d2340',
              color: isPending ? '#9ca3af' : '#cfa756',
              transition: 'background .15s',
            }}
          >
            {isPending ? '⏳ בקשה ממתינה לאישור' : '📤 בקש הנצחה'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── עמוד ראשי ─────────────────────────────────────────────────────────────────
export default function Commemorations() {
  const [commemorations, setCommemorations] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [activeFilter, setActiveFilter]     = useState('all');
  const [modalItem, setModalItem]           = useState(null);
  const [showSuccess, setShowSuccess]       = useState(false);

  useEffect(() => {
    fetchCommemorations()
      .then((res) => setCommemorations(res.data))
      .catch(() => setError('אירעה שגיאה בטעינת ההנצחות. אנא נסה שוב מאוחר יותר.'))
      .finally(() => setLoading(false));
  }, []);

  // ספירות לפילטרים
  const counts = {
    all:          commemorations.length,
    commemorated: commemorations.filter((i) => i.commemorationStatus === 'commemorated').length,
    pending:      commemorations.filter((i) => i.commemorationStatus === 'pending').length,
    none:         commemorations.filter((i) => i.commemorationStatus === 'none').length,
  };

  const filtered = activeFilter === 'all'
    ? commemorations
    : commemorations.filter((i) => i.commemorationStatus === activeFilter);

  const FILTERS = [
    { key: 'all',          label: `הכל (${counts.all})` },
    { key: 'commemorated', label: `הונצח (${counts.commemorated})` },
    { key: 'pending',      label: `ממתין לאישור (${counts.pending})` },
    { key: 'none',         label: `פנוי להנצחה (${counts.none})` },
  ];

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#f7f4ee' }}>
      {/* כותרת */}
      <div style={{
        background: 'linear-gradient(135deg, #0d2340 0%, #1a365d 100%)',
        padding: '48px 16px', textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#cfa756', marginBottom: '8px' }}>
          לוח הנצחות
        </h1>
        <p style={{ color: 'rgba(247,244,233,.75)', fontSize: '15px' }}>
          הנצחות ותרומות לעילוי נשמת יקירינו
        </p>
        <div style={{ width: '48px', height: '3px', background: '#cfa756', margin: '16px auto 0', borderRadius: '2px' }} />
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
        {/* פילטרים */}
        {!loading && !error && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                style={{
                  padding: '7px 18px', borderRadius: '24px', fontSize: '13px', fontWeight: 600,
                  border: activeFilter === key ? '1.5px solid #0d2340' : '1.5px solid #d1d5db',
                  background: activeFilter === key ? '#0d2340' : '#fff',
                  color: activeFilter === key ? '#cfa756' : '#6b7280',
                  cursor: 'pointer', transition: 'all .15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* מצבים */}
        {loading && <Spinner />}
        {error && <ErrorBox msg={error} />}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
            <HeartIcon size={56} />
            <p style={{ marginTop: '16px', fontSize: '16px' }}>אין הנצחות להצגה כרגע</p>
          </div>
        )}

        {/* רשת כרטיסים */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '20px',
          }}>
            {filtered.map((item) => (
              <CommemorationCard
                key={item._id}
                item={item}
                onRequest={setModalItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* מודאל בקשה */}
      {modalItem && !showSuccess && (
        <RequestModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          onSuccess={() => { setModalItem(null); setShowSuccess(true); }}
        />
      )}

      {/* באנר הצלחה */}
      {showSuccess && (
        <SuccessBanner onClose={() => setShowSuccess(false)} />
      )}
    </div>
  );
}

// ── קומפוננטות עזר ────────────────────────────────────────────────────────────
function Field({ label, children, style }) {
  return (
    <div style={style}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px', display: 'block' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', gap: '6px', fontSize: '12px' }}>
      <span style={{ color: '#cfa756', fontWeight: 700, minWidth: '90px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#0d2340', fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  );
}

function HeartIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#cfa756" strokeWidth="1.2">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
           2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
           C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
           c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        border: '3px solid #cfa756', borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{
      background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c',
      borderRadius: '12px', padding: '20px', textAlign: 'center', maxWidth: '420px', margin: '0 auto',
    }}>
      <p style={{ fontWeight: 600 }}>{msg}</p>
    </div>
  );
}

// סגנונות משותפים
const inputStyle = {
  width: '100%', border: '1px solid #d1d5db', borderRadius: '8px',
  padding: '9px 12px', fontSize: '13px', outline: 'none',
  fontFamily: 'inherit', background: '#fff', color: '#111827',
  transition: 'border-color .15s',
};

const cancelBtnStyle = {
  padding: '9px 20px', border: '1px solid #d1d5db', borderRadius: '8px',
  background: '#fff', color: '#6b7280', cursor: 'pointer', fontSize: '13px',
};

const submitBtnStyle = {
  padding: '9px 24px', background: '#0d2340', color: '#cfa756',
  border: 'none', borderRadius: '8px', fontSize: '13px',
  fontWeight: 700, cursor: 'pointer',
};