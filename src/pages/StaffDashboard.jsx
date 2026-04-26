import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SLATimer from '../components/SLATimer';

export default function StaffDashboard() {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('complaints')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            setComplaints(data || []);
        } catch (error) {
            console.error("Error fetching complaints:", error);
            alert("Error fetching complaints: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const updates = { status: newStatus };
            if (newStatus === 'Resolved') {
                updates.resolved_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from('complaints')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            
            // Optimistic UI update
            setComplaints(complaints.map(c => c.id === id ? { ...c, ...updates } : c));
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error updating status: " + error.message);
        }
    };

    const filteredComplaints = complaints.filter(c => {
        if (statusFilter === 'All') return true;
        return c.status?.toLowerCase() === statusFilter.toLowerCase();
    });

    const getPriorityColor = (priority) => {
        switch(priority?.toLowerCase()) {
            case 'high': return 'bg-red-500/20 text-red-500 border-red-500/50';
            case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
            case 'low': return 'bg-green-500/20 text-green-500 border-green-500/50';
            default: return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
        }
    };

    const handleLogout = () => {
        navigate('/login');
    };

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-logo">HostelCare <span style={{fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:'normal', marginLeft:'0.5rem'}}>STAFF</span></div>
                
                <div style={{ marginBottom: '2rem' }}>
                    <div className="text-xs font-medium text-muted mb-2 px-4" style={{ textTransform: 'uppercase' }}>Menu</div>
                    <a href="#" className="nav-link active">Dashboard</a>
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <button className="nav-link" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', color: 'var(--danger)' }} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <div className="header flex justify-between items-center mb-8">
                    <div>
                        <h1>Staff Dashboard</h1>
                        <p className="text-muted text-sm mt-1">Manage and resolve assigned complaints.</p>
                    </div>
                    <div>
                        <select 
                            className="form-control" 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-muted py-10">Loading complaints...</div>
                ) : filteredComplaints.length === 0 ? (
                    <div className="text-center text-muted py-10 card">No complaints found.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredComplaints.map(c => (
                            <div key={c.id} className="card flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-semibold text-lg" style={{ color: 'var(--text-main)' }}>{c.title || c.category}</h3>
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(c.priority)}`}>
                                        {c.priority || 'Normal'}
                                    </span>
                                </div>
                                
                                <div className="text-sm text-gray-400 mb-4 flex-grow">
                                    <p className="mb-4 whitespace-pre-wrap">{c.description}</p>
                                    <div className="grid grid-cols-2 gap-3 text-xs bg-gray-800/50 p-3 rounded">
                                        <div>
                                            <span className="text-gray-500 block mb-1">Category</span>
                                            {c.category}
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block mb-1">Location</span>
                                            {c.hostel_block} {c.room_number ? `- ${c.room_number}` : ''}
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block mb-1">Status</span>
                                            <span className="capitalize text-indigo-400 font-medium">{c.status}</span>
                                        </div>
                                        {c.deadline && c.status?.toLowerCase() !== 'resolved' && (
                                            <div>
                                                <span className="text-gray-500 block mb-1">Time Left</span>
                                                <SLATimer deadline={c.deadline} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-800 mt-auto">
                                    <div className="flex gap-2">
                                        {c.status?.toLowerCase() !== 'in progress' && c.status?.toLowerCase() !== 'resolved' && (
                                            <button 
                                                className="btn btn-secondary w-full text-sm" 
                                                onClick={() => updateStatus(c.id, 'In Progress')}
                                            >
                                                Start Work
                                            </button>
                                        )}
                                        {c.status?.toLowerCase() !== 'resolved' && (
                                            <button 
                                                className="btn btn-primary w-full text-sm !bg-green-600 hover:!bg-green-700 !border-green-600" 
                                                onClick={() => updateStatus(c.id, 'Resolved')}
                                            >
                                                Mark Resolved
                                            </button>
                                        )}
                                        {c.status?.toLowerCase() === 'resolved' && (
                                            <div className="text-green-500 text-sm font-medium text-center w-full bg-green-500/10 py-2 rounded">
                                                ✓ Resolved {c.resolved_at ? new Date(c.resolved_at).toLocaleDateString() : ''}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
