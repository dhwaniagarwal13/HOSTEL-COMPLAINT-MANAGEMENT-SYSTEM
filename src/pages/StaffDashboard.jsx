import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllComplaints } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';

export default function StaffDashboard() {
    const navigate = useNavigate();
    const { user, profile, loading } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('All');
    const [urgFilter, setUrgFilter] = useState('All');

    useEffect(() => {
        if (!loading) {
            if (!user || (profile && profile.role !== 'staff')) {
                navigate('/login');
                return;
            }
            fetchData();
        }
    }, [user, profile, loading, navigate]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getAllComplaints();
            setComplaints(data);
            setFiltered(data);
        } catch (error) {
            console.error("Error fetching complaints:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let res = complaints;
        if(search) res = res.filter(c => 
            (c.id && c.id.toString().toLowerCase().includes(search.toLowerCase())) || 
            (c.room && c.room.toLowerCase().includes(search.toLowerCase())) ||
            (c.hostel && c.hostel.toLowerCase().includes(search.toLowerCase()))
        );
        if(urgFilter !== 'All') res = res.filter(c => c.priority === urgFilter);
        if(catFilter !== 'All') res = res.filter(c => c.category === catFilter);
        setFiltered(res);
    }, [search, catFilter, urgFilter, complaints]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch(e) {
            console.error(e);
        }
    };

    if (loading || !user || !profile) return <div style={{color: 'white', padding: '2rem'}}>Loading Session...</div>;

    const assignedCount = complaints.filter(c => c.status === 'assigned' || c.status === 'in-progress').length;
    const extremeCount = complaints.filter(c => c.priority === 'Extreme' && c.status !== 'resolved').length;

    const UrgencyBadge = ({ u }) => {
        const type = u === 'Extreme' ? 'badge-extreme' : (u === 'Mild' ? 'badge-mild' : 'badge-normal');
        return <span className={`badge ${type}`}>{u}</span>;
    };
    const StatusBadge = ({ s }) => {
        const statusClass = s.toLowerCase().replace(' ', '-');
        return <span className={`badge badge-${statusClass}`}>{s}</span>;
    };

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-logo">HostelCare <span style={{fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:'normal', marginLeft:'0.5rem'}}>STAFF</span></div>
                
                <div style={{ marginBottom: '2rem' }}>
                    <div className="text-xs font-medium text-muted mb-2 px-4" style={{ textTransform: 'uppercase' }}>Menu</div>
                    <a href="#" className="nav-link active">Dashboard</a>
                    <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); alert('Viewing Work Orders'); }}>Work Orders</a>
                    <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); alert('Viewing Task History'); }}>Task History</a>
                    <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); alert('Viewing Analytics'); }}>Analytics</a>
                    <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); alert('Opening Settings'); }}>Settings</a>
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
                        <h1>Staff Dashboard</h1>
                        <p className="text-muted text-sm mt-1">Hello, <span style={{fontWeight:600}}>{user.name}</span>. You have <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>3</span> new updates.</p>
                    </div>
                    <div className="flex gap-4 align-center">
                        <button className="btn btn-secondary" onClick={() => alert('Notification Center Opened')}>🔔</button>
                        <button className="btn btn-primary" onClick={() => alert('Report generator opened')}>New Report</button>
                        <div className="avatar" style={{ backgroundColor: 'var(--success)' }}>SF</div>
                    </div>
                </div>

                <div className="grid-cards">
                    <div className="card stat-card">
                        <span className="stat-title">Assigned Complaints</span>
                        <span className="stat-value">{assignedCount}</span>
                    </div>
                    <div className="card stat-card">
                        <span className="stat-title">Extreme Urgency</span>
                        <span className="stat-value" style={{ color: 'var(--danger)' }}>{extremeCount}</span>
                    </div>
                    <div className="card stat-card">
                        <span className="stat-title">Due Today / Urgent</span>
                        <span className="stat-value" style={{ color: 'var(--warning)' }}>2</span>
                    </div>
                </div>

                <div className="details-grid">
                    <div className="card" style={{ gridColumn: 'span 2' }}>
                        <div className="flex justify-between align-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Work Queue</h2>
                            <div className="flex gap-2">
                                <div className="search-bar-container" style={{ width: '200px' }}>
                                    <input type="text" className="form-control" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '1rem' }} />
                                </div>
                                <select className="form-control" value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 'auto' }}>
                                    <option value="All">All Categories</option>
                                    <option value="Plumbing">Plumbing</option>
                                    <option value="Electrical">Electrical</option>
                                    <option value="Furniture">Furniture</option>
                                    <option value="Housekeeping">Housekeeping</option>
                                    <option value="Water">Water</option>
                                    <option value="Internet">Internet</option>
                                    <option value="Other">Other</option>
                                </select>
                                <select className="form-control" value={urgFilter} onChange={e => setUrgFilter(e.target.value)} style={{ width: 'auto' }}>
                                    <option value="All">All Urgencies</option>
                                    <option value="Extreme">Extreme</option>
                                    <option value="High">High</option>
                                    <option value="Normal">Normal</option>
                                    <option value="Mild">Mild</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Category</th>
                                        <th>Location</th>
                                        <th>Urgency</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center text-muted">No complaints found.</td></tr>
                                    ) : (
                                        filtered.map(c => (
                                            <tr key={c.id}>
                                                <td className="font-medium">{c.id}</td>
                                                <td>{c.category}</td>
                                                <td>{c.location}</td>
                                                <td><UrgencyBadge u={c.urgency} /></td>
                                                <td><StatusBadge s={c.status} /></td>
                                                <td>
                                                    <button className="btn btn-secondary text-sm" style={{ padding: '0.25rem 0.5rem' }} onClick={() => navigate(`/staff-details?id=${c.id}`)}>Action →</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex" style={{ flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card">
                            <h3 className="form-label" style={{ fontSize: '1rem' }}>Recent Updates Timeline</h3>
                            <div className="timeline mt-4">
                                <div className="timeline-item">
                                    <div className="timeline-date">10:45 AM</div>
                                    <div className="timeline-content">CMP-002 was marked as Assigned.</div>
                                </div>
                                <div className="timeline-item">
                                    <div className="timeline-date">Yesterday</div>
                                    <div className="timeline-content">System maintenance completed in Block A.</div>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.2) 0%, var(--card-bg) 100%)', borderColor: 'var(--primary)' }}>
                            <h3 className="form-label" style={{ fontSize: '1rem', color: 'var(--primary-hover)' }}>Maintenance Tip</h3>
                            <p className="text-sm mt-2" style={{ color: 'var(--text-main)' }}>Always ensure safety breakers are off during plumbing actions near electrical sockets.</p>
                            <button className="btn btn-secondary mt-4 w-full" onClick={() => alert('Viewing manual...')}>View Staff Manual</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
