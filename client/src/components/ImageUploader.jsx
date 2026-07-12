import { useState, useRef, useCallback } from 'react';
import { UploadCloud, Loader2, CheckCircle2, XCircle, X } from 'lucide-react';

// ─── הגדרות imgbb ──────────────────────────────────────────────────────────
// חשוב: אל תשמור את המפתח ישירות בקוד. הגדר אותו כמשתנה סביבה.
// Vite:            VITE_IMGBB_API_KEY=xxxx   -> import.meta.env.VITE_IMGBB_API_KEY
// Create React App: REACT_APP_IMGBB_API_KEY=xxxx -> process.env.REACT_APP_IMGBB_API_KEY
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY ;
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

/**
 * מעלה קובץ תמונה ל-imgbb ומחזיר את כתובת ה-URL הסופית.
 * @param {File} file
 * @param {number} [expirationSeconds] - אופציונלי, 60–15552000 שניות
 */
async function uploadToImgbb(file, expirationSeconds) {
    if (!IMGBB_API_KEY) {
        throw new Error('חסר מפתח API של imgbb (VITE_IMGBB_API_KEY / REACT_APP_IMGBB_API_KEY)');
    }

    const formData = new FormData();
    formData.append('image', file); // imgbb מקבל גם קובץ בינארי ישירות ב-multipart/form-data

    const params = new URLSearchParams({ key: IMGBB_API_KEY });
    if (expirationSeconds) params.set('expiration', String(expirationSeconds));

    const res = await fetch(`${IMGBB_UPLOAD_URL}?${params.toString()}`, {
        method: 'POST',
        body: formData,
    });

    const json = await res.json();

    if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || 'העלאת התמונה נכשלה');
    }

    return {
        url: json.data.url,                 // כתובת התמונה המלאה
        displayUrl: json.data.display_url,  // כתובת תצוגה (לרוב זהה)
        thumbUrl: json.data.thumb?.url,      // תמונה ממוזערת
        deleteUrl: json.data.delete_url,     // קישור למחיקה בצד imgbb (שימושי אם תרצה לשמור)
        raw: json.data,
    };
}

/**
 * קומפוננטת העלאת תמונה ל-imgbb.
 * עם סיום מוצלח קורא ל-onUploaded(url, fullResult)
 *
 * שימוש:
 *   <ImageUploader onUploaded={(url) => setForm(f => ({ ...f, imageUrl: url }))} />
 */
export default function ImageUploader({ onUploaded, expirationSeconds }) {
    const [status, setStatus] = useState('idle'); // idle | uploading | success | error
    const [errorMsg, setErrorMsg] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploadedUrl, setUploadedUrl] = useState(null);
    const inputRef = useRef(null);

    const reset = useCallback(() => {
        setStatus('idle');
        setErrorMsg('');
        setPreviewUrl(null);
        setUploadedUrl(null);
        if (inputRef.current) inputRef.current.value = '';
    }, []);

    const handleFile = useCallback(async (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setStatus('error');
            setErrorMsg('יש לבחור קובץ תמונה בלבד');
            return;
        }

        setPreviewUrl(URL.createObjectURL(file));
        setStatus('uploading');
        setErrorMsg('');

        try {
            const result = await uploadToImgbb(file, expirationSeconds);
            setUploadedUrl(result.url);
            setStatus('success');
            onUploaded?.(result.url, result);
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message || 'שגיאה בהעלאת התמונה');
        }
    }, [onUploaded, expirationSeconds]);

    const onInputChange = (e) => handleFile(e.target.files?.[0]);

    const onDrop = (e) => {
        e.preventDefault();
        handleFile(e.dataTransfer.files?.[0]);
    };

    return (
        <div dir="rtl" className="w-full">
            <div
                onClick={() => status !== 'uploading' && inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors
                    ${status === 'error' ? 'border-red-300 bg-red-50' : 'border-[#cfa756]/40 hover:border-[#cfa756] hover:bg-[#cfa756]/5'}`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onInputChange}
                />

                {previewUrl && (
                    <img
                        src={previewUrl}
                        alt="תצוגה מקדימה"
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200 mb-1"
                    />
                )}

                {status === 'idle' && (
                    <>
                        <UploadCloud size={22} className="text-[#cfa756]" />
                        <p className="text-sm text-gray-600">גרור תמונה לכאן או לחץ לבחירה</p>
                    </>
                )}

                {status === 'uploading' && (
                    <>
                        <Loader2 size={22} className="text-[#cfa756] animate-spin" />
                        <p className="text-sm text-gray-600">מעלה תמונה...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle2 size={22} className="text-green-600" />
                        <p className="text-sm text-green-700 font-medium">התמונה הועלתה בהצלחה</p>
                        <p className="text-xs text-gray-400 break-all px-2" dir="ltr">{uploadedUrl}</p>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); reset(); }}
                            className="text-xs text-gray-500 hover:text-gray-700 underline mt-1 flex items-center gap-1"
                        >
                            <X size={12} /> העלה תמונה אחרת
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle size={22} className="text-red-500" />
                        <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); reset(); }}
                            className="text-xs text-gray-500 hover:text-gray-700 underline mt-1"
                        >
                            נסה שוב
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export { uploadToImgbb };