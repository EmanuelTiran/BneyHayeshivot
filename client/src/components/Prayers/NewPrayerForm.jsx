import { useState } from 'react';
import { createPrayer } from '../../services/api';

export default function NewPrayerForm({ onAdd }) {
  const [title, setTitle] = useState('שחרית');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await createPrayer({ title, description, time });
    console.log(res.data)
    onAdd(res.data);
    setTitle('');
    setDescription('');
    setTime('');
  };

  return (
   <form onSubmit={handleSubmit} className="bg-gray-100 p-4 rounded" dir="rtl">

      <select
        className="block w-full mb-2 p-2 border text-right"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      >
        <option value="שחרית">שחרית</option>
        <option value="מנחה">מנחה</option>
        <option value="ערבית">ערבית</option>
        <option value="מוסף">מוסף</option>
      </select>
      <input
        className="block w-full mb-2 p-2 border text-right"
        placeholder="שעה"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />
      <textarea
        className="block w-full mb-2 p-2 border text-right"
        placeholder="תיאור"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">הוסף תפילה</button>
    </form>
  );
}
