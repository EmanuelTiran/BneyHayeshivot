// components/auth/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';

function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'שגיאה בהתחברות');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // עיצוב אחיד לשדות הקלט
    const inputClass = (hasError) => `
        w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cfa756] text-right transition-all
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

            <div className="bg-white rounded-2xl shadow-md p-6 space-y-6 border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">דוא"ל</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className={inputClass(error)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">סיסמה</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className={inputClass(error)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#cfa756] hover:bg-[#b8860b] disabled:opacity-50 text-[#0d2340] font-bold px-6 py-2.5 rounded-lg transition-colors shadow-sm mt-2"
                    >
                        {loading ? 'מתחבר...' : 'התחבר'}
                    </button>
                </form>

                <p className="text-sm text-center text-gray-500">
                    אין לך חשבון?{' '}
                    <span
                        onClick={() => navigate('/register')}
                        className="text-[#cfa756] cursor-pointer hover:underline font-medium"
                    >
                        הירשם כאן
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Login;