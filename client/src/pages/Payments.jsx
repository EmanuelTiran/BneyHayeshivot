import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchMyPayments, fetchAllPayments, fetchAllUsers,
  addMyDebt, markMyDebtPaid,
  setMyStandingOrder, cancelMyStandingOrder,
  addMyDonation,
  addUserDebt, markUserDebtPaid, deleteUserDebt,
  setUserStandingOrder, cancelUserStandingOrder,
  addUserDonation, deleteUserDonation,
  updateUserNotes,
} from '../services/api';

// ─── כלי עזר ────────────────────────────────────────────────────────────────

const fmt = (amount) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);

const fmtDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('he-IL') : '—';

// ─── Badge סטטוס ─────────────────────────────────────────────────────────────

const Badge = ({ active, labels }) => (
  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
    active
      ? 'bg-green-100 text-green-800 border border-green-300'
      : 'bg-red-100 text-red-700 border border-red-300'
  }`}>
    {active ? labels[0] : labels[1]}
  </span>
);

// ─── כרטיסית סעיף ────────────────────────────────────────────────────────────

const Section = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl border border-[#cfa756]/30 shadow-md overflow-hidden mb-6">
    <div className="bg-gradient-to-r from-[#0d2340] to-[#1a365d] px-5 py-3 flex items-center gap-2">
      <span className="text-[#cfa756] text-xl">{icon}</span>
      <h2 className="text-[#f7f4e9] font-bold text-lg">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ─── טופס הוספת חוב ──────────────────────────────────────────────────────────

function AddDebtForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ description: '', amount: '', dueDate: '' });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, amount: Number(form.amount) });
    setForm({ description: '', amount: '', dueDate: '' });
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200">
      <input
        name="description" value={form.description} onChange={handle} required
        placeholder="תיאור החוב"
        className="border border-gray-300 rounded-lg px-3 py-2 text-right focus:ring-2 focus:ring-[#cfa756] outline-none"
      />
      <input
        name="amount" value={form.amount} onChange={handle} required type="number" min="0"
        placeholder="סכום (₪)"
        className="border border-gray-300 rounded-lg px-3 py-2 text-right focus:ring-2 focus:ring-[#cfa756] outline-none"
      />
      <input
        name="dueDate" value={form.dueDate} onChange={handle} type="date"
        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#cfa756] outline-none"
      />
      <button
        type="submit" disabled={loading}
        className="sm:col-span-3 bg-[#0d2340] hover:bg-[#1a365d] text-[#cfa756] font-bold px-4 py-2 rounded-lg transition-colors"
      >
        {loading ? 'שומר...' : '+ הוסף חוב'}
      </button>
    </form>
  );
}

// ─── טופס הוספת תרומה ────────────────────────────────────────────────────────

function AddDonationForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ description: 'תרומה', amount: '', date: '' });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, amount: Number(form.amount) });
    setForm({ description: 'תרומה', amount: '', date: '' });
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200">
      <input
        name="description" value={form.description} onChange={handle} required
        placeholder="תיאור התרומה"
        className="border border-gray-300 rounded-lg px-3 py-2 text-right focus:ring-2 focus:ring-[#cfa756] outline-none"
      />
      <input
        name="amount" value={form.amount} onChange={handle} required type="number" min="0"
        placeholder="סכום (₪)"
        className="border border-gray-300 rounded-lg px-3 py-2 text-right focus:ring-2 focus:ring-[#cfa756] outline-none"
      />
      <input
        name="date" value={form.date} onChange={handle} type="date"
        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#cfa756] outline-none"
      />
      <button
        type="submit" disabled={loading}
        className="sm:col-span-3 bg-[#0d2340] hover:bg-[#1a365d] text-[#cfa756] font-bold px-4 py-2 rounded-lg transition-colors"
      >
        {loading ? 'שומר...' : '+ הוסף תרומה'}
      </button>
    </form>
  );
}

// ─── טופס הוראת קבע ──────────────────────────────────────────────────────────

function StandingOrderForm({ current, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    amount:      current?.amount     || '',
    dayOfMonth:  current?.dayOfMonth || 1,
    description: current?.description || 'הוראת קבע חודשית',
  });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, amount: Number(form.amount), dayOfMonth: Number(form.dayOfMonth) });
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200">
      <input
        name="description" value={form.description} onChange={handle} required
        placeholder="תיאור"
        className="border border-gray-300 rounded-lg px-3 py-2 text-right focus:ring-2 focus:ring-[#cfa756] outline-none"
      />
      <input
        name="amount" value={form.amount} onChange={handle} required type="number" min="0"
        placeholder="סכום חודשי (₪)"
        className="border border-gray-300 rounded-lg px-3 py-2 text-right focus:ring-2 focus:ring-[#cfa756] outline-none"
      />
      <input
        name="dayOfMonth" value={form.dayOfMonth} onChange={handle} type="number" min="1" max="28"
        placeholder="יום בחודש (1-28)"
        className="border border-gray-300 rounded-lg px-3 py-2 text-right focus:ring-2 focus:ring-[#cfa756] outline-none"
      />
      <div className="sm:col-span-3 flex gap-3">
        <button type="submit" disabled={loading}
          className="flex-1 bg-[#0d2340] hover:bg-[#1a365d] text-[#cfa756] font-bold px-4 py-2 rounded-lg transition-colors">
          {loading ? 'שומר...' : 'שמור הוראת קבע'}
        </button>
        {current?.isActive && (
          <button type="button" onClick={onCancel} disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg transition-colors">
            בטל הוראת קבע
          </button>
        )}
      </div>
    </form>
  );
}

// ─── תצוגת תשלומים – משתמש רגיל ──────────────────────────────────────────────

function MyPaymentsView() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [showSOForm, setShowSOForm] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchMyPayments();
      setData(res.data);
    } catch {
      setError('שגיאה בטעינת נתוני התשלומים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const withSave = async (fn) => {
    setSaving(true);
    setError('');
    try {
      await fn();
      await reload();
    } catch {
      setError('שגיאה בשמירה, נסה שוב');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center py-10 text-[#0d2340]">טוען נתונים...</p>;
  if (!data)   return <p className="text-center py-10 text-red-600">{error}</p>;

  const openDebts  = data.debts?.filter(d => !d.isPaid) || [];
  const closedDebts = data.debts?.filter(d => d.isPaid) || [];
  const totalDebt  = openDebts.reduce((s, d) => s + d.amount, 0);

  return (
    <div dir="rtl" className="max-w-3xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#0d2340]">הנתונים הכספיים שלי</h1>
        <p className="text-gray-500 mt-1">כל המידע הפיננסי שלך במקום אחד</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 mb-4 text-right">
          {error}
        </div>
      )}

      {/* סיכום */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'סך חובות פתוחים', value: fmt(totalDebt), color: totalDebt > 0 ? 'text-red-600' : 'text-green-600' },
          { label: 'תרומות שבוצעו',  value: data.donations?.length || 0, color: 'text-[#0d2340]' },
          { label: 'הוראת קבע',      value: data.standingOrder?.isActive ? fmt(data.standingOrder.amount) : 'לא פעילה', color: 'text-[#0d2340]' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-[#cfa756]/30 shadow-sm p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* חובות */}
      <Section title="חובות פתוחים" icon="⚠️">
        {openDebts.length === 0 ? (
          <p className="text-green-600 font-medium">אין חובות פתוחים 🎉</p>
        ) : (
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="pb-2">תיאור</th>
                <th className="pb-2">סכום</th>
                <th className="pb-2">תאריך יעד</th>
                <th className="pb-2">שולם</th>
              </tr>
            </thead>
            <tbody>
              {openDebts.map(debt => (
                <tr key={debt._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 font-medium">{debt.description}</td>
                  <td className="py-2 text-red-600 font-bold">{fmt(debt.amount)}</td>
                  <td className="py-2 text-gray-500">{fmtDate(debt.dueDate)}</td>
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => withSave(() => markMyDebtPaid(debt._id, true))}
                      className="w-4 h-4 accent-[#0d2340] cursor-pointer"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {closedDebts.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-[#0d2340]">
              הצג חובות ששולמו ({closedDebts.length})
            </summary>
            <table className="w-full text-right text-sm mt-2">
              <tbody>
                {closedDebts.map(debt => (
                  <tr key={debt._id} className="opacity-60 border-b border-gray-100">
                    <td className="py-1 line-through">{debt.description}</td>
                    <td className="py-1">{fmt(debt.amount)}</td>
                    <td className="py-1 text-green-600">שולם {fmtDate(debt.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </Section>

      {/* הוראת קבע */}
      <Section title="הוראת קבע" icon="🔄">
        {data.standingOrder ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-[#0d2340]">{data.standingOrder.description}</p>
              <p className="text-2xl font-bold text-[#0d2340] mt-1">{fmt(data.standingOrder.amount)}</p>
              <p className="text-sm text-gray-500 mt-1">
                בכל ה-{data.standingOrder.dayOfMonth} לחודש
              </p>
            </div>
            <Badge active={data.standingOrder.isActive} labels={['פעילה', 'מבוטלת']} />
          </div>
        ) : (
          <p className="text-gray-500">לא הוגדרה הוראת קבע</p>
        )}

        <button
          onClick={() => setShowSOForm(v => !v)}
          className="mt-3 text-sm text-[#0d2340] hover:text-[#cfa756] underline"
        >
          {showSOForm ? 'סגור' : data.standingOrder ? 'ערוך הוראת קבע' : 'הגדר הוראת קבע'}
        </button>

        {showSOForm && (
          <StandingOrderForm
            current={data.standingOrder}
            loading={saving}
            onSave={(d) => withSave(() => setMyStandingOrder(d)).then(() => setShowSOForm(false))}
            onCancel={() => withSave(() => cancelMyStandingOrder()).then(() => setShowSOForm(false))}
          />
        )}
      </Section>

      {/* תרומות */}
      <Section title="היסטוריית תרומות" icon="💛">
        {(!data.donations || data.donations.length === 0) ? (
          <p className="text-gray-500">טרם בוצעו תרומות</p>
        ) : (
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="pb-2">תיאור</th>
                <th className="pb-2">סכום</th>
                <th className="pb-2">תאריך</th>
              </tr>
            </thead>
            <tbody>
              {[...data.donations].reverse().map(don => (
                <tr key={don._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 font-medium">{don.description}</td>
                  <td className="py-2 text-green-600 font-bold">{fmt(don.amount)}</td>
                  <td className="py-2 text-gray-500">{fmtDate(don.date)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold text-[#0d2340]">
                <td className="pt-3">סה"כ</td>
                <td className="pt-3 text-green-700">
                  {fmt(data.donations.reduce((s, d) => s + d.amount, 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </Section>
    </div>
  );
}

// ─── תצוגת תשלומים – אדמין ───────────────────────────────────────────────────

function AdminPaymentsView() {
  const [allData, setAllData]   = useState([]);
  const [users, setUsers]       = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [notesText, setNotesText] = useState('');
  const [showDebtForm, setShowDebtForm]   = useState(false);
  const [showDonForm, setShowDonForm]     = useState(false);
  const [showSOForm, setShowSOForm]       = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const [paymentsRes, usersRes] = await Promise.all([fetchAllPayments(), fetchAllUsers()]);
      setAllData(paymentsRes.data);
      setUsers(usersRes.data);
    } catch {
      setError('שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const selected = allData.find(p => p.user?._id === selectedId);

  useEffect(() => {
    if (selected) setNotesText(selected.notes || '');
  }, [selected]);

  const withSave = async (fn) => {
    setSaving(true);
    setError('');
    try {
      await fn();
      await reload();
    } catch {
      setError('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center py-10">טוען נתונים...</p>;

  return (
    <div dir="rtl" className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-[#0d2340] text-center mb-8">ניהול תשלומים</h1>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">

        {/* רשימת מתפללים */}
        <aside className="lg:w-72 bg-white rounded-xl border border-[#cfa756]/30 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-[#0d2340] to-[#1a365d] px-4 py-3">
            <h2 className="text-[#cfa756] font-bold">רשימת מתפללים</h2>
          </div>
          <ul className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
            {users.map(user => {
              const rec = allData.find(p => p.user?._id === user._id);
              const openDebt = rec?.debts?.filter(d => !d.isPaid).reduce((s, d) => s + d.amount, 0) || 0;
              return (
                <li key={user._id}>
                  <button
                    onClick={() => setSelectedId(user._id)}
                    className={`w-full text-right px-4 py-3 hover:bg-[#f7f4e9] transition-colors ${
                      selectedId === user._id ? 'bg-[#f7f4e9] border-r-4 border-[#cfa756]' : ''
                    }`}
                  >
                    <p className="font-semibold text-[#0d2340]">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    {openDebt > 0 && (
                      <p className="text-xs text-red-600 font-bold mt-0.5">חוב: {fmt(openDebt)}</p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* פרטי משתמש נבחר */}
        <main className="flex-1">
          {!selectedId ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              בחר מתפלל מהרשימה
            </div>
          ) : !selected ? (
            <div className="text-center text-gray-500 py-10">
              <p>אין עדיין נתוני תשלום למתפלל זה</p>
              <button
                onClick={() => withSave(() => addUserDebt(selectedId, { description: 'חוב ראשוני', amount: 0 }))}
                className="mt-4 bg-[#0d2340] text-[#cfa756] px-4 py-2 rounded-lg font-bold"
              >
                צור רשומה
              </button>
            </div>
          ) : (
            <>
              {/* כותרת */}
              <div className="bg-white rounded-xl border border-[#cfa756]/30 shadow-md p-5 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-[#0d2340]">{selected.user?.name}</h2>
                    <p className="text-sm text-gray-500">{selected.user?.email}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-500">עודכן לאחרונה</p>
                    <p className="font-medium">{fmtDate(selected.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* חובות */}
              <Section title="חובות" icon="⚠️">
                {selected.debts?.length === 0 ? (
                  <p className="text-gray-500 text-sm">אין חובות רשומים</p>
                ) : (
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500">
                        <th className="pb-2">תיאור</th>
                        <th className="pb-2">סכום</th>
                        <th className="pb-2">יעד</th>
                        <th className="pb-2">סטטוס</th>
                        <th className="pb-2">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.debts.map(debt => (
                        <tr key={debt._id} className={`border-b border-gray-100 ${debt.isPaid ? 'opacity-50' : ''}`}>
                          <td className="py-2">{debt.description}</td>
                          <td className="py-2 font-bold">{fmt(debt.amount)}</td>
                          <td className="py-2 text-gray-500">{fmtDate(debt.dueDate)}</td>
                          <td className="py-2">
                            <Badge active={debt.isPaid} labels={['שולם', 'פתוח']} />
                          </td>
                          <td className="py-2">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => withSave(() => markUserDebtPaid(selectedId, debt._id, !debt.isPaid))}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                              >
                                {debt.isPaid ? 'סמן כפתוח' : 'סמן כשולם'}
                              </button>
                              <button
                                onClick={() => withSave(() => deleteUserDebt(selectedId, debt._id))}
                                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                              >
                                מחק
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <button onClick={() => setShowDebtForm(v => !v)}
                  className="mt-3 text-sm text-[#0d2340] hover:text-[#cfa756] underline">
                  {showDebtForm ? 'סגור' : '+ הוסף חוב'}
                </button>
                {showDebtForm && (
                  <AddDebtForm
                    loading={saving}
                    onSubmit={(d) => withSave(() => addUserDebt(selectedId, d)).then(() => setShowDebtForm(false))}
                  />
                )}
              </Section>

              {/* הוראת קבע */}
              <Section title="הוראת קבע" icon="🔄">
                {selected.standingOrder ? (
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-semibold">{selected.standingOrder.description}</p>
                      <p className="text-xl font-bold text-[#0d2340]">{fmt(selected.standingOrder.amount)}</p>
                      <p className="text-sm text-gray-500">יום {selected.standingOrder.dayOfMonth} בחודש</p>
                    </div>
                    <Badge active={selected.standingOrder.isActive} labels={['פעילה', 'מבוטלת']} />
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">לא הוגדרה הוראת קבע</p>
                )}
                <button onClick={() => setShowSOForm(v => !v)}
                  className="mt-3 text-sm text-[#0d2340] hover:text-[#cfa756] underline">
                  {showSOForm ? 'סגור' : selected.standingOrder ? 'ערוך' : 'הגדר'}
                </button>
                {showSOForm && (
                  <StandingOrderForm
                    current={selected.standingOrder}
                    loading={saving}
                    onSave={(d) => withSave(() => setUserStandingOrder(selectedId, d)).then(() => setShowSOForm(false))}
                    onCancel={() => withSave(() => cancelUserStandingOrder(selectedId)).then(() => setShowSOForm(false))}
                  />
                )}
              </Section>

              {/* תרומות */}
              <Section title="תרומות" icon="💛">
                {!selected.donations?.length ? (
                  <p className="text-gray-500 text-sm">אין תרומות רשומות</p>
                ) : (
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500">
                        <th className="pb-2">תיאור</th>
                        <th className="pb-2">סכום</th>
                        <th className="pb-2">תאריך</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...selected.donations].reverse().map(don => (
                        <tr key={don._id} className="border-b border-gray-100">
                          <td className="py-2">{don.description}</td>
                          <td className="py-2 text-green-600 font-bold">{fmt(don.amount)}</td>
                          <td className="py-2 text-gray-500">{fmtDate(don.date)}</td>
                          <td className="py-2">
                            <button
                              onClick={() => withSave(() => deleteUserDonation(selectedId, don._id))}
                              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                            >
                              מחק
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <button onClick={() => setShowDonForm(v => !v)}
                  className="mt-3 text-sm text-[#0d2340] hover:text-[#cfa756] underline">
                  {showDonForm ? 'סגור' : '+ הוסף תרומה'}
                </button>
                {showDonForm && (
                  <AddDonationForm
                    loading={saving}
                    onSubmit={(d) => withSave(() => addUserDonation(selectedId, d)).then(() => setShowDonForm(false))}
                  />
                )}
              </Section>

              {/* הערות */}
              <Section title="הערות פנימיות" icon="📝">
                <textarea
                  value={notesText}
                  onChange={e => setNotesText(e.target.value)}
                  rows={4}
                  placeholder="הערות פנימיות (לא גלויות למתפלל)..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right focus:ring-2 focus:ring-[#cfa756] outline-none"
                />
                <button
                  onClick={() => withSave(() => updateUserNotes(selectedId, notesText))}
                  disabled={saving}
                  className="mt-2 bg-[#0d2340] hover:bg-[#1a365d] text-[#cfa756] font-bold px-4 py-2 rounded-lg transition-colors"
                >
                  {saving ? 'שומר...' : 'שמור הערות'}
                </button>
              </Section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── עמוד ראשי – מחליט מה להציג ─────────────────────────────────────────────

export default function Payments() {
  const navigate = useNavigate();

  const rawUser = localStorage.getItem('user');
  const user    = rawUser ? JSON.parse(rawUser) : null;

  useEffect(() => {
    if (!user) navigate('/login', { state: { from: '/payments' } });
  }, [user, navigate]);

  if (!user) return null;

  return user.role === 'admin'
    ? <AdminPaymentsView />
    : <MyPaymentsView />;
}