import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { getPrayers, savePrayers } from '../../services/prayersService';
import {
  getAnnouncements,
  saveAnnouncement,
  removeAnnouncement,
} from '../../services/announcementsService';

const DEFAULT_TITLE = 'זמני תפילות:';

const ContactAndPrayerTimes = ({ isButtonTransparent }) => {
  const { isAdmin } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [prayers, setPrayers] = useState([]);
  const [prayerSectionTitle, setPrayerSectionTitle] = useState(DEFAULT_TITLE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempPrayers, setTempPrayers] = useState([]);
  const [tempAnnouncements, setTempAnnouncements] = useState([]);
  const [tempTitle, setTempTitle] = useState(DEFAULT_TITLE);

  // ── טעינת נתונים ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        const [prayerData, fetchedAnnouncements] = await Promise.all([
          getPrayers(),
          getAnnouncements(),
        ]);
        // תמיכה בפורמט החדש { prayers, prayerSectionTitle } וגם בישן [...]
        if (Array.isArray(prayerData)) {
          setPrayers(prayerData);
        } else {
          setPrayers(prayerData.prayers ?? []);
          setPrayerSectionTitle(prayerData.prayerSectionTitle ?? DEFAULT_TITLE);
        }
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

  // ── פתיחת מודאל ──────────────────────────────────────────────────────────
  const openModal = () => {
    setTempPrayers(prayers.map((p) => ({ ...p })));
    setTempAnnouncements(announcements.map((a) => ({ ...a })));
    setTempTitle(prayerSectionTitle);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  // ── שמירת שינויים ────────────────────────────────────────────────────────
  const saveChanges = async () => {
    try {
      /*
       * חשוב מאוד:
       * קודם שומרים את כל ההודעות,
       * ורק בסוף שומרים את התפילות.
       *
       * שמירת התפילות היא הפעולה שמפעילה
       * את שליחת המייל בשרת.
       */
  
      // 1. מציאת ההודעות שנמחקו
      const deletedAnnouncements = announcements.filter(
        (originalAnnouncement) =>
          !tempAnnouncements.some(
            (tempAnnouncement) =>
              tempAnnouncement._id === originalAnnouncement._id
          )
      );
  
      // 2. מחיקת ההודעות שהוסרו
      await Promise.all(
        deletedAnnouncements.map((announcement) =>
          removeAnnouncement(announcement._id)
        )
      );
  
      // 3. שמירת כל ההודעות החדשות והמעודכנות
      const savedAnnouncements = await Promise.all(
        tempAnnouncements.map((announcement) =>
          saveAnnouncement(announcement)
        )
      );
  
      setAnnouncements(savedAnnouncements);
  
      /*
       * 4. שמירת התפילות והכותרת מתבצעת אחרונה.
       *
       * הנתיב הזה מפעיל בשרת את
       * sendUpdateNewsletter.
       *
       * בשלב הזה כל ההודעות כבר נשמרו במסד הנתונים,
       * ולכן המייל יקבל את התוכן החדש.
       */
      const result = await savePrayers(
        tempPrayers,
        tempTitle
      );
  
      if (Array.isArray(result)) {
        // תמיכה בפורמט הישן
        setPrayers(result);
        setPrayerSectionTitle(tempTitle);
      } else {
        setPrayers(
          result.prayers ?? tempPrayers
        );
  
        setPrayerSectionTitle(
          result.prayerSectionTitle ?? tempTitle
        );
      }
  
      // 5. סגירת חלון העריכה רק לאחר שכל הפעולות הסתיימו
      setIsModalOpen(false);
    } catch (err) {
      console.error(
        'שגיאה בשמירת הנתונים:',
        err
      );
  
      alert(
        'שגיאה בשמירת הנתונים. אנא נסה שוב.'
      );
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
    setTempAnnouncements([
      ...tempAnnouncements,
      { title: 'הודעת גבאי', content: '' },
    ]);

  const removeAnnouncementFromTemp = (index) =>
    setTempAnnouncements(tempAnnouncements.filter((_, i) => i !== index));

  // ── תצוגה ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="text-center py-10 font-medium text-[#0d2340]" style={{ fontFamily: "'Assistant', sans-serif" }} dir="rtl">
        <div className="animate-pulse">טוען נתונים...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 font-medium text-[#a61b1b]" style={{ fontFamily: "'Assistant', sans-serif" }} dir="rtl">
        <div>{error}</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap');

        .widget-font {
          font-family: 'Assistant', sans-serif;
        }

        /* ── עיצוב קלפי היוקרה (בז' קלאסי) ── */
        .lux-card {
          background-color: #f7f4e9;
          border: 1px solid rgba(207,167,86,0.3);
          box-shadow: 0 15px 40px rgba(13,35,64,0.1), 0 4px 10px rgba(13,35,64,0.05);
          position: relative;
        }

        /* פריטים פנימיים */
        .lux-item {
          background-color: #ffffff;
          border: 1px solid rgba(207,167,86,0.15);
          transition: all 0.3s ease;
        }

        .lux-item:hover {
          border-color: rgba(207,167,86,0.5);
          box-shadow: 0 4px 12px rgba(207,167,86,0.1);
        }

        /* שדות קלט (Inputs) שמתאימים לרקע הבהיר */
        .input-lux {
          background-color: #ffffff;
          border: 1px solid rgba(207,167,86,0.3);
          color: #0d2340;
          transition: all 0.3s ease;
        }

        .input-lux:focus {
          border-color: #cfa756;
          box-shadow: 0 0 0 2px rgba(207,167,86,0.2);
          outline: none;
        }
        
        .input-lux::placeholder {
          color: rgba(13, 35, 64, 0.4);
        }

        /* פס גלילה מותאם אישית למודאל */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(207,167,86,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(207,167,86,0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(207,167,86,0.8);
        }

        /* תאורה שזזה (Light Sweep) לחלק העליון של הכרטיס */
        @keyframes cardLightSweep {
          0% { left: -100%; }
          50% { left: 100%; }
          100% { left: -100%; }
        }
      `}</style>

      <div
        className="widget-font lux-card rounded-2xl p-6 max-w-md mx-auto my-8 w-full overflow-hidden"
        dir="rtl"
      >
        {/* קרן אור עליונה - גרדיאנט קלאסי כחול-זהב-כחול */}
        <div className="absolute top-0 left-0 right-0 h-[4px] overflow-hidden rounded-t-2xl pointer-events-none bg-gradient-to-r from-[#0d2340] via-[#cfa756] to-[#0d2340]">
          <div className="absolute inset-y-0 w-[50%]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)', animation: 'cardLightSweep 4s ease-in-out infinite' }} />
        </div>

        <h2 className="text-3xl font-bold mb-8 mt-2 text-center text-[#0d2340] drop-shadow-sm">
          זמני תפילה ומידע
        </h2>

        {/* הכרזות */}
        {announcements.length > 0 && (
          <div className="mb-8 space-y-4" translate="no">
            {announcements.map((announcement, index) => (
              <div
                key={announcement._id ?? index}
                className="lux-item p-4 rounded-lg rounded-r-none relative"
                style={{ borderRight: '4px solid #a61b1b' }}
              >
                <div 
                  className="absolute -top-3 -right-2 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md bg-[#a61b1b]"
                >
                  {announcement.title || 'הודעת גבאי'}
                </div>
                <p className="text-[#0d2340] font-medium mt-2 leading-relaxed whitespace-pre-wrap">
                  {announcement.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* כתובת */}
        <div className="lux-item mb-8 p-4 rounded-lg flex flex-col gap-1 shadow-sm">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-[#0d2340]">
            <svg className="w-5 h-5 text-[#cfa756]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            כתובתנו:
          </h3>
          <p className="text-lg text-gray-700 font-medium pr-7">
            הרב רפאל ברוך טולדנו 20 | רמת שלמה
          </p>
        </div>

        {/* זמני תפילה — כותרת דינמית */}
        <div className="mb-8">
          <h3 
            className="text-xl font-bold mb-4 border-b-2 pb-2 inline-block text-[#0d2340]"
            style={{ borderColor: '#cfa756' }}
          >
            {prayerSectionTitle}
          </h3>
          <ul className="space-y-3">
            {prayers.map((prayer, index) => (
              <li
                key={prayer._id ?? index}
                className="lux-item flex justify-between items-center text-lg px-4 py-3 rounded-lg shadow-sm"
              >
                <span className="font-bold text-[#1a365d]">
                  {prayer.title ?? prayer.name}
                </span>
                <span className="bg-[#162641] text-[#cfa756] font-bold text-[16px] px-4 py-1 rounded-full shadow-inner tracking-wide">
                  {prayer.time}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* כפתור עריכה */}
        <div className="text-center mt-6">
          {isAdmin() && (
            <button
              onClick={openModal}
              className="px-8 py-3 rounded-full text-[16px] font-bold tracking-wide transition-all duration-300 shadow-md focus:outline-none"
              style={{
                opacity: isButtonTransparent ? 0 : 1,
                background: 'linear-gradient(135deg, #cfa756 0%, #b8860b 100%)',
                color: '#0d2340',
                border: '1px solid rgba(255,255,255,0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.boxShadow = '0 6px 15px rgba(207,167,86,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
              }}
            >
              ערוך זמני תפילה והודעות
            </button>
          )}
        </div>

        {/* ══════════════ מודאל עריכה (Beige Theme) ══════════════ */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 widget-font" style={{ background: 'rgba(13, 35, 64, 0.7)', backdropFilter: 'blur(5px)' }}>
            <div
              className="lux-card rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar"
              dir="rtl"
            >
              <h3 
                className="text-2xl font-bold mb-6 text-center pb-3 text-[#0d2340]" 
                style={{ borderBottom: '1px solid rgba(207,167,86,0.3)' }}
              >
                עריכת תוכן
              </h3>

              {/* עריכת הכרזות */}
              <div className="mb-8">
                <h4 className="font-bold text-lg mb-3 text-[#0d2340]">הודעות גבאי:</h4>
                <div className="space-y-4 max-h-[25vh] overflow-y-auto custom-scrollbar pr-2">
                  {tempAnnouncements.map((announcement, index) => (
                    <div
                      key={announcement._id ?? index}
                      className="lux-item flex flex-col gap-3 p-4 rounded-lg shadow-sm"
                    >
                      <input
                        className="input-lux rounded-md px-3 py-2.5 w-full text-sm"
                        value={announcement.title ?? ''}
                        onChange={(e) => handleAnnouncementChange(index, 'title', e.target.value)}
                        placeholder="כותרת ההודעה"
                      />
                      <textarea
                        className="input-lux rounded-md px-3 py-2.5 w-full text-sm resize-none custom-scrollbar"
                        rows="3"
                        value={announcement.content ?? ''}
                        onChange={(e) => handleAnnouncementChange(index, 'content', e.target.value)}
                        placeholder="תוכן ההודעה..."
                      />
                      <button
                        onClick={() => removeAnnouncementFromTemp(index)}
                        className="text-sm font-medium hover:underline flex items-center gap-1 self-end transition-colors text-[#a61b1b]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        מחק הודעה
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addAnnouncement}
                  className="mt-4 font-bold transition-colors flex items-center gap-1 text-[#1a365d] hover:text-[#cfa756]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  הוסף הודעה
                </button>
              </div>

              <div className="border-t my-6" style={{ borderColor: 'rgba(207,167,86,0.3)' }} />

              {/* ── עריכת כותרת הסקשן ── */}
              <div className="mb-6">
                <h4 className="font-bold text-lg mb-3 text-[#0d2340]">כותרת סקשן תפילות:</h4>
                <input
                  className="input-lux rounded-md px-3 py-2.5 w-full text-sm"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  placeholder="כותרת הסקשן (לדוג': זמני תפילות:)"
                />
                <p className="text-xs mt-2 text-gray-500">
                  זהו הטקסט שמופיע מעל רשימת התפילות
                </p>
              </div>

              {/* עריכת זמני תפילה */}
              <div className="mb-4">
                <h4 className="font-bold text-lg mb-3 text-[#0d2340]">זמני תפילה:</h4>
                <div className="space-y-4 max-h-[25vh] overflow-y-auto custom-scrollbar pr-2">
                  {tempPrayers.map((prayer, index) => (
                    <div
                      key={prayer._id ?? index}
                      className="lux-item flex flex-col gap-3 p-4 rounded-lg shadow-sm"
                    >
                      <div className="flex justify-between gap-3">
                        <input
                          className="input-lux rounded-md px-3 py-2.5 w-full text-sm"
                          value={prayer.title ?? prayer.name ?? ''}
                          onChange={(e) => handlePrayerChange(index, 'title', e.target.value)}
                          placeholder="שם התפילה (לדוג': שחרית)"
                        />
                        <input
                          className="input-lux rounded-md px-3 py-2.5 w-full text-center text-sm"
                          value={prayer.time}
                          onChange={(e) => handlePrayerChange(index, 'time', e.target.value)}
                          placeholder="06:15"
                          dir="ltr"
                        />
                      </div>
                      <button
                        onClick={() => removePrayer(index)}
                        className="text-sm font-medium hover:underline flex items-center gap-1 self-end transition-colors text-[#a61b1b]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        מחק תפילה
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addPrayer}
                  className="mt-4 font-bold transition-colors flex items-center gap-1 text-[#1a365d] hover:text-[#cfa756]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  הוסף תפילה
                </button>
              </div>

              {/* כפתורי שמירה/ביטול */}
              <div className="flex justify-end gap-4 mt-8 pt-5" style={{ borderTop: '1px solid rgba(207,167,86,0.3)' }}>
                <button
                  onClick={closeModal}
                  className="px-6 py-2.5 rounded-full text-[15px] font-semibold tracking-wide transition-all duration-300 bg-white"
                  style={{
                    border: '1px solid #d1d5db',
                    color: '#4b5563',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  ביטול
                </button>
                <button
                  onClick={saveChanges}
                  className="px-6 py-2.5 rounded-full text-[15px] font-bold tracking-wide transition-all duration-300 shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, #0d2340 0%, #1a365d 100%)',
                    color: '#cfa756',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.boxShadow = '0 6px 15px rgba(13,35,64,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  }}
                >
                  שמור שינויים
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ContactAndPrayerTimes;