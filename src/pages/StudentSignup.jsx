import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '../services/authService';

export default function StudentSignup() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            return alert("Passwords do not match");
        }

        setLoading(true);
        const startTime = performance.now();
        
        try {
            await signUp(email, password);
            alert("Account created successfully! Please check your email for confirmation before logging in.");
            navigate('/login');
        } catch (error) {
            console.error("Signup failed:", error);
            alert("Signup failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <nav className="top-navbar">
                <div className="sidebar-logo" style={{ marginBottom: 0 }}>
                    HostelCare
                </div>
                <div className="nav-links">
                    <Link to="/">Login</Link>
                    <a href="#" onClick={(e) => { e.preventDefault(); alert('Opening support modal...'); }}>Support</a>
                </div>
            </nav>

            <main className="login-main">
                <div className="login-card card">
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            Create Account
                        </h1>
                        <p className="text-secondary text-sm mt-2">
                            Register with your college email address.
                        </p>
                    </div>

                    <form onSubmit={handleSignup}>
                        <div className="form-group">
                            <label className="form-label">Email (College ID)</label>
                            <input 
                                type="email" 
                                className="form-control" 
                                placeholder="e.g. S2023001@hostel.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type={showPass ? "text" : "password"} 
                                    className="form-control" 
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required 
                                />
                                <button 
                                    type="button" 
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                    onClick={() => setShowPass(!showPass)}
                                >
                                    {showPass ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input 
                                type={showPass ? "text" : "password"} 
                                className="form-control" 
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required 
                            />
                        </div>

                        <button type="submit" className="btn btn-primary w-full mt-4" style={{ padding: '0.75rem', fontSize: '1rem' }} disabled={loading}>
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <p className="text-sm text-secondary">
                            Already have an account? <Link to="/" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>Log in</Link>
                        </p>
                    </div>
                </div>
            </main>

            <footer className="footer">
                <div className="flex justify-between align-center" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div>© 2026 HostelCare Systems. All rights reserved.</div>
                    <div className="flex gap-4">
                        <a href="#" className="text-sm">Privacy Policy</a>
                        <a href="#" className="text-sm">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
