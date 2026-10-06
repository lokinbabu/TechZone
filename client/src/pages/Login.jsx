import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Logo } from '../components/Icons';
import './Auth.css';

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const u = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`);
      const from = location.state?.from;
      navigate(from || (u.role === 'admin' ? '/admin' : '/dashboard'), { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand">
          <Logo size={36} />
        </Link>
        <h1>Welcome back</h1>
        <p className="auth-sub">Log in to continue to TechZone.</p>

        <form onSubmit={submit} noValidate>
          <div className={`field ${errors.email ? 'has-error' : ''}`}>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={onChange}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className={`field ${errors.password ? 'has-error' : ''}`}>
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={form.password}
              onChange={onChange}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p className="auth-switch">
          New to TechZone? <Link to="/register">Create an account</Link>
        </p>

        <div className="demo-box">
          <h4>Demo accounts</h4>
          <button
            type="button"
            className="demo-row"
            onClick={() => setForm({ email: 'admin@techzone.com', password: 'Admin@123' })}
          >
            <span className="demo-role">Admin</span>
            <span className="mono">admin@techzone.com / Admin@123</span>
          </button>
          <button
            type="button"
            className="demo-row"
            onClick={() => setForm({ email: 'user@techzone.com', password: 'User@123' })}
          >
            <span className="demo-role">User</span>
            <span className="mono">user@techzone.com / User@123</span>
          </button>
        </div>
      </div>
    </div>
  );
}
