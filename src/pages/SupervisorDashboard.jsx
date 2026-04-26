import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function SupervisorDashboard() {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [staff, setStaff] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: compData, error: compError } = await supabase
                .from('complaints')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (compError) throw compError;
            setComplaints(compData || []);

            const { data: staffData, error: staffError } = await supabase
                .from('users')
                .select('id, name, email')
                .eq('role', 'staff');
            
            if (!staffError) {
                setStaff(staffData || []);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const reassignStaff = async (id, staffId) => {
        try {
            const { error } = await supabase
                .from('complaints')
                .update({ assigned_staff_id: staffId, status: 'assigned' })
                .eq('id', id);

            if (error) throw error;
            
            setComplaints(complaints.map(c => c.id === id ? { ...c, assigned_staff_id: staffId, status: 'assigned' } : c));
        } catch (error) {
            alert("Error reassigning staff: " + error.message);
        }
    };

    const filteredComplaints = complaints.filter(c => {
        if (statusFilter === 'All') return true;
        return c.status?.toLowerCase() === statusFilter.toLowerCase();
    });

    const totalCount = complaints.length;
    const pendingCount = complaints.filter(c => c.status?.toLowerCase() === 'pending').length;
    const inProgressCount = complaints.filter(c => c.status?.toLowerCase() === 'in progress' || c.status?.toLowerCase() === 'assigned').length;
    const resolvedCount = complaints.filter(c => c.status?.toLowerCase() === 'resolved').length;

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-logo">HostelCare <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>SUPERVISOR</span></div>
                <div style={{ marginBottom: '2rem' }}>
                    <div className="text-xs font-medium text-muted mb-2 px-4 uppercase">Menu</div>
                    <a href="#" className="nav-link active">Dashboard</a>
                </div>
                <div style={{ marginTop: 'auto' }}>
                    <button className="nav-link w-full text-left text-red-500 bg-transparent border-none cursor-pointer" onClick={() => navigate('/login')}>Logout</button>
                </div>
            </aside>

            <main className="main-content">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1>Supervisor Dashboard</h1>
                        <p className="text-muted mt-1">System overview and staff reassignment.</p>
                    </div>
                    <select className="form-control w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="All">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="in progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>

                <div className="grid-cards mb-8">
                    <div className="card stat-card">
                        <span className="stat-title">Total</span>
                        <span className="stat-value">{totalCount}</span>
                    </div>
                    <div className="card stat-card">
                        <span className="stat-title text-yellow-500">Pending</span>
                        <span className="stat-value text-yellow-500">{pendingCount}</span>
                    </div>
                    <div className="card stat-card">
                        <span className="stat-title text-blue-500">In Progress</span>
                        <span className="stat-value text-blue-500">{inProgressCount}</span>
                    </div>
                    <div className="card stat-card">
                        <span className="stat-title text-green-500">Resolved</span>
                        <span className="stat-value text-green-500">{resolvedCount}</span>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-muted py-10">Loading...</div>
                ) : (
                    <div className="card overflow-x-auto">
                        <h2 className="mb-6 text-lg font-semibold">Complaint List</h2>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-800 text-gray-400">
                                    <th className="pb-3 font-medium text-sm">Title</th>
                                    <th className="pb-3 font-medium text-sm">Status</th>
                                    <th className="pb-3 font-medium text-sm">Priority</th>
                                    <th className="pb-3 font-medium text-sm">Assigned Staff</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredComplaints.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center text-muted py-8">No complaints found.</td></tr>
                                ) : (
                                    filteredComplaints.map(c => (
                                        <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                                            <td className="py-4">{c.title || c.category}</td>
                                            <td className="py-4 capitalize">
                                                <span className={`px-2 py-1 text-xs rounded-full ${c.status?.toLowerCase() === 'resolved' ? 'bg-green-500/20 text-green-500' : c.status?.toLowerCase() === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-2 py-1 text-xs rounded border ${c.priority?.toLowerCase() === 'high' ? 'bg-red-500/20 text-red-500 border-red-500/50' : c.priority?.toLowerCase() === 'medium' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : 'bg-green-500/20 text-green-500 border-green-500/50'}`}>
                                                    {c.priority || 'Normal'}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <select 
                                                    className="form-control text-sm py-1.5 px-3 max-w-xs" 
                                                    value={c.assigned_staff_id || ''}
                                                    onChange={(e) => reassignStaff(c.id, e.target.value)}
                                                    disabled={c.status?.toLowerCase() === 'resolved'}
                                                >
                                                    <option value="" disabled>Unassigned</option>
                                                    {staff.length > 0 ? (
                                                        staff.map(s => <option key={s.id} value={s.id}>{s.name || s.email}</option>)
                                                    ) : (
                                                        <option value="mock-staff-1">Mock Staff Member</option>
                                                    )}
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
