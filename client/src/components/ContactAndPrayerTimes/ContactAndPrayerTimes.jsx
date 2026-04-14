import React, { useState } from 'react';

const ContactAndPrayerTimes = ({ isButtonTransparent }) => {
  const [prayers, setPrayers] = useState([
    { name: 'שחרית', time: '06:30' },
    { name: 'מנחה', time: '20 דקות לפני השקיעה' },
    { name: 'ערבית', time: 'מיד לאחר מכן' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempPrayers, setTempPrayers] = useState([]);

  const openModal = () => {
    setTempPrayers([...prayers]); // יצירת עותק לעריכה
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const saveChanges = () => {
    setPrayers(tempPrayers);
    setIsModalOpen(false);
  };

  const handleChange = (index, field, value) => {
    const updated = [...tempPrayers];
    updated[index][field] = value;
    setTempPrayers(updated);
  };

  const addPrayer = () => {
    setTempPrayers([...tempPrayers, { name: '', time: '' }]);
  };

  const removePrayer = (index) => {
    const updated = tempPrayers.filter((_, i) => i !== index);
    setTempPrayers(updated);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-md mx-auto my-8 border border-gray-200" dir="rtl">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">פרטי יצירת קשר וזמני תפילה</h2>

      <div className="mb-5">
        <h3 className="text-xl font-semibold text-gray-700 mb-2">כתובתנו:</h3>
        <p className="text-lg text-gray-600">הרב רפאל ברוך טולדנו 18</p>
      </div>

      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-700 mb-3">זמני תפילות:</h3>
        <ul className="space-y-2">
          {prayers.map((prayer, index) => (
            <li key={index} className="flex justify-between items-center text-lg text-gray-600">
              <span className="font-medium">{prayer.name}:</span>
              <span className="bg-blue-100 text-blue-800 text-md px-3 py-1 rounded-full">{prayer.time}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center">
        <button
          onClick={openModal}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          style={{ opacity: isButtonTransparent ? 0 : 1 }}

        >
          ערוך זמני תפילה
        </button>
      </div>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full border border-gray-300" dir="rtl">
            <h3 className="text-2xl font-bold mb-4 text-center text-gray-800">עריכת זמני תפילה</h3>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {tempPrayers.map((prayer, index) => (
                <div key={index} className="flex flex-col gap-2 border-b pb-3">
                  <div className="flex justify-between gap-2">
                    <input
                      className="border rounded px-3 py-2 w-full text-gray-700"
                      value={prayer.name}
                      onChange={(e) => handleChange(index, 'name', e.target.value)}
                      placeholder="שם התפילה"
                    />
                    <input
                      className="border rounded px-3 py-2 w-full text-gray-700"
                      value={prayer.time}
                      onChange={(e) => handleChange(index, 'time', e.target.value)}
                      placeholder="זמן התפילה"
                    />
                  </div>
                  <div className="text-left">
                    <button
                      onClick={() => removePrayer(index)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      מחק תפילה זו
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={addPrayer}
                className="text-blue-600 hover:underline"
              >
                ➕ הוסף תפילה
              </button>

              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800"
                >
                  ביטול
                </button>
                <button
                  onClick={saveChanges}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                >
                  שמור שינויים
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactAndPrayerTimes;
