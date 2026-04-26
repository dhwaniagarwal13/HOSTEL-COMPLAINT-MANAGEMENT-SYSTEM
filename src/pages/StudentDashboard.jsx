import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getStudentComplaints } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import { supabase } from '../lib/supabase';
import SLATimer from '../components/SLATimer';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentDashboard() {
    const navigate = useNavigate();
    const { user, profile, loading } = useAuth();
    const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
    const [recent, setRecent] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // New Feature States
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [profileForm, setProfileForm] = useState({ phone: '', room_number: '', hostel_block: '' });
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/login');
            } else if (profile && profile.role !== 'student') {
                navigate('/staff');
            } else if (profile) {
                setProfileForm({
                    phone: profile.phone || '',
                    room_number: profile.room_number || '',
                    hostel_block: profile.hostel_block || ''
                });
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
                pending: myComplaints.filter(c => c.status?.toLowerCase() !== 'resolved').length,
                resolved: myComplaints.filter(c => c.status?.toLowerCase() === 'resolved').length
            });

            setRecent(myComplaints.slice(0, 3));
            
            const notifs = myComplaints
                .filter(c => c.status && c.status.toLowerCase() !== 'pending' && c.status.toLowerCase() !== 'submitted')
                .slice(0, 5)
                .map(c => ({
                    id: c.id,
                    msg: `Ticket #${c.id.toString().substring(0,8)} is now marked as ${c.status.toUpperCase()}.`,
                    time: c.created_at
                }));
            setNotifications(notifs);
        } catch (err) {
            console.error("Failed to load dashboard data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Real-time subscription
    useEffect(() => {
        if (!user) return;
        
        const mySub = supabase
            .channel('dashboard-complaints')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints', filter: `user_id=eq.${user.id}` }, () => {
                fetchData(user.id);
            })
            .subscribe();
            
        return () => supabase.removeChannel(mySub);
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            const { error } = await supabase.from('users').update({
                phone: profileForm.phone,
                room_number: profileForm.room_number,
                hostel_block: profileForm.hostel_block
            }).eq('id', user.id);
            
            if(error) throw error;
            alert("Profile successfully updated!");
            setShowProfileModal(false);
        } catch (err) {
            alert('Error updating profile: ' + err.message);
        } finally {
            setIsSavingProfile(false);
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

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const StatusBadge = ({ status }) => {
        if(!status) return null;
        let type = 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
        if(status.toLowerCase() === 'resolved') type = 'bg-green-500/20 text-green-500 border-green-500/50';
        if(status.toLowerCase() === 'in progress' || status.toLowerCase() === 'in-progress') type = 'bg-blue-500/20 text-blue-500 border-blue-500/50';
        if(status.toLowerCase() === 'assigned') type = 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50';
        return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${type}`}>{status.toUpperCase()}</span>;
    };

    if (loading || !user || !profile) return <div className="h-screen flex items-center justify-center bg-gray-900 text-white">Loading Session...</div>;

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-logo">HostelCare</div>
                
                <div style={{ marginBottom: '2rem' }}>
                    <div className="text-xs font-medium text-muted mb-2 px-4" style={{ textTransform: 'uppercase' }}>Menu</div>
                    <Link to="/dashboard" className="nav-link active">Dashboard</Link>
                    <Link to="/create" className="nav-link">Raise Issue</Link>
                    <Link to="/tracking" className="nav-link">History</Link>
                    <Link to="/directory" className="nav-link">Staff Directory</Link>
                    <button className="nav-link w-full text-left bg-transparent border-0" onClick={() => setShowProfileModal(true)}>Profile Settings</button>
                    <button className="nav-link w-full text-left bg-transparent border-0" onClick={() => setShowSupportModal(true)}>Help & Support</button>
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <button className="nav-link w-full text-left border-0 bg-transparent" style={{ color: 'var(--danger)' }} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="main-content relative">
                <div className="header flex flex-col md:flex-row md:justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1>Dashboard</h1>
                        <p className="text-muted text-sm mt-1">Welcome back, <span style={{ fontWeight: 600 }}>{profile.name || user.email}</span>! Room: <span className="text-indigo-400 font-semibold">{profile.room_number || 'Not Set'}</span></p>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6 flex-wrap">
                        <div className="flex gap-4">
                            <button className="btn btn-secondary relative" onClick={() => setShowNotifications(!showNotifications)}>
                                🔔 {notifications.length > 0 && <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{notifications.length}</span>}
                            </button>
                            <button className="btn btn-primary" onClick={() => navigate('/create')}>Raise Complaint</button>
                        </div>
                        <div className="flex items-center gap-3 md:border-l border-gray-700 pl-2 md:pl-6">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg border border-gray-600">
                                {profile.profile_url ? <img src={profile.profile_url} alt="Profile" className="w-full h-full object-cover" /> : (profile.name?.charAt(0) || user.email?.charAt(0) || '?').toUpperCase()}
                            </div>
                            <div className="hidden sm:block leading-tight">
                                <div className="text-sm font-semibold">{profile.name || 'Student'}</div>
                                <div className="text-xs text-indigo-400 capitalize">{profile.role || 'student'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                    {showNotifications && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{ position: 'absolute', top: '80px', right: '40px', width: '350px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', zIndex: 50, boxShadow: 'var(--shadow-lg)' }}
                        >
                            <div className="p-4 border-b border-color-muted font-medium">Notifications</div>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {notifications.length === 0 ? <div className="p-4 text-center text-sm text-muted">No new notifications</div> : 
                                    notifications.map((n, i) => (
                                        <div key={i} className="p-4 border-b border-color-muted text-sm hover:bg-gray-800 cursor-pointer" onClick={() => navigate(`/details?id=${n.id}`)}>
                                            {n.msg} <div className="text-xs text-muted mt-1">{formatDate(n.time)}</div>
                                        </div>
                                    ))
                                }
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Profile Modal */}
                <AnimatePresence>
                    {showProfileModal && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="card" style={{ width: '400px', maxWidth: '90%' }}
                            >
                                <h2 className="mb-4 font-bold text-xl">Update Profile Details</h2>
                                <form onSubmit={handleUpdateProfile}>
                                    <div className="form-group mb-4">
                                        <label className="form-label">Phone Number</label>
                                        <input className="form-control" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} required />
                                    </div>
                                    <div className="form-group mb-4">
                                        <label className="form-label">Hostel Block</label>
                                        <input className="form-control" value={profileForm.hostel_block} onChange={e => setProfileForm({...profileForm, hostel_block: e.target.value})} readOnly />
                                    </div>
                                    <div className="form-group mb-6">
                                        <label className="form-label">Room Number</label>
                                        <input className="form-control" value={profileForm.room_number} onChange={e => setProfileForm({...profileForm, room_number: e.target.value})} required />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary" disabled={isSavingProfile}>{isSavingProfile ? 'Saving...' : 'Save Changes'}</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Support Modal */}
                <AnimatePresence>
                    {showSupportModal && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="card text-center" style={{ width: '400px', maxWidth: '90%' }}
                            >
                                <div className="text-4xl mb-4">🆘</div>
                                <h2 className="mb-2 font-bold text-xl">Help & Support</h2>
                                <p className="text-muted text-sm mb-6">Need assistance? We are here to help you.</p>
                                
                                <div className="space-y-4 mb-8">
                                    <div className="p-4 bg-gray-800 rounded-lg flex items-center justify-between">
                                        <span className="text-sm font-medium">Email</span>
                                        <a href="mailto:support@hostel.com" className="text-indigo-400">support@hostel.com</a>
                                    </div>
                                    <div className="p-4 bg-gray-800 rounded-lg flex items-center justify-between">
                                        <span className="text-sm font-medium">Emergency Phone</span>
                                        <span className="text-indigo-400">+91 999 888 7777</span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                    <button className="btn btn-primary py-3" onClick={() => { setShowSupportModal(false); navigate('/create'); }}>Raise New Complaint</button>
                                    <button className="btn btn-secondary" onClick={() => setShowSupportModal(false)}>Close</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <div className="grid-cards mt-4">
                    <motion.div whileHover={{ y: -5 }} className="card stat-card border-l-4 border-indigo-500">
                        <span className="stat-title">Total Submitted</span>
                        <span className="stat-value">{stats.total}</span>
                    </motion.div>
                    <motion.div whileHover={{ y: -5 }} className="card stat-card border-l-4 border-yellow-500">
                        <span className="stat-title">Pending Action</span>
                        <span className="stat-value" style={{ color: 'var(--warning)' }}>{stats.pending}</span>
                    </motion.div>
                    <motion.div whileHover={{ y: -5 }} className="card stat-card border-l-4 border-green-500">
                        <span className="stat-title">Resolved Issues</span>
                        <span className="stat-value" style={{ color: 'var(--success)' }}>{stats.resolved}</span>
                    </motion.div>
                </div>

                <div className="mt-8">
                    <div className="card">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Recent Complaints</h2>
                            <button className="btn btn-secondary text-sm" onClick={() => navigate('/tracking')}>View History →</button>
                        </div>
                        
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Time Left</th>
                                        <th>Submitted</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan="6" className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                                        </td></tr>
                                    ) : recent.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-12">
                                            <div className="text-4xl mb-2 opacity-20">📂</div>
                                            <p className="text-muted">No complaints yet. Everything looks good!</p>
                                            <button className="btn btn-primary mt-4" onClick={() => navigate('/create')}>Raise Your First Complaint</button>
                                        </td></tr>
                                    ) : (
                                        recent.map(c => (
                                            <tr key={c.id}>
                                                <td className="font-medium text-indigo-400 cursor-pointer" onClick={() => navigate(`/details?id=${c.id}`)}>#{c.id.toString().substring(0,8)}</td>
                                                <td>{c.category}</td>
                                                <td><StatusBadge status={c.status} /> {c.escalated && c.status?.toLowerCase() !== 'resolved' && <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white uppercase">Escalated</span>}</td>
                                                <td>
                                                    {c.status?.toLowerCase() === 'resolved' ? (
                                                        <span className="text-green-500 text-xs font-semibold">Resolved</span>
                                                    ) : (
                                                        <SLATimer deadline={c.deadline} />
                                                    )}
                                                </td>
                                                <td>{formatDate(c.created_at)}</td>
                                                <td>
                                                    <button className="btn btn-secondary text-xs" onClick={() => navigate(`/details?id=${c.id}`)}>Track</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
