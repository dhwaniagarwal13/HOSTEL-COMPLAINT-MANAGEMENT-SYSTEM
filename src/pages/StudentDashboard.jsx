import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { formatDate } from '../utils/data';
import { getStudentComplaints } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import { supabase } from '../lib/supabase';

export default function StudentDashboard() {
    const navigate = useNavigate();
    const { user, profile, loading } = useAuth();
    const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
    const [recent, setRecent] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/login');
            } else if (profile && profile.role !== 'student') {
                navigate('/login');
            } else if (profile) {
                fetchData(user.id);
            }
        }
    }, [user, profile, loading, navigate]);

    const fetchData = async (userId) => {
        setIsLoading(true);
        try {
            const myComplaints = await getStudentComplaints(userId);
            
            setStats({
                total: myComplaints.length,
                pending: myComplaints.filter(c => c.status !== 'resolved' && c.status !== 'Resolved').length,
                resolved: myComplaints.filter(c => c.status === 'resolved' || c.status === 'Resolved').length
            });

            setRecent(myComplaints.slice(0, 3));
        } catch (err) {
            console.error("Failed to load dashboard data:", err);
            alert("Could not load complaints. Check console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (e) {
            alert('Failed to log out: ' + e.message);
        }
    };

    if (loading || !user || !profile) return <div style={{color: 'white', padding: '2rem'}}>Loading Session...</div>;

    // Badge Component inline for reuse
    const StatusBadge = ({ status }) => {
        const getStyle = () => {
            if(status === 'Resolved') return 'badge-resolved';
            if(status === 'In Progress') return 'badge-inprogress';
            if(status === 'Assigned') return 'badge-assigned';
            return 'badge-pending';
        };
        return <span className={`badge ${getStyle()}`}>{status}</span>;
    };

    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">HostelCare</div>
                
                <div style={{ marginBottom: '2rem' }}>
                    <div className="text-xs font-medium text-muted mb-2 px-4" style={{ textTransform: 'uppercase' }}>Menu</div>
                    <Link to="/dashboard" className="nav-link active">Dashboard</Link>
                    <Link to="/tracking" className="nav-link">Complaint History</Link>
                    <a href="#" className="nav-link" onClick={() => alert('Profile Configuration')}>Profile</a>
                    <a href="#" className="nav-link" onClick={() => alert('Viewing Notifications')}>Notifications</a>
                    <a href="#" className="nav-link" onClick={() => alert('Opening Settings')}>Settings</a>
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <button className="nav-link" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', color: 'var(--danger)' }} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <div className="header">
                    <div>
                        <h1>Dashboard</h1>
                        <p className="text-muted text-sm mt-1">Welcome back, <span id="userName" style={{ fontWeight: 600 }}>{profile.name || user.email}</span>! Room: <span id="userRoom">{profile.roomNo || 'Unknown'}</span></p>
                    </div>
                    <div className="flex gap-4">
                        <div className="search-bar-container" style={{ width: '250px' }}>
                            <input type="text" className="form-control" placeholder="Quick search..." />
                        </div>
                        <button className="btn btn-secondary" onClick={() => alert('Notifications opened')}>🔔</button>
                        <button className="btn btn-primary" onClick={() => navigate('/create')}>Make Complaint</button>
                    </div>
                </div>

                <div className="grid-cards">
                    <div className="card stat-card">
                        <span className="stat-title">Total Submitted</span>
                        <span className="stat-value">{stats.total}</span>
                    </div>
                    <div className="card stat-card">
                        <span className="stat-title">Pending Action</span>
                        <span className="stat-value" style={{ color: 'var(--warning)' }}>{stats.pending}</span>
                    </div>
                    <div className="card stat-card">
                        <span className="stat-title">Resolved Issues</span>
                        <span className="stat-value" style={{ color: 'var(--success)' }}>{stats.resolved}</span>
                    </div>
                </div>

                <div className="details-grid">
                    <div className="card" style={{ gridColumn: 'span 2' }}>
                        <div className="flex justify-between align-center mb-6">
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recent Complaints</h2>
                            <button className="btn btn-secondary text-sm" onClick={() => navigate('/tracking')}>View All →</button>
                        </div>
                        
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Submitted</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan="5" className="text-center text-muted">Loading live records...</td></tr>
                                    ) : recent.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center text-muted">No recent complaints found.</td></tr>
                                    ) : (
                                        recent.map(c => (
                                            <tr key={c.id}>
                                                <td className="font-medium" style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate(`/details?id=${c.id}`)}>{c.id.toString().substring(0,8)}</td>
                                                <td>{c.category}</td>
                                                <td><StatusBadge status={c.status} /></td>
                                                <td>{formatDate(c.created_at || c.date)}</td>
                                                <td>
                                                    <button className="btn btn-secondary text-sm" style={{ padding: '0.25rem 0.5rem' }} onClick={() => navigate(`/details?id=${c.id}`)}>Track</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(108, 92, 231, 0.1)', borderColor: 'var(--primary)' }}>
                        <div>
                            <h3 style={{ fontWeight: 600, color: 'var(--primary-hover)' }}>Need Immediate Help?</h3>
                            <p className="text-sm text-muted mt-1">If your issue is an extreme emergency, please contact the warden directly.</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => alert('Calling Warden Mobile: +1 999 888 7777')}>Contact Warden</button>
                    </div>
                </div>
            </main>
        </div>
    );
}
