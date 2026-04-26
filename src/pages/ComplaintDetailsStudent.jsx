import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getComplaintById, getComplaintComments, addComment, submitFeedback } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import SLATimer from '../components/SLATimer';

export default function ComplaintDetailsStudent() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const complaintId = searchParams.get('id');
    const [complaint, setComplaint] = useState(null);
    const [msgInput, setMsgInput] = useState('');
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    useEffect(() => {
        if (!user) return;
        if (!complaintId) {
            navigate('/tracking');
            return;
        }

        const fetchComplaintAndComments = async () => {
            try {
                const data = await getComplaintById(complaintId);
                if (data.user_id !== user.id) {
                    navigate('/tracking');
                    return;
                }
                setComplaint(data);
                
                const cmts = await getComplaintComments(complaintId);
                setComments(cmts);
            } catch (err) {
                console.error(err);
                navigate('/tracking');
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
                toast.success('Complaint status updated realistically!');
            })
            .subscribe();

        return () => {
            supabase.removeChannel(commentSub);
            supabase.removeChannel(complaintSub);
        };
    }, [complaintId, navigate, user]);

    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-900 text-white">Loading Complaint Details...</div>;
    if (!complaint) return null;

    const StatusBadge = ({ s }) => {
        if(!s) return null;
        let type = 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
        if(s.toLowerCase() === 'resolved') type = 'bg-green-500/20 text-green-500 border-green-500/50';
        if(s.toLowerCase() === 'in-progress' || s.toLowerCase() === 'in progress') type = 'bg-blue-500/20 text-blue-500 border-blue-500/50';
        if(s.toLowerCase() === 'assigned') type = 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50';
        return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${type}`}>{s.toUpperCase()}</span>;
    };

    const UrgencyBadge = ({ u }) => {
        if(!u) return null;
        const type = u === 'High' ? 'bg-red-500/20 text-red-500 border-red-500/50' : (u === 'Medium' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : 'bg-green-500/20 text-green-500 border-green-500/50');
        return <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${type}`}>{u}</span>;
    };

    const handleSendChat = async () => {
        if(!msgInput.trim()) return;
        try {
            await addComment(complaintId, user.id, msgInput);
            setMsgInput('');
        } catch(err) {
            toast.error("Failed to send message: " + err.message);
        }
    };

    const handleFeedbackSubmit = async () => {
        if(rating === 0) return toast.error("Please provide a star rating!");
        setSubmittingFeedback(true);
        try {
            await submitFeedback(complaintId, rating, feedbackMsg);
            toast.success("Feedback submitted. Thank you!");
        } catch (err) {
            toast.error("Error submitting feedback: " + err.message);
        } finally {
            setSubmittingFeedback(false);
        }
    };

    // Progress logic Tracker
    const curStatus = (complaint.status || 'pending').toLowerCase();
    const statuses = ['Pending', 'In Progress', 'Resolved']; // Updated based on requirements
    
    let curIdx = statuses.findIndex(s => s.toLowerCase() === curStatus);
    if(curIdx === -1) {
        if(curStatus === 'in-progress' || curStatus === 'assigned') curIdx = 1;
        else curIdx = 0;
    }

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        const d = new Date(isoString);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
    }

    return (
        <div className="app-container text-gray-200">
            <Toaster position="top-right" />
            <main className="main-content" style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '2rem' }}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <button className="btn btn-secondary mb-4" onClick={() => navigate(-1)}>← Back</button>
                        <h1 className="text-2xl font-bold">Ticket #{complaint.id.substring(0,8)}</h1>
                        <div className="text-sm text-gray-400 mt-1">{complaint.category} • Reported on {formatDate(complaint.created_at)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2 items-center">
                            <StatusBadge s={complaint.status} />
                            <UrgencyBadge u={complaint.priority} />
                            {complaint.escalated && complaint.status?.toLowerCase() !== 'resolved' && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white uppercase">Escalated</span>}
                        </div>
                        {complaint.status?.toLowerCase() !== 'resolved' && (
                            <div className="mt-2 text-sm">
                                <span className="text-gray-400 mr-2">SLA Time Left:</span> 
                                <SLATimer deadline={complaint.deadline} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="card mb-6" style={{ padding: '2rem 4rem' }}>
                    <div className="progress-tracker">
                        {statuses.map((s, idx) => {
                            let cl = "progress-step";
                            if (idx < curIdx) cl += " completed";
                            else if (idx === curIdx) {
                                cl += " active";
                                if (s === 'Resolved') cl += " completed";
                            }
                            return (
                                <div key={s} className={cl}>
                                    <div className="step-circle">{idx + 1}</div>
                                    <span className="step-label">{s}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="details-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card">
                            <h3 className="form-label" style={{ fontSize: '1rem' }}>Issue Description</h3>
                            <div className="text-sm text-gray-400 mb-2">Block: {complaint.hostel_block}</div>
                            <div className="text-sm text-gray-400 mb-2">
                                Assigned To: {complaint.assigned_staff_id ? <span className="text-indigo-400">Staff Assigned</span> : <span className="text-red-400">Unassigned</span>}
                            </div>
                            <h4 className="font-medium text-lg">{complaint.title}</h4>
                            <p className="whitespace-pre-wrap text-sm mt-2 text-gray-300">{complaint.description}</p>
                            
                            {complaint.image_url && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <h4 className="form-label text-sm text-gray-400">Attached Proof</h4>
                                    <img src={complaint.image_url} alt="Attachment" className="w-full max-h-96 object-cover rounded-md border border-gray-600 mt-2" />
                                </div>
                            )}
                        </div>

                        {(curStatus === 'resolved') && !complaint.feedback && (
                            <div className="card" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'var(--success)' }}>
                                <h3 className="text-green-500 font-bold text-lg mb-2">Issue Resolved!</h3>
                                <p className="text-sm text-gray-400 mb-4">How was your experience solving this complaint?</p>
                                <div className="flex gap-2 mb-4">
                                    {[1,2,3,4,5].map(star => (
                                        <button 
                                            key={star} 
                                            onClick={() => setRating(star)}
                                            className={`text-2xl transition ${rating >= star ? 'text-yellow-400 scale-110' : 'text-gray-600 hover:text-yellow-400/50'}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                                <textarea 
                                    className="form-control mb-3 w-full" 
                                    placeholder="Optional: leave a comment..." 
                                    value={feedbackMsg} onChange={e => setFeedbackMsg(e.target.value)} 
                                    rows={2}
                                />
                                <button className="btn btn-primary bg-green-600 hover:bg-green-700" onClick={handleFeedbackSubmit} disabled={submittingFeedback}>
                                    {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                                </button>
                            </div>
                        )}

                        {(curStatus === 'resolved') && complaint.feedback && (
                            <div className="card" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'var(--success)' }}>
                                <h3 className="text-green-500 font-bold text-lg mb-2">Feedback Received</h3>
                                <div className="text-yellow-400 text-xl mb-2">
                                    {Array(JSON.parse(complaint.feedback).rating).fill('★').join('')}
                                    <span className="text-gray-600">{Array(5 - JSON.parse(complaint.feedback).rating).fill('★').join('')}</span>
                                </div>
                                {JSON.parse(complaint.feedback).comment && (
                                    <p className="text-sm text-gray-300 italic">"{JSON.parse(complaint.feedback).comment}"</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="card flex flex-col h-[500px]">
                        <h3 className="form-label text-md mb-2">Support Chat</h3>
                        <p className="text-xs text-gray-400 mb-4">Communicate directly with the assigned staff member.</p>
                        
                        <div className="chat-container flex-1 overflow-hidden flex flex-col">
                            <div className="chat-messages p-4 flex-1 overflow-y-auto space-y-4">
                                {comments.length === 0 && (
                                    <div className="text-center text-gray-500 text-sm mt-4">No messages yet.</div>
                                )}
                                {comments.map(c => {
                                    const isMe = c.user_id === user.id;
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
            </main>
        </div>
    );
}
