import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getStudentComplaints } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import SLATimer from '../components/SLATimer';

export default function ComplaintTracking() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [status, setStatus] = useState('All');
    const [sortBy, setSortBy] = useState('latest');

    useEffect(() => {
        if(!loading) {
            if (!user) {
                navigate('/login');
                return;
            }
            fetchData();
        }
    }, [user, loading, navigate]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getStudentComplaints(user.id);
            setComplaints(data);
            setFiltered(data);
        } catch (e) {
            console.error('Error fetching complaints', e);
        } finally {
            setIsLoading(false);
        }
    };

    // Real-time subscription
    useEffect(() => {
        if (!user) return;
        const mySub = supabase
            .channel('tracking-complaints')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints', filter: `user_id=eq.${user.id}` }, () => {
                fetchData();
            })
            .subscribe();
        return () => supabase.removeChannel(mySub);
    }, [user]);

    useEffect(() => {
        let res = [...complaints];
        if(search) {
            const term = search.toLowerCase();
            res = res.filter(c => 
                (c.id && c.id.toLowerCase().includes(term)) || 
                (c.category && c.category.toLowerCase().includes(term)) || 
                (c.description && c.description.toLowerCase().includes(term)) ||
                (c.title && c.title.toLowerCase().includes(term))
            );
        }
        if(category !== 'All') res = res.filter(c => c.category === category);
        if(status !== 'All') res = res.filter(c => c.status?.toLowerCase() === status.toLowerCase());
        
        res.sort((a,b) => {
            if(sortBy === 'latest') return new Date(b.created_at) - new Date(a.created_at);
            if(sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
            if(sortBy === 'priority') {
                const p = { 'High': 3, 'Medium': 2, 'Low': 1 };
                return (p[b.priority] || 0) - (p[a.priority] || 0) || new Date(b.created_at) - new Date(a.created_at);
            }
            return 0;
        });

        setFiltered(res);
    }, [search, category, status, sortBy, complaints]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

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
        return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${type}`}>{s.toUpperCase()}</span>;
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    if (loading || !user) return <div className="h-screen flex items-center justify-center bg-gray-900 text-white">Loading Tracker...</div>;

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
                                <option value="pending">Pending</option>
                                <option value="in progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                            </select>
                            <select className="form-control" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="latest">Sort: Latest</option>
                                <option value="oldest">Sort: Oldest</option>
                                <option value="priority">Sort: Top Priority</option>
                            </select>
                        </div>
                    </div>
                    
                            <div className="table-container overflow-x-auto">
                        <table className="min-w-full text-left text-sm whitespace-nowrap">
                            <thead className="uppercase tracking-wider border-b border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-gray-400">ID</th>
                                    <th className="px-4 py-3 font-medium text-gray-400">Category</th>
                                    <th className="px-4 py-3 font-medium text-gray-400">Priority</th>
                                    <th className="px-4 py-3 font-medium text-gray-400">Time Left</th>
                                    <th className="px-4 py-3 font-medium text-gray-400">Date Submitted</th>
                                    <th className="px-4 py-3 font-medium text-gray-400">Status</th>
                                    <th className="px-4 py-3 font-medium text-gray-400">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="7" className="text-center text-gray-500 py-8">Loading records...</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center text-gray-500 py-8">No complaints match the criteria.</td></tr>
                                ) : (
                                    filtered.map(c => (
                                        <tr key={c.id} className="border-b border-gray-800">
                                            <td className="px-4 py-3 font-medium text-indigo-400 cursor-pointer" onClick={() => navigate(`/details?id=${c.id}`)}>#{c.id.toString().substring(0,8)}</td>
                                            <td className="px-4 py-3">{c.category}</td>
                                            <td className="px-4 py-3"><UrgencyBadge u={c.priority} /></td>
                                            <td className="px-4 py-3">
                                                {c.status?.toLowerCase() === 'resolved' ? (
                                                    <span className="text-green-500 text-xs font-semibold">Resolved</span>
                                                ) : (
                                                    <SLATimer deadline={c.deadline} />
                                                )}
                                            </td>
                                            <td className="px-4 py-3">{formatDate(c.created_at)}</td>
                                            <td className="px-4 py-3"><StatusBadge s={c.status} /> {c.escalated && c.status?.toLowerCase() !== 'resolved' && <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white uppercase">Escalated</span>}</td>
                                            <td className="px-4 py-3">
                                                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs transition" style={{ padding: '0.25rem 0.625rem' }} onClick={() => navigate(`/details?id=${c.id}`)}>Track</button>
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
