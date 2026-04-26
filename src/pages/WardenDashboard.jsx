import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function WardenDashboard() {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch complaints
            const { data: compData, error: compError } = await supabase
                .from('complaints')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (compError) throw compError;
            setComplaints(compData || []);

            // Fetch staff members
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

    const assignStaff = async (id, staffId) => {
        try {
            const { error } = await supabase
                .from('complaints')
                .update({ assigned_staff_id: staffId, status: 'assigned' })
                .eq('id', id);

            if (error) throw error;
            
            setComplaints(complaints.map(c => c.id === id ? { ...c, assigned_staff_id: staffId, status: 'assigned' } : c));
        } catch (error) {
            alert("Error assigning staff: " + error.message);
        }
    };

    const escalateComplaint = async (id, currentlyEscalated) => {
        try {
            const newEscalated = !currentlyEscalated;
            const { error } = await supabase
                .from('complaints')
                .update({ escalated: newEscalated })
                .eq('id', id);

            if (error) throw error;
            
            setComplaints(complaints.map(c => c.id === id ? { ...c, escalated: newEscalated } : c));
        } catch (error) {
            alert("Error escalating complaint: " + error.message);
        }
    };

    const totalCount = complaints.length;
    const pendingCount = complaints.filter(c => c.status?.toLowerCase() === 'pending').length;
    const resolvedCount = complaints.filter(c => c.status?.toLowerCase() === 'resolved').length;

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-logo">HostelCare <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>WARDEN</span></div>
                <div style={{ marginBottom: '2rem' }}>
                    <div className="text-xs font-medium text-muted mb-2 px-4 uppercase">Menu</div>
                    <a href="#" className="nav-link active">Dashboard</a>
                </div>
                <div style={{ marginTop: 'auto' }}>
                    <button className="nav-link w-full text-left text-red-500 bg-transparent border-none cursor-pointer" onClick={() => navigate('/login')}>Logout</button>
                </div>
            </aside>

            <main className="main-content">
                <div className="mb-8">
                    <h1>Warden Dashboard</h1>
                    <p className="text-muted mt-1">Monitor all complaints and assign them to staff members.</p>
                </div>

                <div className="grid-cards mb-8">
                    <div className="card stat-card">
                        <span className="stat-title">Total Complaints</span>
                        <span className="stat-value">{totalCount}</span>
                    </div>
                    <div className="card stat-card">
                        <span className="stat-title text-yellow-500">Pending</span>
                        <span className="stat-value text-yellow-500">{pendingCount}</span>
                    </div>
                    <div className="card stat-card">
                        <span className="stat-title text-green-500">Resolved</span>
                        <span className="stat-value text-green-500">{resolvedCount}</span>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-muted py-10">Loading...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {complaints.map(c => (
                            <div key={c.id} className={`card ${c.priority?.toLowerCase() === 'high' ? 'border-red-500 border-2' : ''} ${c.escalated ? 'bg-red-500/10' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={`text-lg ${c.escalated ? 'font-bold text-red-400' : 'font-semibold'}`}>{c.title || c.category}</h3>
                                    <span className="text-xs uppercase px-2 py-1 bg-gray-800 rounded">{c.priority || 'Normal'}</span>
                                </div>
                                <p className="text-sm text-gray-400 mb-4">{c.hostel_block} {c.room_number ? `- ${c.room_number}` : ''}</p>
                                
                                <div className="flex justify-between items-center text-sm mb-4">
                                    <span>Status: <span className="text-indigo-400 capitalize">{c.status}</span></span>
                                    {c.escalated && <span className="text-red-500 font-bold text-xs uppercase px-2 py-1 bg-red-500/20 rounded">Escalated</span>}
                                </div>

                                <div className="border-t border-gray-800 pt-4 flex gap-2">
                                    <select 
                                        className="form-control text-sm w-full" 
                                        value={c.assigned_staff_id || ''}
                                        onChange={(e) => assignStaff(c.id, e.target.value)}
                                        disabled={c.status?.toLowerCase() === 'resolved'}
                                    >
                                        <option value="" disabled>Assign Staff</option>
                                        {staff.length > 0 ? (
                                            staff.map(s => <option key={s.id} value={s.id}>{s.name || s.email}</option>)
                                        ) : (
                                            <option value="mock-staff-1">Mock Staff Member</option>
                                        )}
                                    </select>
                                    
                                    <button 
                                        className={`btn text-sm whitespace-nowrap ${c.escalated ? 'btn-secondary' : 'bg-red-600 hover:bg-red-700 text-white border-none'}`}
                                        onClick={() => escalateComplaint(c.id, c.escalated)}
                                    >
                                        {c.escalated ? 'De-escalate' : 'Escalate'}
                                    </button>
                                </div>
                            </div>
                        ))}
                        
                        {complaints.length === 0 && (
                            <div className="col-span-1 md:col-span-2 text-center text-gray-500 py-10 card">
                                No complaints found in the system.
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
