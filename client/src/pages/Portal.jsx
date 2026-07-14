import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/context/authContext';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../services/portalService';
import { ROUTES } from '../constants/routes';
import PageHeader from '../components/common/PageHeader';
import ImageUploader from '../components/ImageUploader';

// ── נירמול קישורי Google Drive (זהה ל-Commemorations.jsx) ──────────────────
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

function CategoryModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(
    initial || { name: '', description: '', icon: '📖', color: '#cfa756', imageUrl: '', order: 0 }
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

          {/* ── תמונת רקע לקטגוריה ─────────────────────────────────────── */}
          <div>
            <label className="text-sm font-medium text-[#0d2340] mb-1 block">
              תמונת רקע (אופציונלי)
            </label>

            <ImageUploader
              onUploaded={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
            />

            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] text-gray-400">או הדבק קישור</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <input
              type="url"
              dir="ltr"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-left focus:ring-2 focus:ring-[#cfa756] outline-none"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://... או קישור Google Drive"
            />

            {form.imageUrl && (
              <div className="relative mt-2 h-28 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={normalizeImageUrl(form.imageUrl)}
                  alt="תצוגה מקדימה"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                  className="absolute top-1.5 left-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  title="הסר תמונה"
                >
                  ✕
                </button>
              </div>
            )}
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

function CategoryCard({ category, isAdmin, onEdit, onDelete, onClick, onMouseEnter, onMouseLeave }) {
  const bgImage = category.imageUrl ? normalizeImageUrl(category.imageUrl) : null;

  return (
    <div
      className="relative bg-white border border-[#cfa756]/30 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="h-1.5 bg-gradient-to-r from-[#0d2340] via-[#cfa756] to-[#0d2340]" />

      <div
        className="relative p-6 flex flex-col items-center text-center gap-3"
        style={bgImage ? {
          backgroundImage: `linear-gradient(rgba(13,35,64,.72), rgba(13,35,64,.72)), url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        <span className="text-5xl">{category.icon || '📖'}</span>
        <h3 className={`text-lg font-bold ${bgImage ? 'text-white' : 'text-[#0d2340]'}`}>
          {category.name}
        </h3>
        {category.description && (
          <p className={`text-sm ${bgImage ? 'text-gray-100' : 'text-gray-500'}`}>
            {category.description}
          </p>
        )}
        <span className="mt-2 text-xs font-medium text-[#cfa756] bg-[#0d2340] px-3 py-1 rounded-full">לחץ לצפייה ←</span>
      </div>

      {isAdmin && (
        <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}>
          <button onClick={onEdit} className="bg-[#cfa756] text-[#0d2340] text-xs font-bold px-2 py-1 rounded hover:bg-[#b8860b]">✎</button>
          <button onClick={onDelete} className="bg-[#a61b1b] text-white text-xs font-bold px-2 py-1 rounded hover:bg-red-800">✕</button>
        </div>
      )}
    </div>
  );
}

export default function Portal() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const activeBgImage = hoveredCategory?.imageUrl
    ? normalizeImageUrl(hoveredCategory.imageUrl)
    : null;

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
    <div
      dir="rtl"
      className="min-h-screen transition-all duration-500"
      style={{
        backgroundColor: '#f7f4ee',
        backgroundImage: activeBgImage
          ? `linear-gradient(rgba(247,244,238,.88), rgba(247,244,238,.88)), url(${activeBgImage})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <PageHeader
        title="פורטל הקדשות ותמיכה"
        subtitle="בחר קטגוריה כדי לצפות בפרטים ולהגיש בקשת הנצחה"
      />

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
        {error && <p className="text-center text-red-600 py-20">{error}</p>}
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
              onMouseEnter={() => setHoveredCategory(cat)}
              onMouseLeave={() => setHoveredCategory(null)}
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
