import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllComplaints, checkAndEscalateComplaints } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import { supabase } from '../lib/supabase';
import SLATimer from '../components/SLATimer';

export default function StaffDashboard() {
    const navigate = useNavigate();
    const { user, profile, loading } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('All');
    const [urgFilter, setUrgFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showOverdue, setShowOverdue] = useState(false);
    const [sortBy, setSortBy] = useState('latest');
    
    // Pin System (Supervisor / Warden)
    const [pinnedIds, setPinnedIds] = useState(() => {
        try { return JSON.parse(localStorage.getItem(`pinned_${user?.id}`) || '[]') } catch { return [] }
    });

    const togglePin = (e, id) => {
        e.stopPropagation();
        const newPinned = pinnedIds.includes(id) ? pinnedIds.filter(pid => pid !== id) : [...pinnedIds, id];
        setPinnedIds(newPinned);
        if(user) localStorage.setItem(`pinned_${user.id}`, JSON.stringify(newPinned));
    };

    useEffect(() => {
        if (!loading) {
            if (!user || (profile && !['staff', 'admin', 'supervisor', 'warden'].includes(profile.role))) {
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

    // Real-time subscription
    useEffect(() => {
        if (!user) return;
        
        const mySub = supabase
            .channel('dashboard-complaints-staff')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints', filter: `assigned_staff_id=eq.${user.id}` }, () => {
                fetchData();
            })
            .subscribe();
            
        return () => supabase.removeChannel(mySub);
    }, [user]);

    // Check Escalation periodically
    useEffect(() => {
        if(!complaints.length) return;
        // On load
        checkAndEscalateComplaints(complaints);
        
        // Every 30 seconds
        const escInterval = setInterval(() => {
            checkAndEscalateComplaints(complaints);
        }, 30000);
        return () => clearInterval(escInterval);
    }, [complaints]);

    useEffect(() => {
        let res = [...complaints];
        if(search) res = res.filter(c => 
            (c.title && c.title.toLowerCase().includes(search.toLowerCase())) ||
            (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
            (c.id && c.id.toString().toLowerCase().includes(search.toLowerCase())) || 
            (c.room && c.room.toLowerCase().includes(search.toLowerCase())) ||
            (c.hostel_block && c.hostel_block.toLowerCase().includes(search.toLowerCase()))
        );
        if(urgFilter !== 'All') res = res.filter(c => c.priority === urgFilter);
        if(catFilter !== 'All') res = res.filter(c => c.category === catFilter);
        if(statusFilter !== 'All') res = res.filter(c => 
            statusFilter === 'resolved' ? c.status?.toLowerCase() === 'resolved' :
            statusFilter === 'in_progress' ? c.status?.toLowerCase() === 'in progress' || c.status?.toLowerCase() === 'in-progress' || c.status?.toLowerCase() === 'assigned' :
            c.status?.toLowerCase() === 'pending'
        );
        if(showOverdue) {
            res = res.filter(c => c.escalated === true && c.status?.toLowerCase() !== 'resolved');
        }

        // Sorting
        res.sort((a,b) => {
            if(sortBy === 'latest') return new Date(b.created_at) - new Date(a.created_at);
            if(sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
            if(sortBy === 'priority') {
                const p = { 'High': 3, 'Medium': 2, 'Low': 1 };
                return (p[b.priority] || 0) - (p[a.priority] || 0) || new Date(b.created_at) - new Date(a.created_at);
            }
            return 0;
        });

        // Pinned elements always on top
        res.sort((a,b) => {
            const pinA = pinnedIds.includes(a.id) ? 1 : 0;
            const pinB = pinnedIds.includes(b.id) ? 1 : 0;
            return pinB - pinA;
        });

        setFiltered(res);
    }, [search, catFilter, urgFilter, showOverdue, statusFilter, sortBy, pinnedIds, complaints]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch(e) {
            console.error(e);
        }
    };

    if (loading || !user || !profile) return <div className="h-screen flex items-center justify-center bg-gray-900 text-white">Loading Session...</div>;

    const assignedCount = complaints.filter(c => c.status && (c.status.toLowerCase() === 'assigned' || c.status.toLowerCase() === 'in progress' || c.status.toLowerCase() === 'in-progress')).length;
    const extremeCount = complaints.filter(c => c.priority === 'High' && c.status && c.status.toLowerCase() !== 'resolved').length;
    const overdueCount = complaints.filter(c => c.escalated === true && c.status && c.status.toLowerCase() !== 'resolved').length;

    const UrgencyBadge = ({ u }) => {
        if(!u) return null;
        const type = u === 'High' ? 'bg-red-500/20 text-red-500 border-red-500/50' : (u === 'Medium' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : 'bg-green-500/20 text-green-500 border-green-500/50');
        return <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${type}`}>{u}</span>;
    };
    
    const StatusBadge = ({ s }) => {
        if(!s) return null;
        let type = 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
        if(s.toLowerCase() === 'resolved') type = 'bg-green-500/20 text-green-500 border-green-500/50';
        if(s.toLowerCase() === 'in progress' || s.toLowerCase() === 'in-progress') type = 'bg-blue-500/20 text-blue-500 border-blue-500/50';
        if(s.toLowerCase() === 'assigned') type = 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50';
        if(s.toLowerCase() === 'escalated') type = 'bg-red-500/20 text-red-500 border-red-500/50';
        return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${type}`}>{s.toUpperCase()}</span>;
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
                    <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); alert('Opening Settings'); }}>Settings</a>
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <button className="nav-link" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', color: 'var(--danger)' }} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <div className="header flex flex-col md:flex-row md:justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1>Staff Dashboard</h1>
                        <p className="text-muted text-sm mt-1">Hello, <span style={{fontWeight:600}}>{profile.name || user.email}</span>. You have <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{assignedCount}</span> active tasks.</p>
                    </div>
                    <div className="flex items-center gap-3 border-l border-gray-700 pl-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg border border-gray-600">
                            {profile.profile_url ? <img src={profile.profile_url} alt="Profile" className="w-full h-full object-cover" /> : (profile.name?.charAt(0) || user.email?.charAt(0) || '?').toUpperCase()}
                        </div>
                        <div className="hidden sm:block leading-tight">
                            <div className="text-sm font-semibold">{profile.name || 'Staff Member'}</div>
                            <div className="text-xs text-indigo-400 capitalize">{profile.role || 'staff'}</div>
                        </div>
                    </div>
                </div>

                <div className="grid-cards">
                    <div className="card stat-card">
                        <span className="stat-title">Currently Active Tasks</span>
                        <span className="stat-value">{assignedCount}</span>
                    </div>
                    <div className="card stat-card">
                        <span className="stat-title text-red-400">High Priority</span>
                        <span className="stat-value text-red-500">{extremeCount}</span>
                    </div>
                    <div className="card stat-card border-red-500/30">
                        <span className="stat-title text-red-500">Overdue SLA</span>
                        <span className="stat-value text-red-500">{overdueCount}</span>
                    </div>
                </div>

                <div className="details-grid">
                    <div className="card" style={{ gridColumn: 'span 2' }}>
                        <div className="flex justify-between align-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Work Queue</h2>
                            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                                <label className="text-sm flex items-center gap-2 cursor-pointer mr-4">
                                    <input type="checkbox" checked={showOverdue} onChange={e => setShowOverdue(e.target.checked)} />
                                    <span className={showOverdue ? 'text-red-400 font-medium' : 'text-gray-400'}>Show Overdue Escalated</span>
                                </label>
                                <div className="search-bar-container" style={{ width: '200px' }}>
                                    <input type="text" className="form-control" placeholder="Search ID/Title/Desc..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '1rem' }} />
                                </div>
                                <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
                                    <option value="All">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                </select>
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
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                                <select className="form-control" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 'auto' }}>
                                    <option value="latest">Sort: Latest</option>
                                    <option value="oldest">Sort: Oldest</option>
                                    <option value="priority">Sort: Top Priority</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Category</th>
                                        <th>Time Left</th>
                                        <th>Location</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                         <tr><td colSpan="7" className="text-center text-muted">Loading live queue...</td></tr>
                                    ) : filtered.length === 0 ? (
                                        <tr><td colSpan="7" className="text-center text-muted">No complaints found.</td></tr>
                                    ) : (
                                        filtered.map(c => {
                                            const isPinned = pinnedIds.includes(c.id);
                                            const isEscalated = c.escalated && c.status?.toLowerCase() !== 'resolved';
                                            return (
                                                <tr key={c.id} className={`${isEscalated ? 'border-l-4 border-red-500 bg-red-500/10' : ''} ${isPinned ? 'bg-indigo-900/20' : ''}`}>
                                                    <td className="font-medium" style={{ color: 'var(--primary)' }}>
                                                        {isPinned && <span className="text-indigo-400 mr-2" title="Pinned">📌</span>}
                                                        #{c.id.toString().substring(0,8)}
                                                    </td>
                                                    <td>{c.category}</td>
                                                    <td>
                                                        {c.status?.toLowerCase() === 'resolved' ? (
                                                            <span className="text-green-500 text-xs font-semibold">Resolved</span>
                                                        ) : (
                                                            <SLATimer deadline={c.deadline} />
                                                        )}
                                                    </td>
                                                    <td>{c.hostel_block}</td>
                                                    <td><UrgencyBadge u={c.priority} /></td>
                                                    <td>
                                                        <StatusBadge s={c.status} /> {isEscalated && <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white uppercase">Escalated</span>}
                                                    </td>
                                                    <td>
                                                        <div className="flex gap-2">
                                                            {(profile.role === 'supervisor' || profile.role === 'warden' || profile.role === 'admin') && (
                                                                <button className="btn text-sm" style={{ padding: '0.25rem 0.5rem', background: 'var(--card-bg)', border: '1px solid gray' }} onClick={(e) => togglePin(e, c.id)}>
                                                                    {isPinned ? 'Unpin' : 'Pin'}
                                                                </button>
                                                            )}
                                                            <button className="btn btn-secondary text-sm" style={{ padding: '0.25rem 0.5rem' }} onClick={() => navigate(`/staff-details?id=${c.id}`)}>Open →</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex" style={{ flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.2) 0%, var(--card-bg) 100%)', borderColor: 'var(--primary)' }}>
                            <h3 className="form-label" style={{ fontSize: '1rem', color: 'var(--primary-hover)' }}>Maintenance Tip</h3>
                            <p className="text-sm mt-2" style={{ color: 'var(--text-main)' }}>Always document visual proof when resolving tasks. This ensures transparency across the system!</p>
                            <button className="btn btn-secondary mt-4 w-full" onClick={() => alert('Viewing manual...')}>View Staff Manual</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
