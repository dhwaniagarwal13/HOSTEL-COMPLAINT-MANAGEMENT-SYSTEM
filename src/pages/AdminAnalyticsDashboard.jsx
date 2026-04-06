import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getComplaints } from '../utils/data';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';

export default function AdminAnalyticsDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState({ 
        total: 0, 
        resolved: 0, 
        avgTime: '2.4 days', 
        urgent: 0,
        dist: { Plumbing: 0, Electrical: 0, Furniture: 0, Internet: 0 },
        distPercent: { Plumbing: 0, Electrical: 0, Furniture: 0, Internet: 0 }
    });
    const [urgentList, setUrgentList] = useState([]);

    useEffect(() => {
        if (!user) return;
        if (user.role !== 'admin') {
            navigate('/login');
            return;
        }

        
        const all = getComplaints();
        const urgents = all.filter(c => c.urgency === 'Extreme' && c.status !== 'Resolved');
        setUrgentList(urgents);
        
        let d = { Plumbing: 0, Electrical: 0, Furniture: 0, Internet: 0 };
        all.forEach(c => { if(d[c.category] !== undefined) d[c.category]++; });
        const per = {
            Plumbing: all.length ? Math.round((d.Plumbing / all.length) * 100) : 0,
            Electrical: all.length ? Math.round((d.Electrical / all.length) * 100) : 0,
            Furniture: all.length ? Math.round((d.Furniture / all.length) * 100) : 0,
            Internet: all.length ? Math.round((d.Internet / all.length) * 100) : 0
        };

        setStats({
            total: all.length,
            resolved: all.filter(c => c.status === 'Resolved').length,
            avgTime: '1.2 days', // Simulated calculation
            urgent: urgents.length,
            dist: d,
            distPercent: per
        });
    }, [navigate, user]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch(e) {
            console.error(e);
        }
    };

    if(!user) return null;

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-logo">HostelCare <span style={{fontSize:'0.75rem', color:'var(--danger)', fontWeight:'normal', marginLeft:'0.5rem'}}>ADMIN</span></div>
                
                <div style={{ marginBottom: '2rem' }}>
                    <div className="text-xs font-medium text-muted mb-2 px-4" style={{ textTransform: 'uppercase' }}>Core</div>
                    <Link to="/admin" className="nav-link">Management Panel</Link>
                    <Link to="/analytics" className="nav-link active">Analytics Hub</Link>
                    <a href="#" className="nav-link" onClick={() => alert('Users')}>User Management</a>
                    <a href="#" className="nav-link" onClick={() => alert('Settings')}>Settings</a>
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <button className="nav-link" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', color: 'var(--danger)' }} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <div className="header">
                    <div>
                        <h1>System Analytics</h1>
                        <p className="text-muted text-sm mt-1">High-level insights & performance metrics.</p>
                    </div>
                    <div className="flex gap-4">
                        <select className="form-control" style={{ width: '150px' }}>
                            <option>Last 30 Days</option>
                            <option>This Semester</option>
                            <option>All Time</option>
                        </select>
                        <button className="btn btn-primary" onClick={() => alert('Exporting report as PDF...')}>Export CSV</button>
                    </div>
                </div>

                <div className="grid-cards mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="card stat-card">
                        <span className="stat-title text-muted">Total Queries</span>
                        <span className="stat-value">{stats.total}</span>
                    </div>
                    <div className="card stat-card">
                        <span className="stat-title text-muted">Resolution Rate</span>
                        <span className="stat-value text-success" style={{ color: 'var(--success)' }}>
                            {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                        </span>
                    </div>
                    <div className="card stat-card">
                        <span className="stat-title text-muted">Avg. Resolution Time</span>
                        <span className="stat-value text-info" style={{ color: 'var(--info)' }}>{stats.avgTime}</span>
                    </div>
                    <div className="card stat-card" style={{ borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
                        <span className="stat-title text-danger" style={{ color: 'var(--danger)' }}>Extreme Hotspots</span>
                        <span className="stat-value text-danger" style={{ color: 'var(--danger)' }}>{stats.urgent}</span>
                    </div>
                </div>

                <div className="details-grid">
                    <div className="card">
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Issue Category Distribution</h2>
                        
                        <div className="flex" style={{ flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Plumbing</span><span>{stats.distPercent.Plumbing}% ({stats.dist.Plumbing})</span>
                                </div>
                                <div className="analytics-bar-bg"><div className="analytics-bar-fill" style={{ width: `${stats.distPercent.Plumbing}%`, background: 'var(--primary)' }}></div></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Electrical</span><span>{stats.distPercent.Electrical}% ({stats.dist.Electrical})</span>
                                </div>
                                <div className="analytics-bar-bg"><div className="analytics-bar-fill" style={{ width: `${stats.distPercent.Electrical}%`, background: 'var(--warning)' }}></div></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Furniture</span><span>{stats.distPercent.Furniture}% ({stats.dist.Furniture})</span>
                                </div>
                                <div className="analytics-bar-bg"><div className="analytics-bar-fill" style={{ width: `${stats.distPercent.Furniture}%`, background: 'var(--info)' }}></div></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Internet</span><span>{stats.distPercent.Internet}% ({stats.dist.Internet})</span>
                                </div>
                                <div className="analytics-bar-bg"><div className="analytics-bar-fill" style={{ width: `${stats.distPercent.Internet}%`, background: 'var(--success)' }}></div></div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ background: 'var(--secondary-bg)' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--danger)', marginBottom: '1rem' }}>⚠️ Urgent Attention Required</h2>
                        <div className="flex flex-column gap-2" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                            {urgentList.length === 0 ? (
                                <p className="text-sm text-muted">No extreme urgency complaints currently active.</p>
                            ) : (
                                urgentList.map(c => (
                                    <div key={c.id} className="card" style={{ padding: '1rem', border: '1px solid var(--danger)' }}>
                                        <div className="flex justify-between align-center mb-1">
                                            <span className="font-medium">{c.id}</span>
                                            <span className="text-xs text-muted">Block: {c.studentId}</span>
                                        </div>
                                        <p className="text-sm mb-2">{c.category} - {c.location}</p>
                                        <button className="btn btn-secondary text-sm w-full" onClick={() => navigate(`/staff-details?id=${c.id}`)}>Force Expedite</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
