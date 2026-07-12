import { useEffect, useState } from 'react';
import {
  fetchCommemorations,
  createCommemoration,
  updateCommemoration,
  deleteCommemoration,
} from '../services/api';
import { submitCommemorationRequest } from '../services/portalService';
import CommunityPaymentButton from '../components/CommunityPaymentButton';
import { useAuth } from '../components/context/authContext';
import ImageUploader from '../components/ImageUploader';

const DEDICATION_TYPES = ['לזכות', 'לעילוי נשמת', 'לרפואת', 'לעילוי נשמת ולהצלחת', 'אחר'];

// סטטוס הנצחה — ערכים: 'commemorated' | 'pending' | 'none'
const STATUS_CONFIG = {
  commemorated: { label: 'הונצח', dot: '#3b6d11', bg: '#eaf3de', text: '#3b6d11', border: '#97c459' },
  pending: { label: 'ממתין לאישור', dot: '#854f0b', bg: '#faeeda', text: '#854f0b', border: '#ef9f27' },
  none: { label: 'פנוי להנצחה', dot: '#185fa5', bg: '#e6f1fb', text: '#185fa5', border: '#85b7eb' },
};

// ── נירמול קישורי תמונה מ-Google Drive (זהה ל-CommemorationForm) ────────────
const normalizeImageUrl = (url) => {
  if (!url) return url;
  if (url.includes('drive.google.com')) {
    const fileId =
      url.match(/\/d\/(.*?)\//)?.[1] ||
      url.match(/id=(.*?)(?:&|$)/)?.[1];
    if (fileId) return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return url;
};

// ── Lightbox – תצוגת תמונה מלאה בלחיצה ───────────────────────────────────────
function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(13,35,64,.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 80, padding: '20px', cursor: 'zoom-out',
        animation: 'fadeIn .2s ease',
      }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="סגור"
        style={{
          position: 'absolute', top: '18px', left: '18px',
          width: '38px', height: '38px', borderRadius: '50%',
          background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)',
          color: '#fff', fontSize: '18px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 81,
        }}
      >
        ✕
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '92vw', maxHeight: '90vh', objectFit: 'contain',
          borderRadius: '12px', boxShadow: '0 24px 64px rgba(0,0,0,.6)',
          cursor: 'default',
        }}
        draggable={false}
      />
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}

// ── מודאל ניהול (הוספה/עריכה) — למנהלים בלבד ────────────────────────────────
const EMPTY_ADMIN_FORM = {
  commemorationStatus: 'none',
  itemName: '',
  contributorName: '',
  commemoratedName: '',
  amount: '',
  imageUrl: '',
  date: new Date().toISOString().split('T')[0],
};

function AdminCommemorationModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(
    initial
      ? {
        commemorationStatus: initial.commemorationStatus || 'none',
        itemName: initial.itemName || '',
        contributorName: initial.contributorName || '',
        commemoratedName: initial.commemoratedName || '',
        amount: initial.amount != null ? String(initial.amount) : '',
        imageUrl: normalizeImageUrl(initial.imageUrl || ''),
        date: initial.date
          ? new Date(initial.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      }
      : EMPTY_ADMIN_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ← האם הפריט "פנוי להנצחה" — עדיין אין מונצח/תורם בפועל
  const isAvailable = form.commemorationStatus === 'none';

  const handleStatusChange = (newStatus) => {
    setForm((prev) => ({ ...prev, commemorationStatus: newStatus }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.itemName.trim()) {
      setError('שם הפריט הוא שדה חובה');
      return;
    }
    // שדות אלה נדרשים רק כאשר הפריט אינו פנוי (כלומר כבר יש מונצח בפועל)
    if (!isAvailable) {
      if (!form.contributorName.trim() || !form.commemoratedName.trim()) {
        setError('נא למלא שם תורם ושם מונצח (חובה כאשר הסטטוס אינו "פנוי להנצחה")');
        return;
      }
      if (form.amount === '' || isNaN(Number(form.amount)) || Number(form.amount) < 0) {
        setError('יש להזין סכום חוקי');
        return;
      }
    }
    setError('');
    setSaving(true);
    try {
      await onSave({
        ...form,
        amount: form.amount === '' ? 0 : Number(form.amount),
      });
    } catch {
      setError('שגיאה בשמירה — נסה שוב');
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(13,35,64,.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 55, padding: '16px', backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        dir="rtl"
        style={{
          background: '#f7f4e9', borderRadius: '16px', border: '2px solid #cfa756',
          padding: '24px', width: '100%', maxWidth: '460px',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0d2340', marginBottom: '16px', borderBottom: '1px solid rgba(207,167,86,.4)', paddingBottom: '10px' }}>
          {initial ? '✎ עריכת הנצחה' : '+ הוספת הנצחה חדשה'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* ← סטטוס בראש הטופס, כדי שיקבע מה נדרש בהמשך */}
          <Field label="סטטוס הנצחה">
            <select
              style={inputStyle}
              value={form.commemorationStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
            {isAvailable && (
              <p style={{ fontSize: '11px', color: '#185fa5', marginTop: '4px' }}>
                פריט פנוי — פרטי המונצח והתורם עדיין לא ידועים ואינם חובה.
              </p>
            )}
          </Field>

          <Field label="שם הפריט המונצח *">
            <input
              style={inputStyle}
              value={form.itemName}
              onChange={(e) => setForm({ ...form, itemName: e.target.value })}
              placeholder="למשל: ספר תורה, עמוד תפילה..."
            />
          </Field>

          {/* ← שדות אלה מוצגים תמיד אך מסומנים כחובה (*) רק כשלא "פנוי" */}
          <Field label={`שם המונצח${isAvailable ? '' : ' *'}`}>
            <input
              style={inputStyle}
              value={form.commemoratedName}
              onChange={(e) => setForm({ ...form, commemoratedName: e.target.value })}
              placeholder={isAvailable ? 'ימולא לאחר אישור בקשת הנצחה' : 'שם הנפטר לעילוי נשמתו'}
            />
          </Field>

          <Field label={`שם התורם / המשפחה${isAvailable ? '' : ' *'}`}>
            <input
              style={inputStyle}
              value={form.contributorName}
              onChange={(e) => setForm({ ...form, contributorName: e.target.value })}
              placeholder={isAvailable ? 'ימולא לאחר אישור בקשת הנצחה' : 'שם המשפחה או התורם'}
            />
          </Field>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Field label={`סכום (₪)${isAvailable ? '' : ' *'}`} style={{ flex: 1 }}>
              <input
                type="number" min="0" style={inputStyle}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
              />
            </Field>
            <Field label="תאריך" style={{ flex: 1 }}>
              <input
                type="date" style={inputStyle}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
          </div>

          <Field label="תמונה">
            <ImageUploader
              onUploaded={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>או הדבק קישור</span>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            </div>

            <input
              type="url" dir="ltr" style={{ ...inputStyle, textAlign: 'left' }}
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://... או קישור Google Drive"
            />

            {form.imageUrl && (
              <div style={{ marginTop: '8px', height: '110px', borderRadius: '10px', overflow: 'hidden', background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
                <img
                  src={normalizeImageUrl(form.imageUrl)}
                  alt="תצוגה מקדימה"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}
          </Field>

          {error && <p style={{ color: '#a32d2d', fontSize: '12px', fontWeight: 600 }}>{error}</p>}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid rgba(207,167,86,.25)' }}>
          <button onClick={onClose} style={cancelBtnStyle}>ביטול</button>
          <button onClick={handleSubmit} disabled={saving} style={submitBtnStyle}>
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── מודאל בקשת הנצחה (ציבורי — ללא שינוי) ────────────────────────────────────
function RequestModal({ item, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    dedicationType: 'לזכות', dedicationName: '', adminNote: '',
  });
  const [sending, setSending] = useState(false);
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
        itemName: item.itemName,
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
        <div style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid rgba(207,167,86,.25)' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0d2340', marginBottom: '4px' }}>
            📝 בקשת הנצחה
          </h3>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>
            פריט: <strong style={{ color: '#0d2340' }}>{item.itemName}</strong>
          </p>
        </div>

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
function CommemorationCard({ item, onRequest, isAdmin, onEdit, onDelete, onImageClick }) {
  const cfg = STATUS_CONFIG[item.commemorationStatus] || STATUS_CONFIG.none;
  const isCommemoratedAlready = item.commemorationStatus === 'commemorated';
  const isPending = item.commemorationStatus === 'pending';

  const formattedDate = item.date
    ? new Date(item.date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const formattedAmount = item.amount
    ? new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0 }).format(item.amount)
    : null;

  const imgSrc = item.imageUrl ? normalizeImageUrl(item.imageUrl) : null;

  return (
    <div
      dir="rtl"
      style={{
        position: 'relative',
        background: '#fff', borderRadius: '16px',
        border: `1px solid ${isCommemoratedAlready ? 'rgba(97,196,89,.35)' : isPending ? 'rgba(239,159,39,.3)' : 'rgba(207,167,86,.2)'}`,
        boxShadow: '0 2px 8px rgba(13,35,64,.06)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        transition: 'box-shadow .2s, transform .2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(13,35,64,.13)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(13,35,64,.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* כפתורי ניהול — למנהלים בלבד */}
      {isAdmin && (
        <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 5, display: 'flex', gap: '4px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            title="עריכה"
            style={{
              background: '#cfa756', color: '#0d2340', fontSize: '11px', fontWeight: 700,
              padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,.2)',
            }}
          >✎</button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item._id); }}
            title="מחיקה"
            style={{
              background: '#a61b1b', color: '#fff', fontSize: '11px', fontWeight: 700,
              padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,.2)',
            }}
          >✕</button>
        </div>
      )}

      {/* תמונה / placeholder — לחיצה על תמונה קיימת פותחת Lightbox */}
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={`הנצחת ${item.commemoratedName}`}
          style={{ width: '100%', height: '140px', objectFit: 'cover', cursor: 'zoom-in' }}
          onClick={() => onImageClick({ src: imgSrc, alt: item.commemoratedName || item.itemName })}
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
      ) : null}
      <div
        style={{
          display: imgSrc ? 'none' : 'flex',
          width: '100%', height: '140px',
          background: 'linear-gradient(135deg, #0d2340 0%, #1a365d 100%)',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <HeartIcon />
      </div>

      {/* גוף */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

// ─────────────────────────────────────────────
// GoldParticles – חלקיקי זהב לדף
// ─────────────────────────────────────────────
function GoldParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(18)].map((_, i) => (
        <div
          key={`dust-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${Math.random() * 2 + 0.5}px`,
            height: `${Math.random() * 2 + 0.5}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background:
              'radial-gradient(circle, rgba(255,233,160,.9) 0%, rgba(207,167,86,.5) 60%, transparent 100%)',
            boxShadow:
              '0 0 8px rgba(207,167,86,.8)',
            animation: `floatDust ${4 + i * .4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}

      {[...Array(5)].map((_, i) => (
        <div
          key={`spark-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${5 + i * 2}px`,
            height: `${5 + i * 2}px`,
            left: `${15 + i * 18}%`,
            top: `${20 + (i % 3) * 25}%`,
            background:
              'radial-gradient(circle,#fff8e0 0%,#cfa756 45%,transparent 70%)',
            boxShadow:
              '0 0 15px rgba(247,217,138,.9)',
            animation:
              `sparklePulse ${2.5 + i * .5}s ease-in-out infinite`,
            animationDelay: `${i * .4}s`,
          }}
        />
      ))}
    </div>
  );
}


// ─────────────────────────────────────────────
// LightSweep – פס אור תחתון
// ─────────────────────────────────────────────
function LightSweep() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg,#b8860b,#cfa756,#ffe9a0,#cfa756,#b8860b)',
        }}
      />

      <div
        className="absolute inset-y-0 w-[60%]"
        style={{
          background:
            'linear-gradient(90deg,transparent,rgba(255,255,255,.8),transparent)',
          animation: 'sweepLight 3.5s infinite',
        }}
      />
    </div>
  );
}

// ── עמוד ראשי ─────────────────────────────────────────────────────────────────
export default function Commemorations() {
  const { isAdmin } = useAuth();
  const [commemorations, setCommemorations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [modalItem, setModalItem] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [adminModal, setAdminModal] = useState(null); // null | 'add' | { item }
  const [actionError, setActionError] = useState('');
  const [lightbox, setLightbox] = useState(null); // null | { src, alt }

  const load = () => {
    setLoading(true);
    fetchCommemorations()
      .then((res) => { setCommemorations(res.data); setError(null); })
      .catch(() => setError('אירעה שגיאה בטעינת ההנצחות. אנא נסה שוב מאוחר יותר.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const counts = {
    all: commemorations.length,
    commemorated: commemorations.filter((i) => i.commemorationStatus === 'commemorated').length,
    pending: commemorations.filter((i) => i.commemorationStatus === 'pending').length,
    none: commemorations.filter((i) => i.commemorationStatus === 'none').length,
  };

  const filtered = activeFilter === 'all'
    ? commemorations
    : commemorations.filter((i) => i.commemorationStatus === activeFilter);

  const FILTERS = [
    { key: 'all', label: `הכל (${counts.all})` },
    { key: 'commemorated', label: `הונצח (${counts.commemorated})` },
    { key: 'pending', label: `ממתין לאישור (${counts.pending})` },
    { key: 'none', label: `פנוי להנצחה (${counts.none})` },
  ];

  // ── פעולות ניהול (אדמין בלבד) ──────────────────────────────────────────────
  const handleAdminSave = async (form) => {
    setActionError('');
    try {
      if (adminModal === 'add') {
        await createCommemoration(form);
      } else {
        await updateCommemoration(adminModal.item._id, form);
      }
      setAdminModal(null);
      load();
    } catch {
      setActionError('שגיאה בשמירת ההנצחה');
      throw new Error('save failed'); // כדי שהמודאל ידע להישאר פתוח ולהציג שגיאה
    }
  };

  const handleAdminDelete = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק הנצחה זו?')) return;
    try {
      await deleteCommemoration(id);
      setCommemorations((prev) => prev.filter((c) => c._id !== id));
    } catch {
      setActionError('שגיאה במחיקת ההנצחה');
    }
  };

  const showAdminBar = isAdmin && isAdmin();

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#f7f4ee' }}>
      <div
        className="relative overflow-hidden"
        dir="rtl"
        style={{
          background:
            'linear-gradient(180deg, rgba(18,32,56,.98) 0%, rgba(13,35,64,.96) 100%)',
          padding: '10px 16px',
          textAlign: 'center',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(207,167,86,.2)',
        }}
      >

        <GoldParticles />

        <div className="relative z-10">

          <h1
            style={{
              fontSize: '36px',
              fontWeight: 800,
              color: '#cfa756',
              marginBottom: '10px',
              textShadow:
                '0 0 15px rgba(207,167,86,.45), 0 0 35px rgba(207,167,86,.2)',
            }}
          >
            לוח הנצחות
          </h1>

          <p
            style={{
              color: 'rgba(247,244,233,.8)',
              fontSize: '16px',
              letterSpacing: '1px',
            }}
          >
            הנצחות ותרומות לעילוי נשמת יקירינו
          </p>


          <div
            style={{
              width: '70px',
              height: '3px',
              margin: '20px auto 0',
              borderRadius: '5px',
              background:
                'linear-gradient(90deg,#b8860b,#ffe9a0,#b8860b)',
              boxShadow:
                '0 0 15px rgba(207,167,86,.8)',
            }}
          />

        </div>


        <LightSweep />


        <style>{`

    @keyframes floatDust {
      0%,100% {
        transform:translateY(0);
        opacity:.3;
      }
      50% {
        transform:translateY(-15px);
        opacity:.9;
      }
    }


    @keyframes sparklePulse {
      0%,100% {
        transform:scale(.7);
        opacity:.4;
      }

      50% {
        transform:scale(1.4);
        opacity:1;
      }
    }


    @keyframes sweepLight {
      0% {
        left:-60%;
      }

      50% {
        left:100%;
      }

      100% {
        left:-60%;
      }
    }

  `}</style>

      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
        {/* שורת ניהול — למנהלים בלבד */}
        {showAdminBar && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              onClick={() => setAdminModal('add')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: '#0d2340', color: '#cfa756', fontWeight: 700,
                padding: '9px 18px', borderRadius: '10px', border: 'none',
                cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 6px rgba(13,35,64,.2)',
              }}
            >
              <span style={{ fontSize: '15px' }}>+</span> הוסף הנצחה
            </button>
          </div>
        )}

        {actionError && (
          <div style={{ marginBottom: '16px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600 }}>
            {actionError}
          </div>
        )}

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

        {loading && <Spinner />}
        {error && <ErrorBox msg={error} />}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
            <HeartIcon size={56} />
            <p style={{ marginTop: '16px', fontSize: '16px' }}>אין הנצחות להצגה כרגע</p>
          </div>
        )}

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
                isAdmin={showAdminBar}
                onEdit={(it) => setAdminModal({ item: it })}
                onDelete={handleAdminDelete}
                onImageClick={setLightbox}
              />
            ))}
          </div>
        )}
      </div>

      {modalItem && !showSuccess && (
        <RequestModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          onSuccess={() => { setModalItem(null); setShowSuccess(true); }}
        />
      )}

      {showSuccess && (
        <SuccessBanner onClose={() => setShowSuccess(false)} />
      )}

      {adminModal && (
        <AdminCommemorationModal
          initial={adminModal !== 'add' ? adminModal.item : null}
          onClose={() => setAdminModal(null)}
          onSave={handleAdminSave}
        />
      )}

      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
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