import { useState, useRef, useCallback } from 'react';
import {
  createCommemoration,
  updateCommemoration,
  deleteCommemoration,
  fetchCommemorations,
  updateCommemorationStatus, // ← הוסף

} from '../../services/api';
// TODO (שרת): הוסף פונקציה לעדכון סטטוס הנצחה, לדוגמה:
// import { updateCommemorationStatus } from '../../services/api';

const EMPTY_FORM = {
  itemName: '',
  contributorName: '',
  commemoratedName: '',
  amount: '',
  imageUrl: '',
  date: new Date().toISOString().split('T')[0],
};

const STATUS_CONFIG = {
  commemorated: { label: 'הונצח', bg: '#eaf3de', color: '#3b6d11', border: '#97c459' },
  pending: { label: 'ממתין לאישור', bg: '#faeeda', color: '#854f0b', border: '#ef9f27' },
  none: { label: 'פנוי', bg: '#e6f1fb', color: '#185fa5', border: '#85b7eb' },
};

function Field({ label, id, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ── קומפוננטת העלאת תמונה ─────────────────────────────────────────────────────
function ImageUploader({ value, onChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [tab, setTab] = useState('upload');
  const fileInputRef = useRef(null);

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const base64 = await fileToBase64(file);
    onChange(base64);
  }, [onChange]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleUrlConfirm = () => {
    if (urlInput.trim()) { onChange(urlInput.trim()); setUrlInput(''); }
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {value && (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <img src={value} alt="תצוגה מקדימה" className="w-full h-full object-cover" onError={() => onChange('')} />
          <button type="button" onClick={handleClear}
            className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs transition-colors"
            title="הסר תמונה">✕</button>
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">תצוגה מקדימה</div>
        </div>
      )}

      {!value && (
        <>
          <div className="flex border-b border-gray-200">
            {[['upload', '📁 העלאה / גרירה'], ['url', '🔗 קישור URL']].map(([t, lbl]) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`px-4 py-2 text-xs font-medium transition-colors ${tab === t ? 'border-b-2 border-[#cfa756] text-[#0d2340]' : 'text-gray-400 hover:text-gray-600'
                  }`}>{lbl}</button>
            ))}
          </div>

          {tab === 'upload' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all select-none
                ${isDragging ? 'border-[#cfa756] bg-[#cfa756]/10 scale-[1.01]' : 'border-gray-300 bg-gray-50 hover:border-[#cfa756] hover:bg-[#cfa756]/5'}`}
            >
              <svg className={`w-8 h-8 mb-2 transition-colors ${isDragging ? 'text-[#cfa756]' : 'text-gray-400'}`}
                fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className={`text-sm font-medium transition-colors ${isDragging ? 'text-[#cfa756]' : 'text-gray-500'}`}>
                {isDragging ? 'שחרר כאן!' : 'גרור תמונה לכאן'}
              </p>
              <p className="text-xs text-gray-400 mt-1">או לחץ לבחירה מהמחשב</p>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
            </div>
          )}

          {tab === 'url' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlConfirm()}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#cfa756] text-left"
                  dir="ltr" />
                <button type="button" onClick={handleUrlConfirm} disabled={!urlInput.trim()}
                  className="bg-[#0d2340] hover:bg-[#1a365d] disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  אישור
                </button>
              </div>
              <p className="text-xs text-gray-400">הדבק קישור לתמונה ולחץ אישור או Enter</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── מודאל שינוי סטטוס ────────────────────────────────────────────────────────
function StatusModal({ item, onClose, onSave }) {
  const [selected, setSelected] = useState(item.commemorationStatus || 'none');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(item._id, selected);
    setSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-[#0d2340]/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div dir="rtl" className="bg-white rounded-2xl border-2 border-[#cfa756]/40 shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-base font-bold text-[#0d2340] mb-1">שינוי סטטוס הנצחה</h3>
        <p className="text-xs text-gray-500 mb-5 border-b border-gray-100 pb-3">{item.itemName}</p>

        <div className="flex flex-col gap-3 mb-6">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <label
              key={key}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selected === key
                  ? 'border-[#0d2340] bg-[#0d2340]/5'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <input
                type="radio" name="status" value={key}
                checked={selected === key}
                onChange={() => setSelected(key)}
                className="accent-[#0d2340]"
              />
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
              >
                {cfg.label}
              </span>
            </label>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            ביטול
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-[#0d2340] text-[#cfa756] font-bold rounded-lg text-sm hover:bg-[#1a365d] disabled:opacity-50">
            {saving ? 'שומר...' : 'שמור סטטוס'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CommemorationForm ────────────────────────────────────────────────────────
export default function CommemorationForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [commemorations, setCommemorations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [listLoaded, setListLoaded] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [statusModal, setStatusModal] = useState(null); // item | null

  const validate = () => {
    const e = {};
    if (!form.itemName.trim()) e.itemName = 'שם הפריט הוא שדה חובה';
    if (!form.contributorName.trim()) e.contributorName = 'שם התורם הוא שדה חובה';
    if (!form.commemoratedName.trim()) e.commemoratedName = 'שם המונצח הוא שדה חובה';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) < 0)
      e.amount = 'יש להזין סכום חוקי';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleImageChange = (val) => setForm((prev) => ({ ...prev, imageUrl: val }));

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setLoading(true);
    setFeedback(null);
    const payload = { ...form, amount: Number(form.amount) };
    try {
      if (editingId) {
        await updateCommemoration(editingId, payload);
        setFeedback({ type: 'success', message: 'ההנצחה עודכנה בהצלחה!' });
      } else {
        await createCommemoration(payload);
        setFeedback({ type: 'success', message: 'ההנצחה נוספה בהצלחה!' });
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      if (listLoaded) loadList();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.response?.data?.message || 'אירעה שגיאה. אנא נסה שוב.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM); setEditingId(null); setErrors({}); setFeedback(null);
  };

  const loadList = async () => {
    setLoadingList(true);
    try {
      const res = await fetchCommemorations();
      setCommemorations(res.data);
      setListLoaded(true);
    } catch {
      setFeedback({ type: 'error', message: 'שגיאה בטעינת הרשימה' });
    } finally {
      setLoadingList(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      itemName: item.itemName,
      contributorName: item.contributorName,
      commemoratedName: item.commemoratedName,
      amount: String(item.amount),
      imageUrl: item.imageUrl || '',
      date: new Date(item.date).toISOString().split('T')[0],
    });
    setErrors({});
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק הנצחה זו?')) return;
    try {
      await deleteCommemoration(id);
      setCommemorations((prev) => prev.filter((c) => c._id !== id));
      setFeedback({ type: 'success', message: 'ההנצחה נמחקה בהצלחה' });
    } catch {
      setFeedback({ type: 'error', message: 'שגיאה במחיקת ההנצחה' });
    }
  };

  const handleStatusSave = async (id, newStatus) => {
    await updateCommemorationStatus(id, newStatus);
    // עדכן גם locally כדי לא לטעון מחדש את כל הרשימה
    setCommemorations((prev) =>
      prev.map((c) => c._id === id ? { ...c, commemorationStatus: newStatus } : c)
    );
  };

  const inputClass = (field) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#cfa756] transition ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  // ספירות לפילטר
  const counts = {
    all: commemorations.length,
    commemorated: commemorations.filter((c) => c.commemorationStatus === 'commemorated').length,
    pending: commemorations.filter((c) => c.commemorationStatus === 'pending').length,
    none: commemorations.filter((c) => !c.commemorationStatus || c.commemorationStatus === 'none').length,
  };

  const FILTERS = [
    { key: 'all', label: `הכל (${counts.all})` },
    { key: 'commemorated', label: `הונצח (${counts.commemorated})` },
    { key: 'pending', label: `ממתין (${counts.pending})` },
    { key: 'none', label: `פנוי (${counts.none})` },
  ];

  const filteredList = activeFilter === 'all'
    ? commemorations
    : commemorations.filter((c) => {
      if (activeFilter === 'none') return !c.commemorationStatus || c.commemorationStatus === 'none';
      return c.commemorationStatus === activeFilter;
    });

  return (
    <div dir="rtl" className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-[#0d2340] mb-6 flex items-center gap-2">
        <span className="text-[#cfa756]">✦</span>
        {editingId ? 'עריכת הנצחה' : 'הוספת הנצחה חדשה'}
      </h2>

      {feedback && (
        <div className={`mb-5 rounded-lg px-4 py-3 text-sm font-medium ${feedback.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
          {feedback.message}
        </div>
      )}

      {/* טופס */}
      <div className="bg-white rounded-2xl shadow-md p-6 space-y-5 border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="שם הפריט המונצח *" id="itemName" error={errors.itemName}>
            <input id="itemName" name="itemName" value={form.itemName} onChange={handleChange}
              placeholder="למשל: ספר תורה, עמוד תפילה..." className={inputClass('itemName')} />
          </Field>

          <Field label="שם המונצח *" id="commemoratedName" error={errors.commemoratedName}>
            <input id="commemoratedName" name="commemoratedName" value={form.commemoratedName}
              onChange={handleChange} placeholder="שם הנפטר לעילוי נשמתו" className={inputClass('commemoratedName')} />
          </Field>

          <Field label="שם התורם / המשפחה *" id="contributorName" error={errors.contributorName}>
            <input id="contributorName" name="contributorName" value={form.contributorName}
              onChange={handleChange} placeholder="שם המשפחה או התורם" className={inputClass('contributorName')} />
          </Field>

          <Field label="סכום התרומה (₪) *" id="amount" error={errors.amount}>
            <input id="amount" name="amount" type="number" min="0" value={form.amount}
              onChange={handleChange} placeholder="0" className={inputClass('amount')} />
          </Field>

          <Field label="תאריך" id="date" error={errors.date}>
            <input id="date" name="date" type="date" value={form.date}
              onChange={handleChange} className={inputClass('date')} />
          </Field>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">תמונה (אופציונלי)</label>
          <ImageUploader value={form.imageUrl} onChange={handleImageChange} />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-[#cfa756] hover:bg-[#b8860b] disabled:opacity-50 text-[#0d2340] font-bold px-6 py-2.5 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#cfa756]">
            {loading ? 'שומר...' : editingId ? 'עדכן הנצחה' : 'הוסף הנצחה'}
          </button>
          {editingId && (
            <button onClick={handleCancel}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none">
              ביטול
            </button>
          )}
        </div>
      </div>

      {/* רשימה קיימת */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#0d2340]">הנצחות קיימות</h3>
          <button onClick={loadList} disabled={loadingList}
            className="text-sm text-[#cfa756] hover:underline disabled:opacity-50 focus:outline-none">
            {loadingList ? 'טוען...' : listLoaded ? 'רענן רשימה' : 'טען רשימה'}
          </button>
        </div>

        {/* פילטר סטטוס — מוצג רק אחרי שהרשימה נטענה */}
        {listLoaded && commemorations.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${activeFilter === key
                    ? 'bg-[#0d2340] text-[#cfa756] border-[#0d2340]'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-[#0d2340] hover:text-[#0d2340]'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {listLoaded && commemorations.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-6">אין הנצחות במערכת</p>
        )}

        {listLoaded && filteredList.length === 0 && commemorations.length > 0 && (
          <p className="text-gray-400 text-sm text-center py-6">אין הנצחות בסטטוס זה</p>
        )}

        <div className="space-y-3">
          {filteredList.map((item) => {
            const cfg = STATUS_CONFIG[item.commemorationStatus] || STATUS_CONFIG.none;
            return (
              <div key={item._id}
                className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-4">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-[#0d2340] truncate">{item.itemName}</p>
                    {/* badge סטטוס */}
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0"
                      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    לעילוי נשמת <span className="text-[#0d2340] font-medium">{item.commemoratedName}</span>
                    {' · '}{item.contributorName}
                  </p>
                </div>

                {/* כפתורי פעולה */}
                <div className="flex gap-2 flex-shrink-0">
                  {/* שינוי סטטוס */}
                  <button
                    onClick={() => setStatusModal(item)}
                    className="text-xs bg-[#cfa756]/15 text-[#854f0b] border border-[#cfa756]/40 px-3 py-1.5 rounded-lg hover:bg-[#cfa756]/30 transition-colors focus:outline-none whitespace-nowrap"
                    title="שנה סטטוס הנצחה"
                  >
                    🏷 סטטוס
                  </button>
                  {/* עריכה */}
                  <button onClick={() => handleEdit(item)}
                    className="text-xs bg-[#0d2340] text-white px-3 py-1.5 rounded-lg hover:bg-[#1a365d] transition-colors focus:outline-none">
                    עריכה
                  </button>
                  {/* מחיקה */}
                  <button onClick={() => handleDelete(item._id)}
                    className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors focus:outline-none">
                    מחיקה
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* מודאל שינוי סטטוס */}
      {statusModal && (
        <StatusModal
          item={statusModal}
          onClose={() => setStatusModal(null)}
          onSave={handleStatusSave}
        />
      )}
    </div>
  );
}