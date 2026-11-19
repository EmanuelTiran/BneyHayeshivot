import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Copy, HeartHandshake, House, LockKeyhole, Send, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { getArielBankDetails, getArielPublic, reportArielPayment } from './arielApi';
import './ariel.css';

const PRESETS = [100, 180, 360, 500];
const INITIAL_DONATIONS_VISIBLE = 8;
const formatter = new Intl.NumberFormat('he-IL');
const fmt = value => `${formatter.format(value || 0)} ₪`;
const errorText = err => err?.response?.data?.message || 'אירעה שגיאה. נסו שוב.';

function deadlineCountdown(date, now) {
  if (!date) return null;
  const duration = new Date(date).getTime() - now;
  if (!Number.isFinite(duration) || duration <= 0) return null;
  const seconds = Math.floor(duration / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

function Amounts({ amount, onChange }) {
  const [custom, setCustom] = useState(false);
  return (
    <div className="ariel-amounts" aria-label="בחירת סכום תרומה">
      {PRESETS.map(value => (
        <button key={value} type="button" className={`ariel-amount ${!custom && amount === value ? 'is-selected' : ''}`}
          aria-pressed={!custom && amount === value}
          onClick={() => { setCustom(false); onChange(value); }}>{fmt(value)}</button>
      ))}
      <button type="button" className={`ariel-amount ${custom ? 'is-selected' : ''}`}
        aria-pressed={custom} onClick={() => { setCustom(true); onChange(''); }}>סכום אחר</button>
      {custom && <label className="ariel-custom">סכום בשקלים
        <input type="number" min="1" max="1000000" step="1" inputMode="numeric" placeholder="הקלידו סכום"
          value={amount} onChange={event => onChange(event.target.value === '' ? '' : Number(event.target.value))}/>
      </label>}
    </div>
  );
}

function PaymentReport({ amount, privacyNotice, onClose, onSubmitted }) {
  const [method, setMethod] = useState('bit');
  const [donorName, setDonorName] = useState('');
  const [donorContact, setDonorContact] = useState('');
  const [reference, setReference] = useState('');
  const [displayName, setDisplayName] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [website, setWebsite] = useState('');
  const [key] = useState(() => crypto.randomUUID());
  const valid = Number.isSafeInteger(amount) && amount > 0 && amount <= 1000000;
  const submit = async e => {
    e.preventDefault();
    if (!valid) return setError('יש לבחור סכום תקין לפני הדיווח');
    setError(''); setBusy(true);
    try {
      await reportArielPayment({ amount, method, donorName, donorContact, reference, displayName, reportKey: key, website });
      onSubmitted();
    } catch (err) { setError(errorText(err)); }
    finally { setBusy(false); }
  };
  return (
    <div className="ariel-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="ariel-report-title" className="ariel-modal">
        <button type="button" className="ariel-close" aria-label="סגירה" onClick={onClose}>×</button>
        <h2 id="ariel-report-title">כבר העברתם תשלום?</h2>
        <p>דווחו לנו כדי שנוכל לזהות ולאשר אותו. הדיווח אינו אישור שהכסף התקבל.</p>
        <form onSubmit={submit} className="ariel-form">
          <div className="ariel-form-grid">
            <label>אמצעי תשלום
              <select value={method} onChange={e => setMethod(e.target.value)}>
                <option value="bit">ביט</option><option value="bank">העברה בנקאית</option>
              </select>
            </label>
            <div className="ariel-report-amount">סכום לדיווח<strong>{fmt(amount)}</strong></div>
          </div>
          <label>שם התורם (רשות)
            <input value={donorName} maxLength={80} onChange={e => { setDonorName(e.target.value); setDisplayName(false); }} placeholder="שם לזיהוי התרומה"/>
          </label>
          <label>טלפון או כתובת מייל (רשות, לשימוש המנהל בלבד)
            <input value={donorContact} maxLength={120} onChange={e => setDonorContact(e.target.value)} placeholder="לצורך בירור במקרה הצורך"/>
          </label>
          <label>אסמכתה או ארבע ספרות אחרונות (רשות)
            <input value={reference} maxLength={120} onChange={e => setReference(e.target.value)} placeholder="לא להזין סיסמה או מספר כרטיס"/>
          </label>
          <label className="ariel-privacy-check">
            <input type="checkbox" checked={displayName} disabled={!donorName.trim()} onChange={e => setDisplayName(e.target.checked)}/>
            אני מסכים/ה להציג את שמי ברשימת התרומות לאחר אישור התשלום.
          </label>
          <p className="ariel-privacy-notice">{privacyNotice}</p>
          <label className="ariel-honeypot" aria-hidden="true" tabIndex={-1}>Website<input value={website} onChange={e => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off"/></label>
          {error && <p className="ariel-error" role="alert">{error}</p>}
          <button className="ariel-primary" type="submit" disabled={busy || !valid}>{busy ? 'שולחים...' : 'שליחת דיווח לבדיקה'}</button>
        </form>
      </div>
    </div>
  );
}

export default function ArielPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStory, setShowStory] = useState(false);
  const [showAllDonations, setShowAllDonations] = useState(false);
  const [amount, setAmount] = useState(180);
  const [now, setNow] = useState(Date.now());
  const [bank, setBank] = useState(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    const previousTitle = document.title;
    const referrer = document.createElement('meta');
    referrer.name = 'referrer'; referrer.content = 'no-referrer';
    document.head.appendChild(referrer);
    document.title = 'משפחה אחת, לב אחד';
    const old = document.querySelector('meta[name="robots"]');
    const previousRobots = old?.content;
    const tag = old || document.createElement('meta');
    tag.name = 'robots'; tag.content = 'noindex,nofollow,noarchive';
    if (!old) document.head.appendChild(tag);
    return () => { document.title = previousTitle; referrer.remove(); if (!old) tag.remove(); else tag.content = previousRobots; };
  }, []);

  useEffect(() => {
    let active = true;
    const load = async (first = false) => {
      try {
        const result = await getArielPublic();
        if (active) { setData(result); setError(''); }
      } catch (err) {
        if (active && err?.response?.status === 404) {
          setData(null); setBank(null); setShowReport(false); setShowStory(false);
          setError('העמוד עדיין אינו זמין.');
        } else if (active && first) setError(errorText(err));
      } finally { if (active && first) setLoading(false); }
    };
    void load(true);
    const poll = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 12000);
    return () => { active = false; clearInterval(poll); };
  }, []);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const countdown = useMemo(() => deadlineCountdown(data?.deadlineAt, now), [data?.deadlineAt, now]);
  const stats = data?.stats;
  const donations = data?.recent || [];
  const visibleDonations = showAllDonations ? donations : donations.slice(0, INITIAL_DONATIONS_VISIBLE);
  const validAmount = Number.isSafeInteger(amount) && amount > 0 && amount <= 1000000;

  const copy = async (value, label = 'הועתק') => {
    try { await navigator.clipboard.writeText(value); setCopyMessage(label); setTimeout(() => setCopyMessage(''), 2200); }
    catch { setCopyMessage('העתקה לא זמינה. אפשר לבחור ולהעתיק ידנית.'); }
  };
  const revealBank = async () => {
    if (bank) { setBank(null); return; }
    setBankLoading(true); setBankError('');
    try { setBank(await getArielBankDetails()); }
    catch (err) { setBankError(errorText(err)); }
    finally { setBankLoading(false); }
  };

  if (loading) return <div dir="rtl" className="ariel-page ariel-state">טוענים את עמוד הגיוס...</div>;
  if (!data) return <div dir="rtl" className="ariel-page ariel-state">{error || 'העמוד אינו זמין כעת.'}</div>;

  return (
    <div className="ariel-page" dir="rtl">
      <div className="ariel-glow ariel-glow-one"/><div className="ariel-glow ariel-glow-two"/>
      <main className="ariel-container">
        <header className="ariel-topline">
          <span className="ariel-mark"><HeartHandshake size={21}/> יוזמה משפחתית</span>
          <span className="ariel-topnote"><LockKeyhole size={14}/> קישור ייעודי</span>
        </header>
        <section className="ariel-hero" aria-labelledby="ariel-title">
          <div className="ariel-overline"><Sparkles size={15}/> ביחד עושים שינוי</div>
          <h1 id="ariel-title">{data.title}</h1>
          <p className="ariel-subtitle">{data.subtitle}</p>
          <div className="ariel-house-art" aria-hidden="true">
            <div className="ariel-art-ring"><House size={95} strokeWidth={1.1}/><HeartHandshake size={29} className="ariel-art-heart"/></div>
          </div>
          <p className="ariel-intro">{data.storyShort}</p>
          {data.beneficiaryName && <p className="ariel-beneficiary">למען {data.beneficiaryName}</p>}
          {data.storyFull && <button className="ariel-story-toggle" type="button" onClick={() => setShowStory(!showStory)}>
            {showStory ? 'סגירת הסיפור' : 'לקריאת הסיפור המלא'} {showStory ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}
          </button>}
          {showStory && <div className="ariel-full-story">{data.storyFull}</div>}
        </section>
        <section className="ariel-progress-card" aria-label="התקדמות הגיוס">
          <div className="ariel-progress-caption">יחד מתקרבים ליעד</div>
          <div className="ariel-progress-total"><strong>{fmt(stats.total)}</strong><span>נאספו מתוך {fmt(stats.goal)}</span></div>
          <div role="progressbar" aria-label="התקדמות הגיוס" aria-valuenow={Math.min(100, stats.progress)} aria-valuemin="0" aria-valuemax="100" className="ariel-meter">
            <div className="ariel-meter-fill" style={{ width: `${Math.min(100, stats.progress)}%` }}/>
          </div>
          <div className="ariel-progress-bottom"><span>{fmt(stats.remaining)} נותרו ליעד הנוכחי</span><strong>{stats.progress}%</strong></div>
          <div className="ariel-stats-line"><span><HeartHandshake size={17}/> {stats.count} תרומות שאושרו</span>{countdown && <span>נותרו {countdown.days} ימים, {String(countdown.hours).padStart(2,'0')}:{String(countdown.minutes).padStart(2,'0')}:{String(countdown.seconds).padStart(2,'0')}</span>}</div>
          {stats.total >= stats.initialGoal && <div className="ariel-milestone"><CheckCircle2 size={18}/> היעד הראשוני הושג! תודה על השותפות.</div>}
          {stats.goalExtended && <p className="ariel-extended">היעד המקורי היה {fmt(stats.initialGoal)}. יעד ההרחבה: {fmt(stats.extendedGoal)}. {data.extendedPurpose}</p>}
        </section>
        <section className="ariel-donate" aria-labelledby="ariel-donate-title">
          <div className="ariel-section-heading"><span className="ariel-section-icon"><HeartHandshake size={22}/></span><div><h2 id="ariel-donate-title">בוחרים איך להשתתף</h2><p>כל סכום עוזר להתקרב ליעד.</p></div></div>
          <Amounts amount={amount} onChange={setAmount}/>
          <div className="ariel-payment-options">
            {(data.bitLink || data.bitPhone) && <div className="ariel-payment-tile">
              <div className="ariel-payment-title"><Wallet size={19}/> תשלום באמצעות ביט</div>
              {data.bitPhone && <div className="ariel-phone"><bdi>{data.bitPhone}</bdi><button type="button" onClick={() => copy(data.bitPhone, 'המספר הועתק')} aria-label="העתקת מספר הביט"><Copy size={16}/></button></div>}
              {data.bitLink && <a className="ariel-secondary" href={data.bitLink} target="_blank" rel="noopener noreferrer">מעבר לביט <ArrowLeft size={17}/></a>}
              <small>אם בחרתם סכום, ודאו שהוא תואם לסכום שהוזן בביט. לאחר התשלום חזרו לדווח.</small>
            </div>}
            {data.bankAvailable && <div className="ariel-payment-tile">
              <div className="ariel-payment-title"><ShieldCheck size={19}/> העברה בנקאית</div>
              <button className="ariel-secondary" type="button" onClick={revealBank} disabled={bankLoading}>{bankLoading ? 'טוענים...' : bank ? 'הסתרת פרטים' : 'הצגת פרטי חשבון'} <ChevronDown size={17}/></button>
              {bankError && <p className="ariel-error" role="alert">{bankError}</p>}
              {bank && <div className="ariel-bank-details">
                <div>בנק: {bank.bankName}</div><div>סניף: {bank.branch || '—'}</div><div>חשבון: <bdi>{bank.account}</bdi></div><div>שם בעל החשבון: {bank.holder || data.organizerName}</div>
                <button type="button" onClick={() => copy(`בנק: ${bank.bankName}\nסניף: ${bank.branch}\nחשבון: ${bank.account}\nשם בעל החשבון: ${bank.holder || data.organizerName}`)}><Copy size={15}/> העתקת פרטי חשבון</button>
              </div>}
            </div>}
          </div>
          {data.organizerName && <div className="ariel-organizer"><ShieldCheck size={17}/> הכספים מתקבלים אצל {data.organizerName}, מארגן הגיוס, לטובת מטרות הקמפיין.</div>}
          {data.allowReports && <div className="ariel-report-callout">
            <div><strong>כבר ביצעתם העברה?</strong><span>דווחו לנו כדי שנוכל לאמת ולעדכן את מד ההתקדמות.</span></div>
            <button type="button" disabled={!validAmount} className="ariel-primary" onClick={() => { setSubmitted(false); setShowReport(true); }}><Send size={17}/> דיווח על תשלום</button>
          </div>}
          {submitted && <p role="status" className="ariel-success">דיווחכם התקבל לבדיקה. תודה רבה!</p>}
          {copyMessage && <p role="status" className="ariel-copy-status">{copyMessage}</p>}
        </section>
        <section className="ariel-recent" aria-labelledby="ariel-recent-title">
          <div className="ariel-section-heading"><span className="ariel-section-icon"><HeartHandshake size={22}/></span><div><h2 id="ariel-recent-title">שותפים לדרך</h2><p>כל התרומות שאושרו</p></div></div>
          {donations.length ? (
            <>
              <div className="ariel-recent-grid">
                {visibleDonations.map(item => <div key={item.id} className="ariel-recent-item"><span>{item.name || 'תרומה בעילום שם'}</span><strong>{fmt(item.amount)}</strong></div>)}
              </div>
              {donations.length > INITIAL_DONATIONS_VISIBLE && (
                <button type="button" className="ariel-donations-toggle" aria-expanded={showAllDonations} onClick={() => setShowAllDonations(previous => !previous)}>
                  {showAllDonations ? <>הצג פחות <ChevronUp size={17}/></> : <>הצגת כל התרומות ({donations.length}) <ChevronDown size={17}/></>}
                </button>
              )}
            </>
          ) : <p className="ariel-empty">עדיין אין תרומות מוצגות. אפשר להיות הראשונים.</p>}
        </section>
        <footer className="ariel-footer">מיזם משפחתי עצמאי • התשלומים מאומתים ידנית לפני עדכון הסכום</footer>
      </main>
      {showReport && <PaymentReport amount={amount} privacyNotice={data.privacyNotice} onClose={() => setShowReport(false)} onSubmitted={() => { setShowReport(false); setSubmitted(true); }}/>}
    </div>
  );
}
