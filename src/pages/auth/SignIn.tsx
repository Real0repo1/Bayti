import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { MenuIcon, XIcon, EyeIcon, EyeOffIcon } from '../../components/Icons';
import './Auth.css';

function SignIn() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError('Invalid email or password');
      setLoading(false);
      return;
    }

    navigate('/');
  };

  return (
    <div className="auth-page">
      <header className="header">
        <div className="logo" onClick={() => navigate('/')}>
          <img src="/src/assets/logo.png" alt="Bayti" />
        </div>
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
        <nav className={`desktop-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <a href="/search" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigate('/search'); }}>Browse</a>
          <a href="/become-a-host" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigate('/become-a-host'); }}>Become a host</a>
          <a href="/favorites" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigate('/favorites'); }}>Favorites</a>
          <a href="/signin" className="active">Sign in</a>
        </nav>
      </header>

      <div className="auth-container">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p>Sign in to your Bayti account</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
