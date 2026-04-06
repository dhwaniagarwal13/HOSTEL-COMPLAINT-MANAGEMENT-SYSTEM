import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getComplaints, formatDate } from '../utils/data';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function ComplaintTracking() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [filtered, setFiltered] = useState([]);
    
    // Filters
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [status, setStatus] = useState('All');

    useEffect(() => {
        if (!user || user.role !== 'student') {
            navigate('/login');
            return;
        }
        const all = getComplaints().filter(c => c.studentId === user.id).sort((a,b) => new Date(b.date) - new Date(a.date));
        setComplaints(all);
        setFiltered(all);
    }, [navigate]);

    useEffect(() => {
        let res = complaints;
        if(search) {
            const term = search.toLowerCase();
            res = res.filter(c => c.id.toLowerCase().includes(term) || c.category.toLowerCase().includes(term) || (c.description && c.description.toLowerCase().includes(term)));
        }
        if(category !== 'All') res = res.filter(c => c.category === category);
        if(status !== 'All') res = res.filter(c => c.status === status);
        setFiltered(res);
    }, [search, category, status, complaints]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const UrgencyBadge = ({ u }) => {
        const type = u === 'Extreme' ? 'badge-extreme' : (u === 'Mild' ? 'badge-mild' : 'badge-normal');
        return <span className={`badge ${type}`}>{u}</span>;
    };

    const StatusBadge = ({ s }) => {
        const type = s === 'Resolved' ? 'badge-resolved' : (s === 'In Progress' ? 'badge-inprogress' : (s === 'Assigned' ? 'badge-assigned' : 'badge-pending'));
        return <span className={`badge ${type}`}>{s}</span>;
    };

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-logo">HostelCare</div>
                <div style={{ marginBottom: '2rem' }}>
                    <div className="text-xs font-medium text-muted mb-2 px-4" style={{ textTransform: 'uppercase' }}>Menu</div>
                    <Link to="/dashboard" className="nav-link">Dashboard</Link>
                    <Link to="/tracking" className="nav-link active">Complaint History</Link>
                    <a href="#" className="nav-link" onClick={() => alert('Profile')}>Profile</a>
                    <a href="#" className="nav-link" onClick={() => alert('Settings')}>Settings</a>
                </div>
                <div style={{ marginTop: 'auto' }}>
                    <button className="nav-link" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', color: 'var(--danger)' }} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <div className="text-sm text-muted mb-2">
                    <Link to="/dashboard" style={{color:'inherit'}}>Dashboard</Link> / <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>Complaint History</span>
                </div>
                
                <div className="header">
                    <div>
                        <h1>Track Complaints</h1>
                        <p className="text-muted text-sm mt-1">Review the status and updates of all your submitted complaints.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="btn btn-primary" onClick={() => navigate('/create')}>Make Complaint</button>
                    </div>
                </div>

                <div className="card">
                    <div className="flex justify-between align-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                        <div className="search-bar-container" style={{ flex: 1, minWidth: '250px' }}>
                            <input type="text" className="form-control" placeholder="Search by ID or keywords..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                            <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
                                <option value="All">All Categories</option>
                                <option value="Electrical">Electrical</option>
                                <option value="Plumbing">Plumbing</option>
                                <option value="Water">Water</option>
                                <option value="Housekeeping">Housekeeping</option>
                                <option value="Furniture">Furniture</option>
                                <option value="Internet">Internet</option>
                                <option value="Other">Other</option>
                            </select>
                            <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                                <option value="All">All Statuses</option>
                                <option value="Submitted">Submitted</option>
                                <option value="Assigned">Assigned</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Category</th>
                                    <th>Urgency</th>
                                    <th>Date Submitted</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center text-muted py-8">No complaints match the criteria.</td></tr>
                                ) : (
                                    filtered.map(c => (
                                        <tr key={c.id}>
                                            <td className="font-medium" style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate(`/details?id=${c.id}`)}>{c.id}</td>
                                            <td>{c.category}</td>
                                            <td><UrgencyBadge u={c.urgency} /></td>
                                            <td>{formatDate(c.date)}</td>
                                            <td><StatusBadge s={c.status} /></td>
                                            <td>
                                                <button className="btn btn-secondary text-sm" style={{ padding: '0.25rem 0.625rem' }} onClick={() => navigate(`/details?id=${c.id}`)}>Track</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
