import { useState } from 'react';
import { sendContactMessage } from '../../services/api';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendContactMessage({ name, email, message });
    setSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  if (submitted) {
    return <p className="p-4 text-green-600">הודעה נשלחה בהצלחה!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-100 p-4 rounded max-w-md mx-auto">
      <input
        className="block w-full mb-2 p-2 border"
        placeholder="שם"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="block w-full mb-2 p-2 border"
        placeholder="אימייל"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <textarea
        className="block w-full mb-2 p-2 border"
        placeholder="הודעה"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">שלח הודעה</button>
    </form>
  );
}
