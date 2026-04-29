import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/authContext';
import { API_URL } from '../../config';

function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { googleLogin } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'שגיאה בהרשמה');
      navigate('/login', { state: { message: 'ההרשמה הושלמה בהצלחה, כעת ניתן להתחבר' } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // גוגל עובד אותו דבר בהרשמה ובהתחברות
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const inputClass = (hasError) => `
    w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 
    focus:ring-[#cfa756] text-right transition-all
    ${hasError ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-[#cfa756]'}
  `;

  return (
    <div dir="rtl" className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold text-[#0d2340] mb-6 flex items-center gap-2">
        <span className="text-[#cfa756]">✦</span>
        הרשמה
      </h2>

      {error && (
        <div className="mb-5 rounded-lg px-4 py-3 text-sm font-medium bg-red-50 border border-red-200 text-red-700 text-right">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md p-6 space-y-5 border border-gray-100">

        {/* ── כפתור גוגל ── */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('הרשמה עם גוגל נכשלה, נסה שנית')}
            text="signup_with"
            shape="rectangular"
            locale="he"
            width="100%"
          />
        </div>

        {/* ── מפריד ── */}
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <div className="flex-1 h-px bg-gray-200" />
          <span>או הירשם עם מייל</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* ── טופס רגיל ── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 text-right">שם מלא</label>
            <input name="name" type="text" value={formData.name} onChange={handleChange} required className={inputClass(error)} />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 text-right">דוא״ל</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} required className={inputClass(error)} />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 text-right">סיסמה</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6" className={inputClass(error)} />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 text-right">אימות סיסמה</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required minLength="6" className={inputClass(error)} />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-[#cfa756] hover:bg-[#b8860b] disabled:opacity-50 text-[#0d2340] font-bold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            {loading ? 'שומר...' : 'הירשם'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-4">
          כבר יש לך חשבון?{' '}
          <span onClick={() => navigate('/login')} className="text-[#cfa756] cursor-pointer hover:underline font-medium">
            התחבר כאן
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;