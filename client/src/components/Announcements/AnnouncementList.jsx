import { useEffect, useState } from 'react';
import { fetchAnnouncements } from '../../services/api';

export default function AnnouncementList() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    fetchAnnouncements().then(res => setAnnouncements(res.data));
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">לוח מודעות</h2>
      <ul className="space-y-4">
        {announcements.map((a) => (
          <li key={a._id} className="p-4 bg-white shadow rounded">
            <h3 className="text-lg font-semibold">{a.title}</h3>
            <p>{a.content}</p>
            <p className="text-sm text-gray-500">{new Date(a.date).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
