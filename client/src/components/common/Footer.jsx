import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="logo">
          <Link to="/" className="text-2xl font-bold text-slate-600">
            Car Rental
          </Link>
        </div>
        <nav className="hidden md:flex space-x-4">
          <Link to="/" className="text-gray-600 hover:text-slate-600">Home</Link>
          <Link to="/cars" className="text-gray-600 hover:text-slate-600">Cars</Link>
          <Link to="/about" className="text-gray-600 hover:text-slate-600">About</Link>
          <Link to="/contact" className="text-gray-600 hover:text-slate-600">Contact</Link>
        </nav>
        {/* <div className="auth-buttons space-x-2 hidden md:block">
          <Link to="/login" className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded">Login</Link>
          <Link to="/register" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Register</Link>
        </div> */}
        <button 
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          Menu
        </button>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <Link to="/" className="block py-2 px-4 text-sm hover:bg-gray-200">Home</Link>
          <Link to="/cars" className="block py-2 px-4 text-sm hover:bg-gray-200">Cars</Link>
          <Link to="/about" className="block py-2 px-4 text-sm hover:bg-gray-200">About</Link>
          <Link to="/contact" className="block py-2 px-4 text-sm hover:bg-gray-200">Contact</Link>
          <Link to="/login" className="block py-2 px-4 text-sm hover:bg-gray-200">Login</Link>
          <Link to="/register" className="block py-2 px-4 text-sm hover:bg-gray-200">Register</Link>
        </div>
      )}
    </header>
  );
}
