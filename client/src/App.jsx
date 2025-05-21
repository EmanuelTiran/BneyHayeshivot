import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './components/common/Header';
import Home from './pages/Home';
import Prayers from './pages/Prayers';
import Announcements from './pages/Announcements';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Login from './components/auth/Login';  // יבוא קומפוננטת התחברות
import Register from './components/auth/Register';  // יבוא קומפוננטת הרשמה
import Footer from './components/common/Footer';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/prayers" element={<Prayers />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Login />} /> {/* נתיב חדש להתחברות */}
            <Route path="/register" element={<Register />} /> {/* נתיב חדש להרשמה */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;