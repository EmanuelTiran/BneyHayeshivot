import { useState } from 'react';
import { createAnnouncement } from '../../services/api';

export default function NewAnnouncementForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await createAnnouncement({ title, content });
    onAdd(res.data);
    setTitle('');
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-100 p-4 rounded">
      <input
        className="block w-full mb-2 p-2 border"
        placeholder="כותרת"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <textarea
        className="block w-full mb-2 p-2 border"
        placeholder="תוכן ההודעה"
        value={content}
        onChange={e => setContent(e.target.value)}
      />
      <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">שלח</button>
    </form>
  );
}
