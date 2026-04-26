import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getComplaintById, updateComplaintStatus, uploadImage, getComplaintComments, addComment } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import SLATimer from '../components/SLATimer';

export default function ComplaintDetailsStaff() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [searchParams] = useSearchParams();
    const complaintId = searchParams.get('id');
    const [complaint, setComplaint] = useState(null);
    const [msgInput, setMsgInput] = useState('');
    const [comments, setComments] = useState([]);
    const [resolutionFile, setResolutionFile] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if(!currentUser || (currentUser.role !== 'staff' && currentUser.role !== 'admin' && currentUser.role !== 'warden' && currentUser.role !== 'supervisor')){
            navigate('/login');
            return;
        }

        if (!complaintId) {
            navigate('/staff');
            return;
        }

        const fetchComplaintAndComments = async () => {
            try {
                const data = await getComplaintById(complaintId);
                setComplaint(data);
                
                const cmts = await getComplaintComments(complaintId);
                setComments(cmts);
            } catch (err) {
                console.error(err);
                navigate('/staff');
            } finally {
                setLoading(false);
            }
        };
        fetchComplaintAndComments();

        // Realtime Subscriptions
        const commentSub = supabase
            .channel(`comments-${complaintId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `complaint_id=eq.${complaintId}` }, () => {
                getComplaintComments(complaintId).then(setComments);
            })
            .subscribe();

        const complaintSub = supabase
            .channel(`complaint-${complaintId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'complaints', filter: `id=eq.${complaintId}` }, (payload) => {
                setComplaint(prev => ({...prev, ...payload.new}));
                toast.success('Complaint status updated by another user!');
            })
            .subscribe();

        return () => {
            supabase.removeChannel(commentSub);
            supabase.removeChannel(complaintSub);
        };
    }, [complaintId, navigate, currentUser]);

    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-900 text-white">Loading Complaint...</div>;
    if (!complaint) return null;

    const StatusBadge = ({ s }) => {
        if(!s) return null;
        let type = 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
        if(s.toLowerCase() === 'resolved') type = 'bg-green-500/20 text-green-500 border-green-500/50';
        if(s.toLowerCase() === 'in-progress' || s.toLowerCase() === 'in progress') type = 'bg-blue-500/20 text-blue-500 border-blue-500/50';
        if(s.toLowerCase() === 'assigned') type = 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50';
        if(s.toLowerCase() === 'escalated') type = 'bg-red-500/20 text-red-500 border-red-500/50';
        return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${type}`}>{s.toUpperCase()}</span>;
    };

    const UrgencyBadge = ({ u }) => {
        if(!u) return null;
        const type = u === 'High' ? 'bg-red-500/20 text-red-500 border-red-500/50' : (u === 'Medium' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : 'bg-green-500/20 text-green-500 border-green-500/50');
        return <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${type}`}>{u}</span>;
    };

    const updateWork = async (newStatus) => {
        if(!window.confirm(`Update status to ${newStatus}?`)) return;
        setIsUpdating(true);
        try {
            let resUrl = complaint.resolution_image_url;
            
            // If marking resolved and provided an image, upload it
            if (newStatus === 'Resolved' && resolutionFile) {
                resUrl = await uploadImage(resolutionFile);
            }
            
            const updates = { 
                status: newStatus.toLowerCase(),
                resolution_image_url: resUrl
            };
            
            await updateComplaintStatus(complaint.id, updates);
            toast.success(`Status updated to ${newStatus}`);
        } catch (err) {
            toast.error("Error updating status: " + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleEscalate = async () => {
        if(!window.confirm(`Escalate this ticket to Admin?`)) return;
        setIsUpdating(true);
        try {
            await updateComplaintStatus(complaint.id, { escalated: true });
            toast.success("Ticket successfully escalated to Administration.");
        } catch (err) {
            toast.error("Error escalating: " + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSendChat = async () => {
        if(!msgInput.trim()) return;
        try {
            await addComment(complaintId, currentUser.id, msgInput);
            setMsgInput('');
        } catch(err) {
            toast.error("Failed to send message: " + err.message);
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        const d = new Date(isoString);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
    }

    return (
        <div className="app-container text-gray-200" style={{ minHeight: 'calc(100vh - 65px)' }}>
            <Toaster position="top-right" />
            <main className="main-content" style={{ maxWidth: '1400px', margin: '0 auto', paddingTop: '2rem' }}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <button className="btn btn-secondary mb-4" onClick={() => navigate(-1)}>← Return to Queue</button>
                        <h1 className="text-2xl font-bold">{complaint.title || `Details for ${complaint.id}`}</h1>
                        <div className="text-sm text-gray-400 mt-1">ID: {complaint.id.substring(0,8)} • {complaint.category}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2 items-center">
                            <StatusBadge s={complaint.status} />
                            {complaint.escalated && complaint.status?.toLowerCase() !== 'resolved' && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white uppercase">Escalated</span>}
                            <UrgencyBadge u={complaint.priority} />
                        </div>
                        {complaint.status?.toLowerCase() !== 'resolved' && (
                            <div className="mt-2 text-sm">
                                <span className="text-gray-400 mr-2">SLA Time Left:</span> 
                                <SLATimer deadline={complaint.deadline} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="details-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card">
                            <h3 className="form-label" style={{ fontSize: '1rem' }}>Issue Description</h3>
                            <p className="whitespace-pre-wrap text-sm mt-2 text-gray-300">{complaint.description}</p>
                            
                            {complaint.image_url && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <h4 className="form-label text-sm text-gray-400">Attached Proof</h4>
                                    <img src={complaint.image_url} alt="Attachment" className="w-full max-h-96 object-cover rounded-md border border-gray-600 mt-2" />
                                </div>
                            )}
                        </div>

                        <div className="card flex flex-col h-[400px] mt-4">
                            <h3 className="form-label text-md mb-2">Support Chat</h3>
                            <p className="text-xs text-gray-400 mb-4">Communicate directly with the student.</p>
                            
                            <div className="chat-container flex-1 overflow-hidden flex flex-col">
                                <div className="chat-messages p-4 flex-1 overflow-y-auto space-y-4">
                                    {comments.length === 0 && (
                                        <div className="text-center text-gray-500 text-sm mt-4">No messages yet.</div>
                                    )}
                                    {comments.map(c => {
                                        const isMe = c.user_id === currentUser.id;
                                        return (
                                            <div key={c.id} className={`chat-msg ${isMe ? 'student' : 'staff'}`}>
                                                {!isMe && <div className="chat-msg-header">{c.users?.name} ({c.users?.role})</div>}
                                                <div className="text-sm">{c.message}</div>
                                                <div className="text-xs opacity-70 mt-1 text-right">{formatDate(c.created_at)}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="chat-input-area border-t border-gray-700 bg-gray-800 p-2 flex gap-2 shrink-0">
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Type a message..." 
                                        value={msgInput} 
                                        onChange={e => setMsgInput(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && handleSendChat()}
                                    />
                                    <button className="btn btn-primary" onClick={handleSendChat}>Send</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card flex" style={{ gap: '2rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <h3 className="form-label text-sm text-gray-400 mb-2 uppercase tracking-wide">Location Info</h3>
                                <div className="font-medium text-lg">
                                    <strong>Block: {complaint.hostel_block}</strong><br />
                                </div>
                            </div>
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <h3 className="form-label text-sm text-gray-400 mb-2 uppercase tracking-wide">Reporter</h3>
                                <div className="assigned-staff-card text-main" style={{ marginBottom: '1rem', border: 'none', padding: 0, background: 'transparent' }}>
                                    <div className="avatar bg-indigo-600">{complaint.users?.name?.charAt(0) || '?'}</div>
                                    <div style={{ flex: 1 }}>
                                        <div className="font-medium">{complaint.users?.name || 'Unknown Student'}</div>
                                        <div className="text-sm text-gray-400">Phone: {complaint.users?.phone || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card shadow-lg border-t-4 border-indigo-500">
                            <h3 className="form-label mb-4 text-lg font-semibold">Quick Actions</h3>
                            <div className="flex flex-col gap-3">
                                <button className="btn btn-secondary text-left flex justify-between items-center" disabled={isUpdating} onClick={() => updateWork('in_progress')}>
                                    <span>Mark In Progress</span><span>⏳</span>
                                </button>
                                
                                <div className="border border-dashed border-gray-600 p-4 rounded-md mt-2">
                                    <label className="text-sm text-gray-400 font-medium block mb-2">Attach Resolution Proof (Optional)</label>
                                    <input type="file" className="form-control mb-3" accept="image/*" onChange={(e) => setResolutionFile(e.target.files[0])} />
                                    <button className="btn btn-primary w-full text-left flex justify-between items-center bg-green-600 hover:bg-green-700" disabled={isUpdating} onClick={() => updateWork('resolved')}>
                                        <span>Resolve Full Ticket</span><span>✅</span>
                                    </button>
                                </div>
                                
                                <button className="btn btn-secondary text-left flex justify-between items-center mt-2 border-red-500/50 text-red-400" disabled={isUpdating} onClick={handleEscalate}>
                                    <span>Escalate to Admin</span><span>⚠️</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
