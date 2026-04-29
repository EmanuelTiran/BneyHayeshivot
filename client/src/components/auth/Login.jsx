import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/authContext';
import { API_URL } from '../../config';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'שגיאה בהתחברות');
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // הצלחה מגוגל
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleError = () => {
    setError('התחברות עם גוגל נכשלה, נסה שנית');
  };

  const inputClass = (hasError) => `
    w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 
    focus:ring-[#cfa756] text-right transition-all
    ${hasError ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-[#cfa756]'}
  `;

  return (
    <div dir="rtl" className="max-w-md mx-auto mt-12">
      <h2 className="text-2xl font-bold text-[#0d2340] mb-6 flex items-center gap-2">
        <span className="text-[#cfa756]">✦</span>
        התחברות
      </h2>

      {error && (
        <div className="mb-5 rounded-lg px-4 py-3 text-sm font-medium bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md p-6 space-y-5 border border-gray-100">
        
        {/* ── כפתור גוגל ── */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signin_with"
            shape="rectangular"
            locale="he"
            width="100%"
          />
        </div>

        {/* ── מפריד ── */}
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <div className="flex-1 h-px bg-gray-200" />
          <span>או התחבר עם מייל</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* ── טופס רגיל ── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">דוא"ל</label>
            <input
              type="email" id="email" name="email"
              value={formData.email} onChange={handleChange} required
              className={inputClass(error)}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">סיסמה</label>
            <input
              type="password" id="password" name="password"
              value={formData.password} onChange={handleChange} required
              className={inputClass(error)}
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-[#cfa756] hover:bg-[#b8860b] disabled:opacity-50 text-[#0d2340] font-bold px-6 py-2.5 rounded-lg transition-colors shadow-sm mt-2"
          >
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500">
          אין לך חשבון?{' '}
          <span onClick={() => navigate('/register')} className="text-[#cfa756] cursor-pointer hover:underline font-medium">
            הירשם כאן
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;