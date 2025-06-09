import { useEffect, useState } from 'react';
import { fetchPrayers } from '../../services/api';

export default function PrayerList() {
  const [prayers, setPrayers] = useState([]);

  useEffect(() => {
    fetchPrayers().then((res) => setPrayers(res.data));
    fetchPrayers().then((res) => console.log(res.data));
  }, []);

  return (
    <div className="p-4" dir="rtl">
      <h2 className="text-xl font-bold mb-4">לוח תפילות</h2>
      <ul className="space-y-4">
        {prayers.map((prayer) => (
          <li key={prayer._id} className="bg-white shadow p-4 rounded">
            <h3 className="text-lg font-semibold">{prayer.title}</h3>
            <p className="text-sm text-gray-500">{prayer.time}</p>
            <p>{prayer.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
