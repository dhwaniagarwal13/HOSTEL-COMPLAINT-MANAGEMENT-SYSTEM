import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HOSTEL_LIST } from '../utils/data';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function StudentLogin() {
    const navigate = useNavigate();
    const [loginType, setLoginType] = useState('student');
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [hostel, setHostel] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user, profile } = useAuth();

    useEffect(() => {
        if (user && profile) {
            if (profile.role === 'staff') {
                navigate("/staff");
            } else if (profile.role === 'admin') {
                navigate("/admin");
            } else {
                navigate("/dashboard");
            }
        }
    }, [user, profile, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { user, profile } = await login(userId, password);
            if (user) {
                // If profile is still not found (e.g. sync delay), default to student dashboard
                const role = profile?.role || 'student';
                if (role === 'staff') navigate("/staff");
                else if (role === 'admin') navigate("/admin");
                else navigate("/dashboard");
            }
        } catch (error) {
            console.error("Login failed:", error);
            alert("Login failed: " + error.message);
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
                    <Link to="/">Home</Link>
                    <a href="#" onClick={(e) => { e.preventDefault(); alert('Opening support modal...'); }}>Support</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); alert('Redirecting to Admin Portal Info...'); }}>Contact Admin</a>
                    <button 
                        className="btn btn-secondary text-sm" 
                        onClick={() => setLoginType(loginType === 'student' ? 'staff' : 'student')}
                    >
                        {loginType === 'student' ? 'Staff Login →' : '← Student Login'}
                    </button>
                    {loginType === 'staff' && (
                        <button 
                            className="btn btn-secondary text-sm" 
                            style={{borderColor: 'var(--danger)', color: 'var(--danger)'}} 
                            onClick={() => setLoginType('admin')}
                        >
                            Admin Access
                        </button>
                    )}
                </div>
            </nav>

            <main className="login-main">
                <div className="login-card card">
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {loginType === 'student' ? 'Student Portal' : (loginType === 'staff' ? 'Staff Workspace' : 'Admin Terminal')}
                        </h1>
                        <p className="text-secondary text-sm mt-2">
                            {loginType === 'student' ? 'Welcome back! Please enter your details.' : 'Authorized personnel only.'}
                        </p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label">{loginType === 'student' ? 'Email (College ID)' : 'Email (Employee ID)'}</label>
                            <input 
                                type="email" 
                                className="form-control" 
                                placeholder={loginType === 'student' ? "e.g. S2023001@hostel.com" : "e.g. EMP101@hostel.com"}
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <div className="flex justify-between align-center mb-2">
                                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                                <a href="#" className="text-sm" onClick={(e) => { e.preventDefault(); alert('Reset link sent!'); }}>Forgot password?</a>
                            </div>
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

                        {loginType === 'student' && (
                            <div className="flex gap-4">
                                <div className="form-group w-full">
                                    <label className="form-label">Hostel Block</label>
                                    <select 
                                        className="form-control" 
                                        value={hostel} 
                                        onChange={(e) => setHostel(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled hidden>Select your hostel</option>
                                        {HOSTEL_LIST.map((hName) => (
                                            <option key={hName} value={hName}>{hName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group w-full">
                                    <label className="form-label">Room Number</label>
                                    <input type="text" className="form-control" placeholder="e.g. 101" />
                                </div>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary w-full mt-4" style={{ padding: '0.75rem', fontSize: '1rem' }} disabled={loading}>
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>

                    {loginType === 'student' && (
                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <p className="text-sm text-secondary">Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>Sign up</Link></p>
                        </div>
                    )}
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
