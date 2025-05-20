import { useState } from 'react';
import { createPrayer } from '../../services/api';

export default function NewPrayerForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await createPrayer({ title, description, time });
    onAdd(res.data);
    setTitle('');
    setDescription('');
    setTime('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-100 p-4 rounded">
      <input
        className="block w-full mb-2 p-2 border"
        placeholder="שם התפילה"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        className="block w-full mb-2 p-2 border"
        placeholder="שעה"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />
      <textarea
        className="block w-full mb-2 p-2 border"
        placeholder="תיאור"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">הוסף תפילה</button>
    </form>
  );
}
