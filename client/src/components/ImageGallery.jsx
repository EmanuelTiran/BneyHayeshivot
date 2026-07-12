import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Edit3, X, Plus,
    Save, Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from './context/authContext';
import {
    fetchGalleryImages,
    createGalleryImage,
    updateGalleryImage,
    deleteGalleryImage,
} from '../services/api';
import ImageUploader from './ImageUploader';
// ─── נירמול כתובת Google Drive ────────────────────────────────────────────────
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

// ─── 3D Carousel constants ────────────────────────────────────────────────────
const CARD_W = 220;   // px – wide side for A4 landscape feel in carousel
const CARD_H = 311;   // px ≈ 220 * (297/210) keeps A4 ratio
const OFFSET_X_1 = 190;
const OFFSET_X_2 = 355;
const OFFSET_Z_1 = -260;
const OFFSET_Z_2 = -400;
const ROTATE_Y = 22;

/** Maps relative position (diff) → CSS transform style object */
function getSlideStyle(diff) {
    const base = {
        position: 'absolute',
        width: CARD_W,
        height: CARD_H,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.55s cubic-bezier(.4,0,.2,1), opacity 0.55s ease, box-shadow 0.55s ease, width 0.55s ease, height 0.55s ease',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        willChange: 'transform, opacity',
    };

    if (diff === 0) return {
        ...base,
        transform: 'translateX(0) translateZ(0) rotateY(0deg)',
        opacity: 1,
        zIndex: 10,
        width: 240,
        height: 339,   // 240 * (297/210)
        boxShadow: '0 24px 64px rgba(0,0,0,0.75)',
        border: '1.5px solid rgba(207,167,86,0.55)',
    };
    if (diff === -1) return {
        ...base,
        transform: `translateX(-${OFFSET_X_1}px) translateZ(${OFFSET_Z_1}px) rotateY(${ROTATE_Y}deg)`,
        opacity: 0.88, zIndex: 8,
        border: '1px solid rgba(255,255,255,0.18)',
    };
    if (diff === -2) return {
        ...base,
        transform: `translateX(-${OFFSET_X_2}px) translateZ(${OFFSET_Z_2}px) rotateY(${ROTATE_Y}deg)`,
        opacity: 0.55, zIndex: 6,
        border: '1px solid rgba(255,255,255,0.10)',
    };
    if (diff === 1) return {
        ...base,
        transform: `translateX(${OFFSET_X_1}px) translateZ(${OFFSET_Z_1}px) rotateY(-${ROTATE_Y}deg)`,
        opacity: 0.88, zIndex: 8,
        border: '1px solid rgba(255,255,255,0.18)',
    };
    if (diff === 2) return {
        ...base,
        transform: `translateX(${OFFSET_X_2}px) translateZ(${OFFSET_Z_2}px) rotateY(-${ROTATE_Y}deg)`,
        opacity: 0.55, zIndex: 6,
        border: '1px solid rgba(255,255,255,0.10)',
    };
    return { ...base, opacity: 0, pointerEvents: 'none', zIndex: 0 };
}

// ─── וריאנטים לאנימציית כיתוב ─────────────────────────────────────────────────
const captionVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.25 } },
};

// ─── וריאנטים לאנימציית Lightbox ─────────────────────────────────────────────
const lightboxVariants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.25 } },
};

// ─── שדה טופס ─────────────────────────────────────────────────────────────────
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

// ─── Lightbox – תצוגת תמונה מלאה ─────────────────────────────────────────────
function Lightbox({ image, onClose }) {
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return (
        <AnimatePresence>
            {image && (
                <motion.div
                    className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={onClose}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 z-10 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all border border-white/20"
                        aria-label="סגור"
                    >
                        <X size={22} />
                    </button>
                    <motion.img
                        src={image.imageUrl}
                        alt={image.title}
                        variants={lightboxVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                        draggable={false}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── מנהל גלריה (מודאל) ───────────────────────────────────────────────────────
function GalleryManagerModal({ isOpen, onClose, images, onRefresh }) {

    const [mode, setMode] = useState('list');
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ imageUrl: '', title: '', description: '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const inputClass = (field) =>
        `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#cfa756] transition ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`;

    const validate = () => {
        const e = {};
        if (!form.title.trim()) e.title = 'שם התמונה הוא שדה חובה';
        if (!form.imageUrl.trim()) e.imageUrl = 'קישור לתמונה הוא שדה חובה';
        return e;
    };

    const openAdd = () => {
        setForm({ imageUrl: '', title: '', description: '' });
        setEditingId(null); setErrors({}); setFeedback(null); setMode('add');
    };

    const openEdit = (img) => {
        setForm({ imageUrl: img.imageUrl, title: img.title, description: img.description || '' });
        setEditingId(img._id); setErrors({}); setFeedback(null); setMode('edit');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק תמונה זו?')) return;
        try {
            await deleteGalleryImage(id);
            onRefresh();
            setFeedback({ type: 'success', message: 'התמונה נמחקה בהצלחה' });
        } catch {
            setFeedback({ type: 'error', message: 'שגיאה במחיקת התמונה' });
        }
    };

    const handleSave = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
        setSaving(true); setFeedback(null);
        const payload = { ...form, imageUrl: normalizeImageUrl(form.imageUrl) };
        try {
            if (mode === 'add') {
                await createGalleryImage(payload);
                setFeedback({ type: 'success', message: 'התמונה נוספה בהצלחה!' });
            } else {
                await updateGalleryImage(editingId, payload);
                setFeedback({ type: 'success', message: 'התמונה עודכנה בהצלחה!' });
            }
            onRefresh(); setMode('list');
        } catch {
            setFeedback({ type: 'error', message: 'אירעה שגיאה. אנא נסה שוב.' });
        } finally { setSaving(false); }
    };

    const handleClose = () => { setMode('list'); setFeedback(null); onClose(); };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-[#0d2340]/70 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
            <div dir="rtl" className="bg-white rounded-2xl border-2 border-[#cfa756]/40 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-bold text-[#0d2340] flex items-center gap-2">
                            <span className="text-[#cfa756]">✦</span>
                            {mode === 'list' ? 'ניהול גלריה' : mode === 'add' ? 'הוספת תמונה' : 'עריכת תמונה'}
                        </h3>
                        {mode === 'list' && (
                            <p className="text-xs text-gray-400 mt-0.5">{images.length} תמונות בגלריה</p>
                        )}
                    </div>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {feedback && (
                    <div className={`mx-6 mt-4 rounded-lg px-4 py-2 text-sm font-medium ${feedback.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-700'}`}>
                        {feedback.message}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6">
                    {mode === 'list' && (
                        <div className="space-y-3">
                            {images.length === 0 && (
                                <div className="text-center py-10 text-gray-400">
                                    <ImageIcon size={32} className="mx-auto mb-3 opacity-40" />
                                    <p className="text-sm">אין תמונות בגלריה. הוסף תמונה ראשונה.</p>
                                </div>
                            )}
                            {images.map((img) => (
                                <div key={img._id}
                                    className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:border-[#cfa756]/40 transition-all group">
                                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 border border-gray-200">
                                        <img src={img.imageUrl} alt={img.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#0d2340] truncate">{img.title}</p>
                                        <p className="text-xs text-gray-400 truncate mt-0.5">{img.description}</p>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(img)}
                                            className="text-xs bg-[#0d2340] text-white px-3 py-1.5 rounded-lg hover:bg-[#1a365d] transition-colors">
                                            עריכה
                                        </button>
                                        <button onClick={() => handleDelete(img._id)}
                                            className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
                                            מחיקה
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={openAdd}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#cfa756]/40 text-[#cfa756] hover:border-[#cfa756] hover:bg-[#cfa756]/5 transition-all text-sm font-medium mt-2">
                                <Plus size={16} />
                                הוסף תמונה חדשה
                            </button>
                        </div>
                    )}

                    {(mode === 'add' || mode === 'edit') && (
                        <div className="space-y-5">
                            <Field label="תמונה *" id="imageUrl" error={errors.imageUrl}>
                                <ImageUploader
                                    onUploaded={(url) => {
                                        setForm((f) => ({ ...f, imageUrl: url }));
                                        setErrors((er) => ({ ...er, imageUrl: undefined }));
                                    }}
                                />

                                <div className="flex items-center gap-2 my-3">
                                    <div className="flex-1 h-px bg-gray-200" />
                                    <span className="text-xs text-gray-400">או הדבק קישור</span>
                                    <div className="flex-1 h-px bg-gray-200" />
                                </div>

                                <input
                                    id="imageUrl" type="text" value={form.imageUrl} dir="ltr"
                                    onChange={(e) => { setForm((f) => ({ ...f, imageUrl: e.target.value })); setErrors((er) => ({ ...er, imageUrl: undefined })); }}
                                    placeholder="https://... או קישור Google Drive"
                                    className={inputClass('imageUrl')}
                                />

                                {form.imageUrl && (
                                    <div className="mt-2 h-28 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                        <img src={normalizeImageUrl(form.imageUrl)} alt="תצוגה מקדימה"
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; }} />
                                    </div>
                                )}
                            </Field>

                            <Field label="כותרת התמונה *" id="title" error={errors.title}>
                                <input
                                    id="title" type="text" value={form.title}
                                    onChange={(e) => { setForm((f) => ({ ...f, title: e.target.value })); setErrors((er) => ({ ...er, title: undefined })); }}
                                    placeholder="שם או תיאור קצר של התמונה"
                                    className={inputClass('title')}
                                />
                            </Field>

                            <Field label="תיאור (אופציונלי)" id="description">
                                <textarea
                                    id="description" value={form.description} rows={3}
                                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                    placeholder="תיאור נוסף..."
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#cfa756] transition resize-none"
                                />
                            </Field>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setMode('list')}
                                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm">
                                    ביטול
                                </button>
                                <button onClick={handleSave} disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 bg-[#cfa756] hover:bg-[#b8860b] disabled:opacity-50 text-[#0d2340] font-bold px-6 py-2.5 rounded-lg transition-colors shadow-sm text-sm">
                                    <Save size={15} />
                                    {saving ? 'שומר...' : mode === 'add' ? 'הוסף תמונה' : 'עדכן תמונה'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── קומפוננטה ראשית ──────────────────────────────────────────────────────────
export default function ImageGallery() {
    const { isAdmin } = useAuth();

    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [index, setIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);

    const loadImages = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetchGalleryImages();
            const normalized = res.data.map((img) => ({
                ...img,
                imageUrl: normalizeImageUrl(img.imageUrl),
            }));
            setImages(normalized);
            setIndex(0);
        } catch {
            setError('שגיאה בטעינת הגלריה');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadImages(); }, [loadImages]);

    const n = images.length;

    /** Returns relative position of slide i to current index, clamped to [-2..2] */
    const getDiff = useCallback((i) => {
        if (n === 0) return 99;
        let d = ((i - index) % n + n) % n;
        if (d > n / 2) d -= n;
        return d;
    }, [index, n]);

    const go = useCallback((dir) => {
        if (n <= 1) return;
        setIndex((i) => (i + dir + n) % n);
    }, [n]);

    const current = images[Math.min(index, n - 1)];

    // ── מצב טעינה ──
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-[#f7f4e9]">
                <div className="w-8 h-8 border-4 border-[#cfa756] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-gray-500">טוען גלריה...</p>
            </div>
        );
    }

    // ── מצב שגיאה ──
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-[#f7f4e9]">
                <p className="text-red-500 text-sm mb-3">{error}</p>
                <button onClick={loadImages} className="text-sm text-[#cfa756] hover:underline">נסה שוב</button>
            </div>
        );
    }

    // ── גלריה ריקה ──
    if (!images.length) {
        return (
            <div dir="rtl" className="flex flex-col items-center justify-center h-64 rounded-2xl bg-white border border-gray-100 shadow-sm text-gray-400 mx-4">
                <ImageIcon size={36} className="mb-3 opacity-40" />
                <p className="text-sm">הגלריה ריקה כרגע</p>
                {isAdmin && isAdmin() && (
                    <button onClick={() => setIsModalOpen(true)}
                        className="mt-4 bg-[#cfa756] hover:bg-[#b8860b] text-[#0d2340] font-bold px-5 py-2 rounded-lg text-sm transition-colors shadow-sm">
                        הוסף תמונה ראשונה
                    </button>
                )}
                <GalleryManagerModal
                    isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
                    images={images} onRefresh={loadImages}
                />
            </div>
        );
    }

    return (
        <>
            {/* ─── Lightbox ─────────────────────────────────────────────────────── */}
            <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />

            <div
                className="flex justify-center items-start py-8 px-4 min-h-screen bg-[#f7f4e9]"
                dir="rtl"
            >
                <div
                    className="relative w-full select-none"
                >
                    {/* ── כותרת ── */}
                    <div className="text-center mb-4">
                        <h1 className="text-2xl font-bold text-[#0d2340] flex items-center justify-center gap-2">
                            <span className="text-[#cfa756]">✦</span>
                            הודעות מערכת
                            <span className="text-[#cfa756]">✦</span>
                        </h1>
                        <div className="w-16 h-0.5 bg-gradient-to-r from-[#cfa756] to-[#b8860b] mx-auto mt-2 rounded-full" />
                    </div>

                    {/* ── מונה תמונות ── */}
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={`counter-${index}`}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
                            exit={{ opacity: 0, transition: { duration: 0.2 } }}
                            className="text-center text-xs font-semibold tracking-[0.25em] uppercase mb-3 text-[#cfa756]"
                        >
                            {String(index + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
                        </motion.p>
                    </AnimatePresence>

                    {/* ─── 3D CAROUSEL SCENE ────────────────────────────────────────── */}
                    {/*
                        perspective מוגדר inline כי Tailwind לא תומך בו ישירות.
                        גובה ה-scene = CARD_H של הכרטיס הפעיל (339px) + מרווח מה.
                    */}
                    <div
                        style={{ perspective: 1000 }}
                        className="relative flex items-center justify-center"
                    >
                        {/* ── כפתור ניווט שמאל ── */}
                        {n > 1 && (
                            <motion.button
                                onClick={() => go(-1)}
                                whileTap={{ scale: 0.88 }}
                                style={{ zIndex: 20 }}
                                className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#0d2340]/10 hover:bg-[#cfa756]/20 border border-[#cfa756]/30 text-[#cfa756] transition-all"
                                aria-label="תמונה קודמת"
                            >
                                {/* RTL: שמאל = קדימה */}
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </motion.button>
                        )}

                        {/* ── Stage – כל הכרטיסים ── */}
                        <div
                            style={{
                                position: 'relative',
                                height: 360,
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transformStyle: 'preserve-3d',
                            }}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            {images.map((img, i) => {
                                const diff = getDiff(i);
                                const slideStyle = getSlideStyle(diff);
                                const isActive = diff === 0;
                                const isVisible = Math.abs(diff) <= 2;

                                if (!isVisible) return null;

                                return (
                                    <div
                                        key={img._id}
                                        style={{
                                            ...slideStyle,
                                            backgroundImage: `url(${img.imageUrl})`,
                                        }}
                                        onClick={() => {
                                            if (isActive) {
                                                setLightboxImage(img);
                                            } else {
                                                setIndex(i);
                                            }
                                        }}
                                    >
                                        {/* gradient overlay on active card */}
                                        {isActive && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    background: 'linear-gradient(to top, rgba(13,35,64,0.85) 0%, rgba(13,35,64,0.08) 50%, transparent 100%)',
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        )}

                                        {/* cursor-zoom-in hint on active */}
                                        {isActive && (
                                            <div style={{ position: 'absolute', inset: 0, cursor: 'zoom-in' }} />
                                        )}

                                        {/* ── כפתור ניהול גלריה – מופיע על הכרטיס הפעיל בריחוף ── */}
                                        {isActive && isAdmin && isAdmin() && (
                                            <AnimatePresence>
                                                {isHovered && (
                                                    <motion.button
                                                        key="edit-btn"
                                                        initial={{ opacity: 0, y: -8, scale: 0.9 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -8, scale: 0.9 }}
                                                        transition={{ duration: 0.2 }}
                                                        onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                                                        style={{ position: 'absolute', top: 16, right: 16, zIndex: 30 }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#0d2340] bg-[#cfa756] hover:bg-[#b8860b] shadow-lg transition-all"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <Edit3 size={12} strokeWidth={2.5} />
                                                        ניהול גלריה
                                                    </motion.button>
                                                )}
                                            </AnimatePresence>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── כפתור ניווט ימין ── */}
                        {n > 1 && (
                            <motion.button
                                onClick={() => go(1)}
                                whileTap={{ scale: 0.88 }}
                                style={{ zIndex: 20 }}
                                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#0d2340]/10 hover:bg-[#cfa756]/20 border border-[#cfa756]/30 text-[#cfa756] transition-all"
                                aria-label="תמונה הבאה"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </motion.button>
                        )}
                    </div>

                    {/* ─── כיתוב תמונה פעילה (מחוץ ל-stage כדי לא להיחסם) ───────── */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`caption-${current?._id ?? index}`}
                            variants={captionVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="text-center mt-5 px-4"
                        >
                            <h2 className="text-xl font-bold text-[#0d2340] leading-tight tracking-tight drop-shadow">
                                {current?.title}
                            </h2>
                            {current?.description && (
                                <p className="text-sm text-[#0d2340]/60 mt-1 leading-relaxed line-clamp-2 max-w-sm mx-auto">
                                    {current.description}
                                </p>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* ── נקודות ניווט ── */}
                    {n > 1 && (
                        <div className="flex justify-center gap-1.5 mt-5">
                            {images.map((_, i) => (
                                <motion.button
                                    key={i}
                                    onClick={() => setIndex(i)}
                                    animate={{ width: i === index ? 24 : 8, opacity: i === index ? 1 : 0.35 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-1.5 rounded-full bg-[#cfa756]"
                                    aria-label={`עבור לתמונה ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── מודאל ניהול גלריה ── */}
            {isModalOpen && (
                <GalleryManagerModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    images={images}
                    onRefresh={loadImages}
                />
            )}
        </>
    );
}