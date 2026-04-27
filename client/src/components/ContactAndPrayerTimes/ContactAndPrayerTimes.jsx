import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { getPrayers, savePrayers } from '../../services/prayersService';
import { getAnnouncements, saveAnnouncement, removeAnnouncement } from '../../services/announcementsService';

const ContactAndPrayerTimes = ({ isButtonTransparent }) => {
  const { isAdmin } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempPrayers, setTempPrayers] = useState([]);
  const [tempAnnouncements, setTempAnnouncements] = useState([]);

  // ── טעינת נתונים בעת עלייה ──────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedPrayers, fetchedAnnouncements] = await Promise.all([
          getPrayers(),
          getAnnouncements(),
        ]);
        setPrayers(fetchedPrayers);
        setAnnouncements(fetchedAnnouncements);
      } catch (err) {
        setError('שגיאה בטעינת הנתונים. אנא רענן את הדף.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ── פתיחת מודאל — העתקת מצב נוכחי לסטייט זמני ──────────────────────────
  const openModal = () => {
    setTempPrayers(prayers.map((p) => ({ ...p })));
    setTempAnnouncements(announcements.map((a) => ({ ...a })));
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  // ── שמירת שינויים ────────────────────────────────────────────────────────
  const saveChanges = async () => {
    try {
      // 1. שמירת זמני תפילה
      const updatedPrayers = await savePrayers(tempPrayers);
      setPrayers(updatedPrayers);

      // 2. מציאת הכרזות שנמחקו (קיימות ב-DB אבל לא ב-tempAnnouncements)
      const deletedAnnouncements = announcements.filter(
        (orig) => !tempAnnouncements.some((t) => t._id === orig._id)
      );
      await Promise.all(deletedAnnouncements.map((a) => removeAnnouncement(a._id)));

      // 3. שמירה/עדכון של כל ההכרזות הנוכחיות
      const savedAnnouncements = await Promise.all(
        tempAnnouncements.map((a) => saveAnnouncement(a))
      );

      setAnnouncements(savedAnnouncements);
      setIsModalOpen(false);
    } catch (err) {
      console.error('שגיאה בשמירת הנתונים:', err);
      alert('שגיאה בשמירת הנתונים. אנא נסה שוב.');
    }
  };

  // ── פונקציות עזר לתפילות ─────────────────────────────────────────────────
  const handlePrayerChange = (index, field, value) => {
    const updated = [...tempPrayers];
    updated[index] = { ...updated[index], [field]: value };
    setTempPrayers(updated);
  };

  const addPrayer = () =>
    setTempPrayers([...tempPrayers, { title: '', time: '' }]);

  const removePrayer = (index) =>
    setTempPrayers(tempPrayers.filter((_, i) => i !== index));

  // ── פונקציות עזר להכרזות ─────────────────────────────────────────────────
  const handleAnnouncementChange = (index, field, value) => {
    const updated = [...tempAnnouncements];
    updated[index] = { ...updated[index], [field]: value };
    setTempAnnouncements(updated);
  };

  const addAnnouncement = () =>
    setTempAnnouncements([...tempAnnouncements, { title: 'הודעת גבאי', content: '' }]);

  const removeAnnouncementFromTemp = (index) =>
    setTempAnnouncements(tempAnnouncements.filter((_, i) => i !== index));

  // ── תצוגה בזמן טעינה / שגיאה ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="text-center py-10 text-[#0d2340] font-medium" dir="rtl">
        <div className="animate-pulse">טוען נתונים...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-[#a61b1b] font-medium" dir="rtl">
        {error}
      </div>
    );
  }

  return (
    <div
      className="bg-[#f7f4e9] shadow-2xl rounded-xl p-6 max-w-md mx-auto my-8 w-full border border-[#cfa756]/30 relative overflow-hidden"
      dir="rtl"
    >
      {/* פס קישוט עליון */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0d2340] via-[#cfa756] to-[#0d2340]"></div>

      <h2 className="text-3xl font-bold text-[#0d2340] mb-8 mt-2 text-center drop-shadow-sm">
        זמני תפילה ומידע
      </h2>

      {/* ── רשימת הכרזות ── */}
      {announcements.length > 0 && (
        <div className="mb-8 space-y-3">
          {announcements.map((announcement, index) => (
            <div
              key={announcement._id ?? index}
              className="p-4 bg-white border-r-4 border-[#a61b1b] shadow-sm rounded-l-lg relative"
            >
              <div className="absolute -top-3 -right-2 bg-[#a61b1b] text-white text-xs font-bold px-2 py-1 rounded shadow">
                {announcement.title || 'הודעת גבאי'}
              </div>
              <p className="text-[#0d2340] font-medium mt-2 leading-relaxed whitespace-pre-wrap">
                {announcement.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── כתובת ── */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-[#0d2340] mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#cfa756]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          כתובתנו:
        </h3>
        <p className="text-lg text-gray-700 font-medium pr-7">הרב רפאל ברוך טולדנו 20 | רמת שלמה</p>
      </div>

      {/* ── זמני תפילה ── */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-[#0d2340] mb-4 border-b-2 border-[#cfa756] pb-2 inline-block">
          זמני תפילות:
        </h3>
        <ul className="space-y-3">
          {prayers.map((prayer, index) => (
            <li
              key={prayer._id ?? index}
              className="flex justify-between items-center text-lg bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-100 hover:border-[#cfa756]/50 transition-colors"
            >
              <span className="font-bold text-[#1a365d]">{prayer.title ?? prayer.name}</span>
              <span className="bg-[#162641] text-[#cfa756] font-bold text-md px-4 py-1 rounded-full shadow-inner tracking-wide">
                {prayer.time}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── כפתור עריכה (אדמין בלבד) ── */}
      <div className="text-center">
        {isAdmin() && (
          <button
            onClick={openModal}
            className="bg-[#cfa756] text-[#0d2340] font-bold px-6 py-2.5 rounded-md hover:bg-[#b8860b] hover:text-white transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-[#0d2340] ring-offset-2 ring-offset-[#f7f4e9]"
            style={{ opacity: isButtonTransparent ? 0 : 1 }}
          >
            ערוך זמני תפילה והודעות
          </button>
        )}
      </div>

      {/* ══════════════════════ מודאל עריכה ══════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0d2340]/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div
            className="bg-[#f7f4e9] p-6 rounded-xl shadow-2xl max-w-md w-full border-2 border-[#cfa756] max-h-[90vh] overflow-y-auto"
            dir="rtl"
          >
            <h3 className="text-2xl font-bold mb-6 text-center text-[#0d2340] border-b border-[#cfa756]/30 pb-3">
              עריכת תוכן
            </h3>

            {/* ── עריכת הכרזות ── */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-[#0d2340] text-lg">הודעות גבאי:</h4>
              </div>

              <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-1">
                {tempAnnouncements.map((announcement, index) => (
                  <div
                    key={announcement._id ?? index}
                    className="flex flex-col gap-2 bg-white p-3 rounded-md shadow-sm border border-gray-200"
                  >
                    <input
                      className="border border-gray-300 rounded px-3 py-2 w-full text-gray-800 focus:ring-1 focus:ring-[#cfa756] outline-none text-sm"
                      value={announcement.title ?? ''}
                      onChange={(e) => handleAnnouncementChange(index, 'title', e.target.value)}
                      placeholder="כותרת ההודעה (לדוג': הודעת גבאי)"
                    />
                    <textarea
                      className="border border-gray-300 rounded px-3 py-2 w-full text-gray-800 focus:ring-1 focus:ring-[#cfa756] outline-none text-sm"
                      rows="3"
                      value={announcement.content ?? ''}
                      onChange={(e) => handleAnnouncementChange(index, 'content', e.target.value)}
                      placeholder="תוכן ההודעה..."
                    />
                    <div className="text-right">
                      <button
                        onClick={() => removeAnnouncementFromTemp(index)}
                        className="text-sm font-medium text-[#a61b1b] hover:text-red-800 hover:underline flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        מחק הודעה
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addAnnouncement}
                className="mt-3 text-[#1a365d] font-bold hover:text-[#cfa756] transition-colors flex items-center gap-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                הוסף הודעה
              </button>
            </div>

            {/* ── קו הפרדה ── */}
            <div className="border-t border-[#cfa756]/30 my-4" />

            {/* ── עריכת זמני תפילה ── */}
            <div className="mb-4">
              <h4 className="font-bold text-[#0d2340] text-lg mb-3">עריכת זמני תפילה:</h4>
              <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-1">
                {tempPrayers.map((prayer, index) => (
                  <div key={prayer._id ?? index} className="flex flex-col gap-2 bg-white p-3 rounded-md shadow-sm border border-gray-200">
                    <div className="flex justify-between gap-3">
                      <input
                        className="border border-gray-300 rounded px-3 py-2 w-full text-gray-800 focus:ring-1 focus:ring-[#cfa756] outline-none"
                        value={prayer.title ?? prayer.name ?? ''}
                        onChange={(e) => handlePrayerChange(index, 'title', e.target.value)}
                        placeholder="שם התפילה (לדוג': שחרית)"
                      />
                      <input
                        className="border border-gray-300 rounded px-3 py-2 w-full text-gray-800 focus:ring-1 focus:ring-[#cfa756] outline-none text-center"
                        value={prayer.time}
                        onChange={(e) => handlePrayerChange(index, 'time', e.target.value)}
                        placeholder="זמן (לדוג': 06:15)"
                        dir="ltr"
                      />
                    </div>
                    <div className="text-right mt-1">
                      <button
                        onClick={() => removePrayer(index)}
                        className="text-sm font-medium text-[#a61b1b] hover:text-red-800 hover:underline flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        מחק תפילה
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addPrayer}
                className="mt-3 text-[#1a365d] font-bold hover:text-[#cfa756] transition-colors flex items-center gap-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                הוסף תפילה
              </button>
            </div>

            {/* ── כפתורי שמירה/ביטול ── */}
            <div className="flex justify-end gap-3 mt-8 border-t border-[#cfa756]/30 pt-4">
              <button
                onClick={closeModal}
                className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={saveChanges}
                className="px-5 py-2 rounded-md bg-[#0d2340] hover:bg-[#1a365d] text-[#cfa756] font-bold transition-colors shadow-md"
              >
                שמור שינויים
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactAndPrayerTimes;