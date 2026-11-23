import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, CircleAlert, ClipboardList, Pencil, Plus, RefreshCw, Settings, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { changeArielDonationStatus, createArielDonation, deleteArielDonation, getArielAdmin, saveArielSettings, updateArielDonation } from './arielApi';
import './ariel.css';
import { csvCell } from './arielCsv.mjs';

const formatter = new Intl.NumberFormat('he-IL');
const money = amount => `${formatter.format(amount || 0)} ₪`;
const statuses = { pending: 'ממתינה לאימות', confirmed: 'אושרה', rejected: 'נדחתה', void: 'בוטלה' };
const methods = { bit: 'ביט', bank: 'בנק', other: 'אישי/אחר' };
const toLocalInput = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = v => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const errMessage = err => err?.response?.data?.message || 'הפעולה נכשלה. נסו שוב.';
const newManual = () => ({ reportKey: `manual-${crypto.randomUUID()}`, amount: '', method: 'bit', donorName: '', donorContact: '', reference: '', note: '', displayName: false, paymentConfirmed: false });

const textFields = [
  ['title', 'כותרת הדף'], ['subtitle', 'כותרת משנה'],
  ['beneficiaryName', 'שם המוטב — לא יוצג כברירת מחדל'],
  ['organizerName', 'שם מקבל הכספים בפועל — יוצג בפומבי'],
  ['extendedPurpose', 'ייעוד היעד המורחב (5,000 ₪)'],
  ['bitPhone', 'מספר טלפון לביט'], ['bitLink', 'קישור HTTPS לתשלום בביט'],
  ['bankName', 'שם הבנק'], ['bankBranch', 'מספר סניף'],
  ['bankAccount', 'מספר חשבון'], ['bankHolder', 'שם בעל החשבון'],
];

function exportCsv(donations) {
  const cols = [
    ['createdAt', 'תאריך'], ['amount', 'סכום'], ['method', 'אמצעי'],
    ['status', 'סטטוס'], ['source', 'מקור'], ['donorName', 'שם'],
    ['donorContact', 'פרטי קשר'], ['reference', 'אסמכתה'], ['note', 'הערה'],
  ];
  const quote = csvCell;
  const lines = [cols.map(c => quote(c[1])).join(',')];
  for (const d of donations) lines.push(cols.map(c => quote(d[c[0]])).join(','));
  const csv = '\uFEFF' + lines.join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'ariel-donations.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ArielAdmin() {
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [manual, setManual] = useState(newManual);
  const [editing, setEditing] = useState(null);
  const [editScrollRequest, setEditScrollRequest] = useState(0);
  const editPanelRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('donations');

  const reload = useCallback(async () => {
    const result = await getArielAdmin();
    setData(result);
    setSettings({ ...result.campaign, deadlineAt: toLocalInput(result.campaign.deadlineAt) });
  }, []);

  useEffect(() => { reload().catch(err => setError(errMessage(err))); }, [reload]);

  useEffect(() => {
    if (!editScrollRequest || tab !== 'donations') return;
    const panel = editPanelRef.current;
    if (!panel) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    panel.querySelector('input')?.focus({ preventScroll: true });
  }, [editScrollRequest, tab]);

  const beginEdit = donation => {
    setEditing({ ...donation });
    setEditScrollRequest(count => count + 1);
  };
  const run = async (callback, success) => {
    setBusy(true); setError(''); setMessage('');
    try { await callback(); await reload(); setMessage(success); return true; }
    catch (err) { setError(errMessage(err)); }
    finally { setBusy(false); }
  };

  const updateSettings = event => {
    const { name, value, checked, type } = event.target;
    setSettings(s => ({ ...s, [name]: type === 'checkbox' ? checked : value }));
  };
  const saveSettings = async e => {
    e.preventDefault();
    const keys = [
      'published', 'title', 'subtitle', 'storyShort', 'storyFull', 'beneficiaryName',
      'showBeneficiaryName', 'showPersonalStory', 'organizerName', 'extendedPurpose', 'privacyNotice', 'allowReports',
      'bitPhone', 'bitLink', 'bankName', 'bankBranch', 'bankAccount', 'bankHolder',
    ];
    const patch = Object.fromEntries(keys.map(k => [k, settings[k]]));
    patch.expectedVersion = settings.__v ?? 0;
    patch.deadlineAt = settings.deadlineAt ? new Date(settings.deadlineAt).toISOString() : null;
    // Avoid a secret publication caused by accidentally saving other settings.
    if (patch.published && !data.campaign.published && !window.confirm('לפרסם את דף הגיוס לציבור שמחזיק בקישור? אי אפשר להבטיח שהקישור לא יועבר הלאה.')) return;
    await run(() => saveArielSettings(patch), 'ההגדרות נשמרו');
  };

  const addManual = async e => {
    e.preventDefault();
    const amount = Number(manual.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) return setError('יש להזין סכום שלם ותקין');
    if (!manual.paymentConfirmed) return setError('יש לסמן שהסכום התקבל בפועל');
    const saved = await run(() => createArielDonation({ ...manual, amount }), 'התרומה נוספה ואושרה');
    if (saved) setManual(newManual());
  };

  const setStatus = async (donation, status) => {
    const verbs = { confirmed: 'לאשר את התשלום רק לאחר שווידאת שהכסף התקבל?', rejected: 'לדחות את הדיווח?', void: 'לבטל את התרומה המאושרת? הסכום יופחת מהיעד.' };
    if (!window.confirm(verbs[status])) return;
    await run(() => changeArielDonationStatus(donation._id, status), 'הסטטוס עודכן');
  };

  const deleteDonation = async donation => {
    const details = `${donation.donorName || 'תורם אנונימי'} — ${money(donation.amount)}`;
    if (!window.confirm(`למחוק לצמיתות את הרשומה של ${details}?\n\nהרשומה תימחק ממסד הנתונים ומיומן התרומות. אם התרומה אושרה, היא תופחת מהסכום שנאסף. לא ניתן לשחזר את המחיקה.`)) return;
    const saved = await run(() => deleteArielDonation(donation._id, donation.__v), 'הרשומה נמחקה לצמיתות');
    if (saved) setEditing(current => current?._id === donation._id ? null : current);
  };
  const saveEdit = async e => {
    e.preventDefault();
    const amount = Number(editing.amount);
    if (!Number.isSafeInteger(amount) || amount < 1) return setError('יש להזין סכום תקין');
    const saved = await run(() => updateArielDonation(editing._id, {
      expectedVersion: editing.__v,
      amount, donorName: editing.donorName, donorContact: editing.donorContact,
      reference: editing.reference, note: editing.note, displayName: editing.displayName,
    }), 'פרטי התרומה עודכנו');
    if (saved) setEditing(null);
  };

  if (!data || !settings) return <div dir="rtl" className="ariel-admin"><p>{error || 'טוענים את ממשק הגיוס...'}</p><button onClick={() => reload().catch(e => setError(errMessage(e)))}>נסה שוב</button></div>;
  const donations = data.donations || [];
  const confirmed = donations.filter(d => d.status === 'confirmed');
  const pending = donations.filter(d => d.status === 'pending');
  return <section className="ariel-admin" dir="rtl">
    <div className="ariel-admin-title"><div><span className="ariel-admin-kicker">ממשק המנהל הקיים • אזור הגיוס</span><h1>ניהול קמפיין משפחתי</h1><p>העמוד הציבורי נשאר טיוטה עד שתפעיל אותו בעצמך.</p></div><button className="ariel-admin-btn" onClick={() => reload().catch(err => setError(errMessage(err)))} disabled={busy}><RefreshCw size={17}/> רענון</button></div>
    <div className="ariel-admin-stats">
      <div><span>תרומות מאושרות</span><strong>{money(data.stats.total)}</strong></div>
      <div><span>יעד נוכחי</span><strong>{money(data.stats.goal)}</strong></div>
      <div><span>ממתינות לבדיקה</span><strong>{pending.length}</strong></div>
      <div><span>מצב פרסום</span><strong>{settings.published ? 'פורסם' : 'טיוטה בלבד'}</strong></div>
    </div>
    {error && <p className="ariel-error" role="alert">{error}</p>}
    {message && <p className="ariel-success" role="status"><CheckCircle2 size={18}/>{message}</p>}
    <nav className="ariel-admin-tabs" aria-label="ניהול גיוס">
      <button className={tab === 'donations' ? 'active' : ''} onClick={() => setTab('donations')}><ClipboardList size={17}/> תרומות</button>
      <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}><Settings size={17}/> הגדרות ופרסום</button>
      <button className={tab === 'audit' ? 'active' : ''} onClick={() => setTab('audit')}><ShieldCheck size={17}/> יומן פעולות</button>
    </nav>

    {tab === 'donations' && <div className="ariel-admin-stack">
      <div className="ariel-admin-panel"><h2><Plus size={20}/> הוספת תרומה שהתקבלה בפועל</h2>
        <p>להזנת שתי התרומות הראשוניות של 500 ₪ כל אחת, לאחר אימות שהן מיועדות לקמפיין, יש לבצע את הפעולה פעמיים.</p>
        <form onSubmit={addManual} className="ariel-admin-form">
          <label>סכום בשקלים<input type="number" min="1" max="1000000" step="1" required value={manual.amount} onChange={e => setManual(m => ({ ...m, amount: e.target.value }))}/></label>
          <label>אמצעי העברה<select value={manual.method} onChange={e => setManual(m => ({ ...m, method: e.target.value }))}><option value="bit">ביט</option><option value="bank">בנק</option><option value="other">תרומה אישית/אחר</option></select></label>
          <label>שם התורם<input value={manual.donorName} maxLength={80} onChange={e => setManual(m => ({ ...m, donorName: e.target.value, displayName: false }))}/></label>
          <label>אסמכתה (רשות)<input value={manual.reference} maxLength={120} onChange={e => setManual(m => ({ ...m, reference: e.target.value }))}/></label>
          <label>הערה פנימית<input value={manual.note} maxLength={500} onChange={e => setManual(m => ({ ...m, note: e.target.value }))}/></label>
          <label className="ariel-admin-check"><input type="checkbox" checked={manual.displayName} onChange={e => setManual(m => ({ ...m, displayName: e.target.checked }))}/> לפרסם את שם התורם (באישורו)</label>
          <label className="ariel-admin-check"><input type="checkbox" checked={manual.paymentConfirmed} onChange={e => setManual(m => ({ ...m, paymentConfirmed: e.target.checked }))}/> בדקתי שהכסף התקבל בפועל</label>
          <button className="ariel-admin-btn primary" type="submit" disabled={busy}>הוספת תרומה מאושרת</button>
        </form>
      </div>
      <div className="ariel-admin-panel"><div className="ariel-admin-panel-header"><h2>יומן תרומות</h2><button className="ariel-admin-btn" type="button" onClick={() => exportCsv(donations)}>ייצוא CSV לאקסל</button></div>
        <p>{confirmed.length} תרומות מאושרות בין {donations.length} הרשומות האחרונות. המונה הראשי מחושב מכל התרומות המאושרות במסד הנתונים.</p>
        <div className="ariel-table-scroll"><table className="ariel-admin-table"><thead><tr><th>מועד</th><th>תורם</th><th>סכום</th><th>אמצעי</th><th>מצב</th><th>פעולות</th></tr></thead><tbody>
          {donations.map(d => <tr key={d._id}>
            <td>{new Date(d.createdAt).toLocaleString('he-IL')}</td><td>{d.donorName || 'אנונימי'}<small>{d.reference || ''}</small></td><td>{money(d.amount)}</td><td>{methods[d.method]}</td><td><span className={`ariel-status ariel-status-${d.status}`}>{statuses[d.status]}</span></td>
            <td><div className="ariel-actions"><button type="button" disabled={busy} title="עריכה" onClick={() => beginEdit(d)}><Pencil size={16}/></button>{d.status === 'pending' && <><button disabled={busy} title="אישור" onClick={() => setStatus(d, 'confirmed')}><Check size={17}/></button><button disabled={busy} title="דחיית דיווח (ללא מחיקה)" aria-label="דחיית דיווח" onClick={() => setStatus(d, 'rejected')}><XCircle size={16}/></button></>}{d.status === 'confirmed' && <button disabled={busy} title="ביטול תרומה" onClick={() => setStatus(d, 'void')}><CircleAlert size={16}/></button>}<button type="button" className="ariel-action-delete" disabled={busy} title="מחיקה לצמיתות" aria-label={`מחיקה לצמיתות של תרומת ${d.donorName || 'תורם אנונימי'} בסך ${money(d.amount)}`} onClick={() => deleteDonation(d)}><Trash2 size={16}/></button></div></td>
          </tr>)}
          {!donations.length && <tr><td colSpan="6">אין עדיין תרומות במערכת.</td></tr>}
        </tbody></table></div>
      </div>
      {editing && <div ref={editPanelRef} className="ariel-admin-panel ariel-admin-edit-panel"><h2>עריכת תרומה</h2><form className="ariel-admin-form" onSubmit={saveEdit}>
        <label>סכום<input type="number" step="1" min="1" max="1000000" value={editing.amount} onChange={e => setEditing(s => ({ ...s, amount: e.target.value }))}/></label>
        <label>שם<input value={editing.donorName || ''} maxLength={80} onChange={e => setEditing(s => ({ ...s, donorName: e.target.value, displayName: false }))}/></label>
        <label>פרטי קשר<input value={editing.donorContact || ''} onChange={e => setEditing(s => ({ ...s, donorContact: e.target.value }))}/></label>
        <label>אסמכתה<input value={editing.reference || ''} onChange={e => setEditing(s => ({ ...s, reference: e.target.value }))}/></label>
        <label>הערה<input value={editing.note || ''} onChange={e => setEditing(s => ({ ...s, note: e.target.value }))}/></label>
        <label className="ariel-admin-check"><input type="checkbox" checked={!!editing.displayName} onChange={e => setEditing(s => ({ ...s, displayName: e.target.checked }))}/> הסכמה להצגת שם</label>
        <div className="ariel-admin-actions"><button className="ariel-admin-btn primary" type="submit" disabled={busy}>שמירת תיקון</button><button type="button" className="ariel-admin-btn" onClick={() => setEditing(null)}>ביטול</button></div>
      </form></div>}
    </div>}

    {tab === 'settings' && <div className="ariel-admin-panel"><h2>הגדרות הקמפיין</h2>
      <p>שימו לב: העמוד יהיה נגיש לכל מי שיש לו קישור אחרי פרסום. אין אוטומציה לשליחת הודעות למוטב.</p>
      <form className="ariel-admin-form ariel-settings-form" onSubmit={saveSettings}>
        {textFields.map(([key,label]) => <label key={key}>{label}<input name={key} value={settings[key] || ''} onChange={updateSettings} maxLength={220}/></label>)}
        <label className="wide">הסיפור הקצר<textarea name="storyShort" rows="3" maxLength={3000} value={settings.storyShort || ''} onChange={updateSettings}/></label>
        <label className="wide">הסיפור המלא<textarea name="storyFull" rows="5" maxLength={3000} value={settings.storyFull || ''} onChange={updateSettings}/></label>
        <label className="wide">מדיניות פרטיות ומחיקה — מי מחזיק במידע, תקופת שמירה ודרך לבקש מחיקה<textarea name="privacyNotice" rows="3" maxLength={3000} value={settings.privacyNotice || ''} onChange={updateSettings}/></label>
        <label>מועד סיום (שעון המחשב המקומי)<input type="datetime-local" name="deadlineAt" value={settings.deadlineAt || ''} onChange={updateSettings}/></label>
        <div className="wide ariel-settings-checks">
          <label className="ariel-admin-check"><input type="checkbox" name="showBeneficiaryName" checked={!!settings.showBeneficiaryName} onChange={updateSettings}/> לפרסם את שם המוטב</label>
          <label className="ariel-admin-check"><input type="checkbox" name="showPersonalStory" checked={!!settings.showPersonalStory} onChange={updateSettings}/> לפרסם את הסיפור האישי (החלטה נפרדת מפרסום העמוד)</label>
          <label className="ariel-admin-check"><input type="checkbox" name="allowReports" checked={!!settings.allowReports} onChange={updateSettings}/> לאפשר לתורמים לשלוח דיווחים</label>
          <label className="ariel-admin-check"><input type="checkbox" name="published" checked={!!settings.published} onChange={updateSettings}/> לפרסם עמוד שניתן לפתוח בקישור הציבורי</label>
        </div>
        <div className="wide ariel-admin-actions"><button className="ariel-admin-btn primary" disabled={busy} type="submit">שמירת כל ההגדרות</button></div>
      </form>
    </div>}
    {tab === 'audit' && <div className="ariel-admin-panel"><h2>היסטוריית פעולות אחרונות</h2><div className="ariel-table-scroll"><table className="ariel-admin-table"><thead><tr><th>מועד</th><th>פעולה</th><th>סכום קודם</th><th>סכום חדש</th></tr></thead><tbody>
      {(data.events || []).map(ev => <tr key={ev._id}><td>{new Date(ev.createdAt).toLocaleString('he-IL')}</td><td>{ev.action}</td><td>{ev.before?.amount ?? '—'}</td><td>{ev.after?.amount ?? '—'}</td></tr>)}
    </tbody></table></div></div>}
  </section>;
}
