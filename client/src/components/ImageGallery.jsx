import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Edit3, X, Plus, Trash2,
    Save, Image as ImageIcon, AlignLeft, Type,
} from 'lucide-react';
import { useAuth } from './context/authContext';
import {
    fetchGalleryImages,
    createGalleryImage,
    updateGalleryImage,
    deleteGalleryImage,
} from '../services/api';

// ─── Drive URL normalization ──────────────────────────────────────────────────
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

// ─── Field component (kept as-is) ────────────────────────────────────────────
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

// ─── GalleryManagerModal (kept exactly as-is) ────────────────────────────────
function GalleryManagerModal({ isOpen, onClose, images, onRefresh }) {
    const [mode, setMode] = useState('list');
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ imageUrl: '', title: '', description: '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const inputClass = (field) =>
        `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#cfa756] transition ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
        }`;

    const validate = () => {
        const e = {};
        if (!form.title.trim()) e.title = 'שם התמונה הוא שדה חובה';
        if (!form.imageUrl.trim()) e.imageUrl = 'קישור לתמונה הוא שדה חובה';
        return e;
    };

    const openAdd = () => {
        setForm({ imageUrl: '', title: '', description: '' });
        setEditingId(null);
        setErrors({});
        setFeedback(null);
        setMode('add');
    };

    const openEdit = (img) => {
        setForm({ imageUrl: img.imageUrl, title: img.title, description: img.description || '' });
        setEditingId(img._id);
        setErrors({});
        setFeedback(null);
        setMode('edit');
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
        setSaving(true);
        setFeedback(null);
        const payload = { ...form, imageUrl: normalizeImageUrl(form.imageUrl) };
        try {
            if (mode === 'add') {
                await createGalleryImage(payload);
                setFeedback({ type: 'success', message: 'התמונה נוספה בהצלחה!' });
            } else {
                await updateGalleryImage(editingId, payload);
                setFeedback({ type: 'success', message: 'התמונה עודכנה בהצלחה!' });
            }
            onRefresh();
            setMode('list');
        } catch {
            setFeedback({ type: 'error', message: 'אירעה שגיאה. אנא נסה שוב.' });
        } finally {
            setSaving(false);
        }
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
                        : 'bg-red-50 border border-red-200 text-red-700'
                        }`}>
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
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
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
                            <Field label="קישור לתמונה *" id="imageUrl" error={errors.imageUrl}>
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
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
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

// ─── Film Strip Carousel Card ─────────────────────────────────────────────────
// Renders a single card in the strip. Position relative to active: -1, 0, +1, etc.
function CarouselCard({ image, position, onClick }) {
    const isActive = position === 0;
    const isPrev = position === -1;
    const isNext = position === 1;
    const isVisible = Math.abs(position) <= 1;

    // Spatial layout parameters
    const SIDE_SCALE = 0.78;
    const SIDE_OPACITY = 0.42;
    const SIDE_X_PCT = 72; // percent of card width to offset left/right cards

    const scale = isActive ? 1 : SIDE_SCALE;
    const opacity = isActive ? 1 : isVisible ? SIDE_OPACITY : 0;
    const x = isActive ? '0%' : position < 0 ? `-${SIDE_X_PCT}%` : `${SIDE_X_PCT}%`;
    const zIndex = isActive ? 10 : isVisible ? 5 : 0;
    const blur = isActive ? 0 : isVisible ? 1.5 : 0;

    return (
        <motion.div
            className="absolute inset-0 cursor-pointer rounded-xl border border-[#cfa756]/30"
            style={{ zIndex }}
            animate={{ scale, opacity, x, filter: `blur(${blur}px)` }}
            transition={{ duration: 0.85, ease: [0.45, 0.46, 0.45, 0.94] }}
            onClick={() => !isActive && onClick(position)}
            aria-hidden={!isActive}
        >


            {/* Image area */}
            <div className="absolute inset-0 overflow-hidden bg-[#0d2340] rounded-xl">
                <AnimatePresence mode="crossfade">
                    <motion.img
                        key={image?._id ?? image?.imageUrl}
                        src={image?.imageUrl}
                        alt={image?.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        draggable={false}
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.65, ease: 'easeInOut' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </AnimatePresence>
                {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d2340]/80 via-[#0d2340]/10 to-transparent" />
                )}
                {/* Active caption */}
                {isActive && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={image?._id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: 0.88, duration: 0.5, ease: 'easeOut' } }}

                            exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                            className="absolute bottom-0 left-0 right-0 p-5 z-10"
                            dir="rtl"
                        >
                            <h2 className="text-xl font-bold text-white leading-tight tracking-tight drop-shadow-lg">
                                {image?.title}
                            </h2>
                            {image?.description && (
                                <p className="text-sm text-white/65 mt-1 leading-relaxed line-clamp-2">
                                    {image.description}
                                </p>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>

            {/* Gold frame accent on active */}
            {isActive && (
                <div
                    className="absolute inset-0 rounded-xl pointer-events-none z-20"
                    style={{ boxShadow: '0 0 0 2px #cfa756, 0 8px 40px rgba(207,167,86,0.18)' }}
                />
            )}
        </motion.div>
    );
}

// ─── Main ImageGallery component ─────────────────────────────────────────────
export default function ImageGallery() {
    const { isAdmin } = useAuth();

    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [index, setIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Drag state
    const dragX = useMotionValue(0);
    const DRAG_THRESHOLD = 60; // px to trigger slide
    const isDragging = useRef(false);

    const loadImages = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchGalleryImages();
            setImages(res.data);
            setIndex(0);
        } catch {
            setError('שגיאה בטעינת הגלריה');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadImages(); }, [loadImages]);

    const go = useCallback((dir) => {
        if (images.length <= 1) return;
        setIndex((i) => (i + dir + images.length) % images.length);
    }, [images.length]);

    const handleDragEnd = useCallback((_, info) => {
        const offset = info.offset.x;
        // RTL: drag right = prev image; drag left = next image
        if (offset < -DRAG_THRESHOLD) go(1);
        else if (offset > DRAG_THRESHOLD) go(-1);
        animate(dragX, 0, { duration: 0.3 });
    }, [go, dragX]);

    // Loading state
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-[#f7f4e9]">
                <div className="w-8 h-8 border-4 border-[#cfa756] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-gray-500">טוען גלריה...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-[#f7f4e9]">
                <p className="text-red-500 text-sm mb-3">{error}</p>
                <button onClick={loadImages} className="text-sm text-[#cfa756] hover:underline">נסה שוב</button>
            </div>
        );
    }

    // Empty state
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

    // Build visible slots: prev | active | next
    const getImage = (offset) => images[(index + offset + images.length) % images.length];

    return (
        <>
            <div
                className="flex flex-col items-center py-8 px-4 bg-[#f7f4e9] min-h-screen"
                dir="rtl"
            >
                {/* Page title */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[#0d2340] flex items-center justify-center gap-2">
                        <span className="text-[#cfa756]">✦</span>
                        גלריית תמונות
                    </h1>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-[#cfa756] to-[#b8860b] mx-auto mt-2 rounded-full" />
                </div>

                {/* Counter */}
                <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-4 text-[#cfa756]">
                    {String(index + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
                </p>

                {/* Carousel stage */}
                <div
                    className="relative w-full max-w-2xl select-none"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* 16:9 aspect ratio wrapper */}
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>

                        {/* Drag surface — full stage */}
                        <motion.div
                            className="absolute inset-0"
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.12}
                            style={{ x: dragX }}
                            onDragStart={() => { isDragging.current = true; }}
                            onDragEnd={handleDragEnd}
                        >
                            {/* Render prev, active, next */}
                            {[-1, 0, 1].map((pos) => (
                                <CarouselCard
                                    key={`${index}-${pos}`}
                                    image={getImage(pos)}
                                    position={pos}
                                    onClick={(dir) => go(dir)}
                                />
                            ))}
                        </motion.div>

                        {/* Nav arrows — outside drag surface so clicks are reliable */}
                        {images.length > 1 && (
                            <>
                                <motion.button
                                    onClick={() => go(-1)}
                                    whileTap={{ scale: 0.88 }}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 p-2.5 rounded-full bg-[#0d2340]/60 backdrop-blur-md border border-[#cfa756]/40 text-[#cfa756] hover:bg-[#0d2340]/90 transition-all shadow-lg"
                                    aria-label="תמונה קודמת"
                                >
                                    <ChevronLeft size={22} strokeWidth={2.5} />
                                </motion.button>

                                <motion.button
                                    onClick={() => go(1)}
                                    whileTap={{ scale: 0.88 }}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-30 p-2.5 rounded-full bg-[#0d2340]/60 backdrop-blur-md border border-[#cfa756]/40 text-[#cfa756] hover:bg-[#0d2340]/90 transition-all shadow-lg"
                                    aria-label="תמונה הבאה"
                                >
                                    <ChevronRight size={22} strokeWidth={2.5} />
                                </motion.button>
                            </>
                        )}

                        {/* Admin manage button */}
                        {isAdmin && isAdmin() && (
                            <AnimatePresence>
                                {isHovered && (
                                    <motion.button
                                        key="edit-btn"
                                        initial={{ opacity: 0, y: -8, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                        onClick={() => setIsModalOpen(true)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="absolute top-6 right-6 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#0d2340] bg-[#cfa756] hover:bg-[#b8860b] shadow-lg transition-all"
                                    >
                                        <Edit3 size={12} strokeWidth={2.5} />
                                        ניהול גלריה
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        )}
                    </div>

                    {/* Drag hint */}
                    <p className="text-center text-xs text-gray-400 mt-3 tracking-wide select-none">
                        ← גרור כדי לנווט →
                    </p>

                    {/* Dot navigation */}
                    {images.length > 1 && (
                        <div className="flex justify-center gap-1.5 mt-4">
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

            {/* Manager modal */}
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