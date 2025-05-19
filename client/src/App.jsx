import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';

import AboutPage from './components/pages/AboutPage';


function App() {
  const [loginResult, setLoginResult] = useState(false);

  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<div>Home Page</div>} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
