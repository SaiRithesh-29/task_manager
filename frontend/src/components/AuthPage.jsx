import { useState } from 'react';
import { login, signup } from '../services/authService';
import Logo from './Logo';

function AuthPage({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || (!isLogin && !form.name)) {
      setError('Please fill all fields');
      return;
    }

    try {
      const res = isLogin ? await login({ email: form.email, password: form.password }) : await signup(form);
      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onAuth(res.data.user);
      } else {
        setIsLogin(true);
        setForm({ name: '', email: '', password: '' });
        setError('Account created! Please log in.');
      }
    } catch (err) {
      console.log('Full error:', err);
      console.log('Error response:', err.response?.data);
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 p-6 sm:p-8 rounded-lg w-full max-w-sm mx-4">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Logo className="w-10 h-10" />
          <h1 className="text-2xl font-bold text-white">Task Manager</h1>
        </div>
        <h2 className="text-lg text-gray-300 mb-4 text-center">{isLogin ? 'Login' : 'Sign Up'}</h2>

        {error && (
          <div className="bg-red-600 text-white p-2 rounded mb-4 text-sm text-center">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Name"
              className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          )}
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-4 text-center">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-blue-400 hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
