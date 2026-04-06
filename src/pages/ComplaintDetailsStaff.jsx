import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getComplaintById, addTimelineEvent, addChatMessage, formatDate } from '../utils/data';
import { useAuth } from '../context/AuthContext';

export default function ComplaintDetailsStaff() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [searchParams] = useSearchParams();
    const complaintId = searchParams.get('id');
    const [complaint, setComplaint] = useState(null);
    const [actionNote, setActionNote] = useState('');
    const [msgInput, setMsgInput] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        if(!currentUser || (currentUser.role !== 'staff' && currentUser.role !== 'admin')){
            navigate('/login');
            return;
        }
        setUser(currentUser);

        if (!complaintId) {
            navigate('/staff');
            return;
        }
        const c = getComplaintById(complaintId);
        if(!c) {
            navigate('/staff');
            return;
        }
        setComplaint(c);
    }, [complaintId, navigate]);

    if (!complaint) return null;

    const StatusBadge = ({ s }) => {
        const type = s === 'Resolved' ? 'badge-resolved' : (s === 'In Progress' ? 'badge-inprogress' : (s === 'Assigned' ? 'badge-assigned' : 'badge-pending'));
        return <span className={`badge ${type}`}>{s}</span>;
    };
    const UrgencyBadge = ({ u }) => {
        const type = u === 'Extreme' ? 'badge-extreme' : (u === 'Mild' ? 'badge-mild' : 'badge-normal');
        return <span className={`badge ${type}`}>{u}</span>;
    };

    const updateWork = (newStatus) => {
        if(!window.confirm(`Update status to ${newStatus}?`)) return;
        const note = actionNote.trim() || `Status changed to ${newStatus} by Staff.`;
        const updated = addTimelineEvent(complaintId, newStatus, note);
        if(updated) setComplaint(updated);
        setActionNote('');
    };

    const postNote = () => {
        if(!actionNote.trim()) return alert("Write a note first.");
        const updated = addTimelineEvent(complaintId, complaint.status, actionNote.trim());
        if(updated) setComplaint(updated);
        setActionNote('');
        alert("Note added to timeline.");
    };

    const handleSendChat = () => {
        if (!msgInput.trim()) return;
        const updated = addChatMessage(complaintId, msgInput.trim());
        if(updated) setComplaint(updated);
        setMsgInput('');
    };

    return (
        <div className="app-container" style={{ minHeight: 'calc(100vh - 65px)' }}>
            <main className="main-content" style={{ maxWidth: '1400px', margin: '0 auto', paddingTop: '2rem' }}>
                <div className="flex justify-between align-center mb-6">
                    <div>
                        <button className="btn btn-secondary mb-4" onClick={() => navigate(-1)}>← Return to Queue</button>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{complaint.title || `Details for ${complaint.id}`}</h1>
                        <div className="text-sm text-muted mt-1">ID: {complaint.id} • {complaint.category}</div>
                    </div>
                    <div className="flex gap-2">
                        <StatusBadge s={complaint.status} />
                        <UrgencyBadge u={complaint.urgency} />
                    </div>
                </div>

                <div className="details-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card">
                            <h3 className="form-label" style={{ fontSize: '1rem' }}>Issue Description</h3>
                            <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', marginTop: '0.5rem' }}>{complaint.description}</p>
                            
                            {complaint.image && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <h4 className="form-label text-sm text-muted">Field Images</h4>
                                    <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginBottom: 0 }}>
                                        <img src={complaint.image} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="card flex" style={{ gap: '2rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <h3 className="form-label text-sm text-muted mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location Map</h3>
                                <div className="map-preview mb-2" title="Mock Location Map"></div>
                                <div className="font-medium" style={{ fontSize: '0.95rem' }}>
                                    <strong>{complaint.location || complaint.roomNo}</strong><br />
                                    <span className="text-sm text-muted">Nearest Landmark: Block Entrance</span>
                                </div>
                            </div>
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <h3 className="form-label text-sm text-muted mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reporter</h3>
                                <div className="assigned-staff-card text-main" style={{ marginBottom: '1rem', border: 'none', padding: 0, background: 'transparent' }}>
                                    <div className="avatar" style={{ background: 'var(--primary)' }}>{complaint.studentName.charAt(0)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div className="font-medium">{complaint.studentName}</div>
                                        <div className="text-sm text-muted">Room: {complaint.roomNo} | ID: {complaint.studentId}</div>
                                    </div>
                                </div>
                                <button className="btn btn-secondary w-full" onClick={() => alert('Messaging system opened via modal')}>Direct Message Student</button>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="form-label" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>Audit Timeline</h3>
                            <div className="timeline">
                                {(complaint.timeline || []).map((t, i) => (
                                    <div key={i} className="timeline-item">
                                        <div className="timeline-date">{formatDate(t.date)}</div>
                                        <div className="timeline-content"><span className="font-medium">{t.status}</span> - {t.note}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card" style={{ boxShadow: 'var(--shadow-md)', borderTop: '4px solid var(--primary)' }}>
                            <h3 className="form-label mb-4" style={{ fontSize: '1.125rem' }}>Quick Actions</h3>
                            <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                                <button className="btn btn-secondary text-left flex justify-between align-center" onClick={() => updateWork('Assigned')}>
                                    <span>1. Acknowledge / Accept</span><span>📋</span>
                                </button>
                                <button className="btn btn-primary text-left flex justify-between align-center" onClick={() => updateWork('In Progress')} style={{ background: 'var(--info)' }}>
                                    <span>2. Mark In Progress</span><span>⏳</span>
                                </button>
                                <button className="btn btn-primary text-left flex justify-between align-center" onClick={() => updateWork('Resolved')} style={{ background: 'var(--success)' }}>
                                    <span>3. Resolve Full Ticket</span><span>✅</span>
                                </button>
                            </div>

                            <div className="mt-6 border-t pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                                <label className="form-label">Add Note / Update Log</label>
                                <textarea className="form-control mb-2" value={actionNote} onChange={e => setActionNote(e.target.value)} placeholder="E.g. Waiting for spare parts..."></textarea>
                                <button className="btn btn-secondary w-full" onClick={postNote}>Save to Timeline</button>
                            </div>
                        </div>
                        
                        <div className="card">
                            <h3 className="form-label" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Internal Support Chat</h3>
                            <div className="chat-container">
                                <div className="chat-messages">
                                    {!complaint.chat || complaint.chat.length === 0 ? (
                                        <div className="text-center text-muted text-sm mt-4">No messages yet.</div>
                                    ) : (
                                        complaint.chat.map((m, i) => (
                                            <div key={i} className={`chat-msg ${m.sender}`}>
                                                <div className="chat-msg-header">{m.name} • {new Date(m.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                                <div>{m.text}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="chat-input-area border-t pt-3 mt-auto">
                                    <input type="text" className="form-control" placeholder="Message student or admin..." value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendChat()} />
                                    <button className="btn btn-primary" onClick={handleSendChat}>Send</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
