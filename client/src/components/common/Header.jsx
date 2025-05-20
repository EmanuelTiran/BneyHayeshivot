import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-blue-800 text-white p-4">
      <nav className="flex justify-between items-center">
        <h1 className="text-xl font-bold">בית הכנסת</h1>
        <div className="space-x-4">
          <Link to="/" className="hover:underline">בית</Link>
          <Link to="/prayers" className="hover:underline">תפילות</Link>
          <Link to="/announcements" className="hover:underline">מודעות</Link>
          <Link to="/contact" className="hover:underline">צור קשר</Link>
          <Link to="/admin" className="hover:underline">ניהול</Link>
        </div>
      </nav>
    </header>
  );
}
