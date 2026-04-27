import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './components/common/Header';
import Home from './pages/Home';
import Prayers from './pages/Prayers';
import Announcements from './pages/Announcements';
import Commemorations from './pages/Commemorations'; // ג† ׳—׳“׳©
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Footer from './components/common/Footer';
import HalachicTimes from './components/HalachicTimes';
import { ROUTES } from './constants/routes';
import Payments from './pages/Payments';
import PortalItem from './pages/PortalItem';
import PortalCategory from './pages/PortalCategory';
import Portal from './pages/Portal';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4">
          <Routes>
            <Route path={ROUTES.HOME} element={<Home />} />
            <Route path={ROUTES.PRAYERS} element={<Prayers />} />
            <Route path={ROUTES.ANNOUNCEMENTS} element={<Announcements />} />
            <Route path={ROUTES.COMMEMORATIONS} element={<Commemorations />} /> 
            <Route path={ROUTES.CONTACT} element={<Contact />} />
            <Route path={`${ROUTES.ADMIN}/*`} element={<Admin />} />
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.REGISTER} element={<Register />} />
            <Route path={ROUTES.HEBCAL} element={<HalachicTimes />} />
            <Route path={ROUTES.PAYMENTS} element={<Payments />} />
            <Route path="/portal/item/:itemId" element={<PortalItem />} />
            <Route path="/portal/:categoryId" element={<PortalCategory />} />
            <Route path={ROUTES.PORTAL} element={<Portal />} />
            <Route path="*" element={<div className="text-center text-xl">hamud lo nimtsa ein lecha  ma lechapes po</div>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
