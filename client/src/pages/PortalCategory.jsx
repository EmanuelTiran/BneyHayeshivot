import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../components/context/authContext'; 
import { fetchCategories, fetchItemsByCategory, createItem, updateItem, deleteItem } from '../services/portalService';
import {ROUTES} from '../constants/routes';

function ItemModal({ initial, categoryId, onClose, onSave }) {
  const [form, setForm] = useState(
    initial || { title: '', description: '', date: '', price: 0, available: true, order: 0, categoryId }
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-[#0d2340]/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#f7f4e9] rounded-xl shadow-2xl border-2 border-[#cfa756] p-6 w-full max-w-md" dir="rtl">
        <h3 className="text-xl font-bold text-[#0d2340] mb-4 border-b border-[#cfa756]/40 pb-2">
          {initial ? 'עריכת פריט' : 'הוספת פריט חדש'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-[#0d2340]">כותרת *</label>
            <input className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#cfa756] outline-none"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="לדוג': שיעור יומי — כ׳ תמוז" />
          </div>
          <div>
            <label className="text-sm font-medium text-[#0d2340]">תיאור</label>
            <textarea className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#cfa756] outline-none"
              rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-[#0d2340]">תאריך / פרק</label>
              <input className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#cfa756] outline-none"
                value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="כ׳ תמוז תשפ״ה" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-[#0d2340]">מחיר (₪)</label>
              <input type="number" className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#cfa756] outline-none"
                value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="available" checked={form.available}
              onChange={(e) => setForm({ ...form, available: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="available" className="text-sm font-medium text-[#0d2340]">זמין לתמיכה</label>
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

function ItemCard({ item, isAdmin, onEdit, onDelete, onClick }) {
  return (
    <div
      className={`relative bg-white border rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer group overflow-hidden
        ${item.available ? 'border-[#cfa756]/30' : 'border-gray-200 opacity-60'}`}
      onClick={onClick}
    >
      <div className="h-1 bg-gradient-to-r from-[#0d2340] via-[#cfa756] to-[#0d2340]" />
      <div className="p-5 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <h3 className="text-base font-bold text-[#0d2340]">{item.title}</h3>
          {item.price > 0 && (
            <span className="text-sm font-bold text-[#0d2340] bg-[#cfa756]/20 border border-[#cfa756] px-2 py-0.5 rounded-full mr-2 whitespace-nowrap">
              ₪{item.price}
            </span>
          )}
        </div>
        {item.date        && <p className="text-xs text-[#cfa756] font-medium">📅 {item.date}</p>}
        {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
        {!item.available  && <span className="text-xs text-red-500 font-medium">• לא זמין</span>}
        <span className="mt-1 text-xs font-medium text-[#cfa756] self-start bg-[#0d2340] px-2 py-0.5 rounded-full">לפרטים ←</span>
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

export default function PortalCategory() {
  const { categoryId } = useParams();
  const navigate       = useNavigate();
  const { isAdmin }    = useAuth();
  const [category, setCategory] = useState(null);
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const [catRes, itemsRes] = await Promise.all([fetchCategories(), fetchItemsByCategory(categoryId)]);
      setCategory(catRes.data.find((c) => c._id === categoryId) || null);
      setItems(itemsRes.data);
    } catch { setError('שגיאה בטעינת הנתונים'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [categoryId]);

  const handleSave = async (form) => {
    if (modal === 'add') await createItem({ ...form, categoryId });
    else await updateItem(modal.item._id, form);
    setModal(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('למחוק פריט זה?')) return;
    await deleteItem(id);
    load();
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f4e9]">
      <div className="bg-gradient-to-b from-[#0d2340] to-[#1a365d] py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(ROUTES.PORTAL)} className="text-[#cfa756] text-sm mb-4 flex items-center gap-1 hover:underline">
            → חזרה לקטגוריות
          </button>
          <h1 className="text-3xl font-bold text-[#cfa756]">
            {category ? `${category.icon || ''} ${category.name}` : 'טוען...'}
          </h1>
          {category?.description && <p className="text-[#f7f4e9]/70 mt-1">{category.description}</p>}
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {isAdmin && isAdmin() && (
          <div className="flex justify-end mb-6">
            <button onClick={() => setModal('add')}
              className="flex items-center gap-2 bg-[#0d2340] text-[#cfa756] font-bold px-5 py-2.5 rounded-lg hover:bg-[#1a365d] shadow-md">
              <span className="text-lg">+</span> הוסף פריט
            </button>
          </div>
        )}
        {loading && <p className="text-center py-20">טוען...</p>}
        {error   && <p className="text-center text-red-600 py-20">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-20 text-gray-500"><p className="text-5xl mb-4">📋</p><p>אין פריטים בקטגוריה זו</p></div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {items.map((item) => (
            <ItemCard
              key={item._id}
              item={item}
              isAdmin={isAdmin && isAdmin()}
              onClick={() => navigate(ROUTES.PORTAL_ITEM.replace(':itemId', item._id))}
              onEdit={() => setModal({ item })}
              onDelete={() => handleDelete(item._id)}
            />
          ))}
        </div>
      </div>
      {modal && (
        <ItemModal
          initial={modal !== 'add' ? modal.item : null}
          categoryId={categoryId}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}