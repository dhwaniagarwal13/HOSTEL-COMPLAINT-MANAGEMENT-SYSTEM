import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getComplaints, saveComplaint } from '../utils/data';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';

export default function AdminManagementPanel() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkStaff, setBulkStaff] = useState('');

    useEffect(() => {
        if (!user) return;
        if (user.role !== 'admin') {
            navigate('/login');
            return;
        }
        setComplaints(getComplaints());
    }, [navigate, user]);

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

    const handleBulkAssign = () => {
        if (selectedIds.size === 0) return alert('Select at least one complaint.');
        if (!bulkStaff) return alert('Select a staff member.');
        
        let all = [...complaints];
        selectedIds.forEach(id => {
            const idx = all.findIndex(c => c.id === id);
            if(idx > -1) {
                all[idx].assignedStaff = { name: bulkStaff, role: 'Maintenance', phone: '+1 123', rating: '4.9' };
                all[idx].status = 'Assigned';
                if(!all[idx].timeline) all[idx].timeline = [];
                all[idx].timeline.push({ status: 'Assigned', note: `Bulk assigned to ${bulkStaff} by Admin`, date: new Date().toISOString() });
                saveComplaint(all[idx]);
            }
        });
        setComplaints(all);
        setSelectedIds(new Set());
        setBulkStaff('');
        alert('Bulk assignment complete!');
    };

    if(!user) return null;

    const StatusBadge = ({ s }) => {
        const type = s === 'Resolved' ? 'badge-resolved' : (s === 'In Progress' ? 'badge-inprogress' : (s === 'Assigned' ? 'badge-assigned' : 'badge-pending'));
        return <span className={`badge ${type}`}>{s}</span>;
    };
    const UrgencyBadge = ({ u }) => {
        const type = u === 'Extreme' ? 'badge-extreme' : (u === 'Mild' ? 'badge-mild' : 'badge-normal');
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
                    <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); alert('Users Module'); }}>User Management</a>
                    <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); alert('Settings'); }}>Settings</a>
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <button className="nav-link" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', color: 'var(--danger)' }} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="main-content" style={{ background: 'var(--bg-color)' }}>
                <div className="header">
                    <div>
                        <h1>Management Panel</h1>
                        <p className="text-muted text-sm mt-1">Control room for all active issues and staff routing.</p>
                    </div>
                </div>

                <div className="card mb-6" style={{ background: 'var(--card-bg)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Bulk Actions</h2>
                    <div className="flex gap-4 align-center" style={{ flexWrap: 'wrap' }}>
                        <select className="form-control" style={{ maxWidth: '250px' }} value={bulkStaff} onChange={e => setBulkStaff(e.target.value)}>
                            <option value="">Assign selected to staff...</option>
                            <option value="Mike Smith">Mike Smith (Plumbing)</option>
                            <option value="Sarah Jenkins">Sarah Jenkins (Electrical)</option>
                            <option value="Dave Wood">Dave Wood (Carpentry)</option>
                        </select>
                        <button className="btn btn-primary" onClick={handleBulkAssign}>Apply changes</button>
                        <div className="text-sm text-muted ml-auto">{selectedIds.size} complaint(s) selected</div>
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === complaints.length} /></th>
                                <th>ID</th>
                                <th>Student</th>
                                <th>Category</th>
                                <th>Urgency</th>
                                <th>Status</th>
                                <th>Assigned To</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complaints.length === 0 ? (
                                <tr><td colSpan="8" className="text-center text-muted">No records found.</td></tr>
                            ) : (
                                complaints.map(c => (
                                    <tr key={c.id}>
                                        <td><input type="checkbox" checked={selectedIds.has(c.id)} onChange={(e) => handleSelectOne(c.id, e.target.checked)} /></td>
                                        <td className="font-medium">{c.id}</td>
                                        <td>{c.studentName}<br/><span className="text-xs text-muted">{c.roomNo}</span></td>
                                        <td>{c.category}</td>
                                        <td><UrgencyBadge u={c.urgency} /></td>
                                        <td><StatusBadge s={c.status} /></td>
                                        <td>{c.assignedStaff ? c.assignedStaff.name : <span className="text-muted text-sm italic">Unassigned</span>}</td>
                                        <td>
                                            <button className="btn btn-secondary text-sm" style={{ padding: '0.25rem 0.5rem' }} onClick={() => navigate(`/staff-details?id=${c.id}`)}>Manage</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
