import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/context/authContext';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../services/portalService';
import { ROUTES } from '../constants/routes'; 

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

function CategoryModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(
    initial || { name: '', description: '', icon: '📖', color: '#cfa756', order: 0 }
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-[#0d2340]/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#f7f4e9] rounded-xl shadow-2xl border-2 border-[#cfa756] p-6 w-full max-w-md" dir="rtl">
        <h3 className="text-xl font-bold text-[#0d2340] mb-4 border-b border-[#cfa756]/40 pb-2">
          {initial ? 'עריכת קטגוריה' : 'הוספת קטגוריה חדשה'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-[#0d2340]">שם הקטגוריה *</label>
            <input
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#cfa756] outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="לדוג': לימוד תורה"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#0d2340]">תיאור</label>
            <textarea
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#cfa756] outline-none"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-[#0d2340]">אייקון (אמוג'י)</label>
              <input
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-center text-2xl focus:ring-2 focus:ring-[#cfa756] outline-none"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-[#0d2340]">סדר תצוגה</label>
              <input
                type="number"
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#cfa756] outline-none"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">ביטול</button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-4 py-2 bg-[#0d2340] text-[#cfa756] font-bold rounded-md hover:bg-[#1a365d] disabled:opacity-50">
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ category, isAdmin, onEdit, onDelete, onClick }) {
  return (
    <div
      className="relative bg-white border border-[#cfa756]/30 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group"
      onClick={onClick}
    >
      <div className="h-1.5 bg-gradient-to-r from-[#0d2340] via-[#cfa756] to-[#0d2340]" />
      <div className="p-6 flex flex-col items-center text-center gap-3">
        <span className="text-5xl">{category.icon || '📖'}</span>
        <h3 className="text-lg font-bold text-[#0d2340]">{category.name}</h3>
        {category.description && <p className="text-sm text-gray-500">{category.description}</p>}
        <span className="mt-2 text-xs font-medium text-[#cfa756] bg-[#0d2340] px-3 py-1 rounded-full">לחץ לצפייה ←</span>
      </div>
      {isAdmin && (
        <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}>
          <button onClick={onEdit}   className="bg-[#cfa756] text-[#0d2340] text-xs font-bold px-2 py-1 rounded hover:bg-[#b8860b]">✎</button>
          <button onClick={onDelete} className="bg-[#a61b1b] text-white text-xs font-bold px-2 py-1 rounded hover:bg-red-800">✕</button>
        </div>
      )}
    </div>
  );
}

export default function Portal() {
  const navigate    = useNavigate();
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [modal, setModal]           = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchCategories();
      setCategories(res.data);
    } catch { setError('שגיאה בטעינת הקטגוריות'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    if (modal === 'add') await createCategory(form);
    else await updateCategory(modal.category._id, form);
    setModal(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('למחוק קטגוריה זו?')) return;
    await deleteCategory(id);
    load();
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f4e9]">
      <div
  className="relative overflow-hidden"
  dir="rtl"
  style={{
    background:
      'linear-gradient(180deg, rgba(18,32,56,.98) 0%, rgba(13,35,64,.96) 100%)',
    padding: '15px 16px',
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
      פורטל הקדשות ותמיכה
    </h1>

    <p
      style={{
        color: 'rgba(247,244,233,.8)',
        fontSize: '16px',
        letterSpacing: '1px',
      }}
    >
      בחר קטגוריה כדי לצפות בפרטים ולהגיש בקשת הנצחה
    </p>


    <div
      style={{
        width:'70px',
        height:'3px',
        margin:'20px auto 0',
        borderRadius:'5px',
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
      <div className="max-w-5xl mx-auto px-4 py-10">
        {isAdmin && isAdmin() && (
          <div className="flex justify-end mb-6">
            <button onClick={() => setModal('add')}
              className="flex items-center gap-2 bg-[#0d2340] text-[#cfa756] font-bold px-5 py-2.5 rounded-lg hover:bg-[#1a365d] shadow-md">
              <span className="text-lg">+</span> הוסף קטגוריה
            </button>
          </div>
        )}
        {loading && <p className="text-center py-20">טוען...</p>}
        {error   && <p className="text-center text-red-600 py-20">{error}</p>}
        {!loading && !error && categories.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-5xl mb-4">📂</p>
            <p>אין קטגוריות עדיין</p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <CategoryCard
              key={cat._id}
              category={cat}
              isAdmin={isAdmin && isAdmin()}
              onClick={() => navigate(ROUTES.PORTAL_CATEGORY.replace(':categoryId', cat._id))}
              onEdit={() => setModal({ category: cat })}
              onDelete={() => handleDelete(cat._id)}
            />
          ))}
        </div>
      </div>
      {modal && (
        <CategoryModal
          initial={modal !== 'add' ? modal.category : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}