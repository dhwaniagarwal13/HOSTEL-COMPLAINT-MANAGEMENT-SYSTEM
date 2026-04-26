import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllComplaints, updateComplaintStatus } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminManagementPanel() {
    const navigate = useNavigate();
    const { user, profile, loading } = useAuth();
    
    // Complaints State
    const [complaints, setComplaints] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkStatus, setBulkStatus] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    // Users State
    const [users, setUsers] = useState([]);
    const [showUserPanel, setShowUserPanel] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/login');
            } else if (profile && profile.role !== 'admin') {
                navigate('/staff');
            } else {
                fetchData();
            }
        }
    }, [navigate, user, profile, loading]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const comps = await getAllComplaints();
            setComplaints(comps || []);
            
            const { data: usersData } = await supabase.from('users').select('*').order('name');
            if(usersData) setUsers(usersData);
            
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch(e) {
            console.error(e);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedIds(new Set(complaints.map(c => c.id)));
        else setSelectedIds(new Set());
    };

    const handleSelectOne = (id, checked) => {
        const newSet = new Set(selectedIds);
        if (checked) newSet.add(id);
        else newSet.delete(id);
        setSelectedIds(newSet);
    };

    const handleBulkStatusChange = async () => {
        if (selectedIds.size === 0) return alert('Select at least one complaint.');
        if (!bulkStatus) return alert('Select a target status.');
        
        try {
            for(let id of selectedIds) {
                await updateComplaintStatus(id, { status: bulkStatus });
            }
            alert(`Successfully marked ${selectedIds.size} complaints as ${bulkStatus}`);
            setSelectedIds(new Set());
            setBulkStatus('');
            fetchData();
        } catch (err) {
            alert('Error applying bulk action: ' + err.message);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        if(!window.confirm(`Change this user's role to ${newRole}?`)) return;
        try {
            const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
            if (error) throw error;
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            alert("Role updated successfully.");
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    if(loading || !user || !profile) return <div className="h-screen flex items-center justify-center bg-gray-900 text-white">Loading Admin Panel...</div>;

    const StatusBadge = ({ s }) => {
        if(!s) return null;
        let type = 'badge-pending';
        if(s.toLowerCase() === 'resolved') type = 'badge-resolved';
        if(s.toLowerCase() === 'in progress' || s.toLowerCase() === 'in-progress') type = 'badge-inprogress';
        if(s.toLowerCase() === 'assigned') type = 'badge-assigned';
        if(s.toLowerCase() === 'escalated') type = 'badge-extreme';
        return <span className={`badge ${type}`}>{s.toUpperCase()}</span>;
    };
    
    const UrgencyBadge = ({ u }) => {
        if(!u) return null;
        const type = u === 'High' || u === 'Extreme' ? 'badge-extreme' : (u === 'Low' ? 'badge-mild' : 'badge-normal');
        return <span className={`badge ${type}`}>{u}</span>;
    };

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-logo">HostelCare <span style={{fontSize:'0.75rem', color:'var(--danger)', fontWeight:'normal', marginLeft:'0.5rem'}}>ADMIN</span></div>
                
                <div style={{ marginBottom: '2rem' }}>
                    <div className="text-xs font-medium text-muted mb-2 px-4" style={{ textTransform: 'uppercase' }}>Core</div>
                    <Link to="/admin" className="nav-link active">Management Panel</Link>
                    <Link to="/analytics" className="nav-link">Analytics Hub</Link>
                    <Link to="/directory" className="nav-link">Staff Directory</Link>
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <button className="nav-link" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', color: 'var(--danger)' }} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="main-content" style={{ background: 'var(--bg-color)' }}>
                <div className="header flex flex-col md:flex-row md:justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1>Management Panel</h1>
                        <p className="text-muted text-sm mt-1">Control room for all active issues and staff routing.</p>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6 flex-wrap">
                        <button className={`btn ${showUserPanel ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setShowUserPanel(!showUserPanel)}>
                            {showUserPanel ? 'View Complaints Queue' : 'User Role Management'}
                        </button>
                        <div className="flex items-center gap-3 md:border-l border-gray-700 pl-2 md:pl-4">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg border border-gray-600">
                                {profile?.profile_url ? <img src={profile.profile_url} alt="Profile" className="w-full h-full object-cover" /> : (profile?.name?.charAt(0) || user.email?.charAt(0) || '?').toUpperCase()}
                            </div>
                            <div className="hidden sm:block leading-tight">
                                <div className="text-sm font-semibold">{profile?.name || 'Administrator'}</div>
                                <div className="text-xs text-indigo-400 capitalize">{profile?.role || 'admin'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {showUserPanel ? (
                    <div className="card">
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Hostel User Directory</h2>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Profile</th>
                                        <th>Phone</th>
                                        <th>Hostel/Room</th>
                                        <th>Current Role</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-12 text-muted">No users registered in the system.</td></tr>
                                    ) : (
                                        users.map(u => (
                                            <tr key={u.id}>
                                                <td className="font-medium">{u.name || '-'}</td>
                                                <td>
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
                                                        {u.profile_url ? <img src={u.profile_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px]">{u.name?.charAt(0)}</div>}
                                                    </div>
                                                </td>
                                                <td>{u.phone || '-'}</td>
                                                <td>{u.hostel_block || 'N/A'} {u.room_number ? ` - ${u.room_number}` : ''}</td>
                                                <td><span className="badge badge-normal">{u.role}</span></td>
                                                <td>
                                                    <select className="form-control" style={{ width: 'auto', padding: '0.25rem' }} value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                                                        <option value="student">Student</option>
                                                        <option value="staff">Staff</option>
                                                        <option value="supervisor">Supervisor</option>
                                                        <option value="warden">Warden</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="card mb-6" style={{ background: 'var(--card-bg)' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Bulk Actions</h2>
                            <div className="flex gap-4 align-center" style={{ flexWrap: 'wrap' }}>
                                <select className="form-control" style={{ maxWidth: '250px' }} value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
                                    <option value="">Set status to...</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Pending">Pending</option>
                                </select>
                                <button className="btn btn-primary" onClick={handleBulkStatusChange}>Apply changes</button>
                                <div className="text-sm text-muted ml-auto">{selectedIds.size} complaint(s) selected</div>
                            </div>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === complaints.length} /></th>
                                        <th>ID</th>
                                        <th>Category</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan="6" className="text-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                                        </td></tr>
                                    ) : complaints.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-12 text-muted">No active complaints found.</td></tr>
                                    ) : (
                                        complaints.map(c => (
                                            <tr key={c.id} className="hover:bg-gray-800/40">
                                                <td><input type="checkbox" checked={selectedIds.has(c.id)} onChange={(e) => handleSelectOne(c.id, e.target.checked)} /></td>
                                                <td className="font-medium text-indigo-400">#{c.id.toString().substring(0,8)}</td>
                                                <td>{c.category}</td>
                                                <td><UrgencyBadge u={c.priority} /></td>
                                                <td><StatusBadge s={c.status} /></td>
                                                <td>
                                                    <button className="btn btn-secondary text-sm" style={{ padding: '0.25rem 0.5rem' }} onClick={() => navigate(`/staff-details?id=${c.id}`)}>Manage</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
