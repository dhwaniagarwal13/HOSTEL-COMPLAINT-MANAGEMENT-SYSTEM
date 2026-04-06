import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getComplaintById, addChatMessage, formatDate } from '../utils/data';

export default function ComplaintDetailsStudent() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const complaintId = searchParams.get('id');
    const [complaint, setComplaint] = useState(null);
    const [msgInput, setMsgInput] = useState('');

    useEffect(() => {
        if (!complaintId) {
            navigate('/tracking');
            return;
        }
        const c = getComplaintById(complaintId);
        if (!c) {
            navigate('/tracking');
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

    const handleSendChat = () => {
        if (!msgInput.trim()) return;
        const updated = addChatMessage(complaintId, msgInput.trim());
        if (updated) setComplaint(updated);
        setMsgInput('');
    };

    // Progress logic Tracker
    const statuses = ['Submitted', 'Assigned', 'In Progress', 'Resolved'];
    const curIdx = statuses.indexOf(complaint.status);

    return (
        <div className="app-container">
            <main className="main-content" style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '2rem' }}>
                <div className="flex justify-between align-center mb-6">
                    <div>
                        <button className="btn btn-secondary mb-4" onClick={() => navigate(-1)}>← Back</button>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Ticket #{complaint.id}</h1>
                        <div className="text-sm text-muted mt-1">{complaint.category} • Reported on {formatDate(complaint.date)}</div>
                    </div>
                    <div className="flex gap-2">
                        <StatusBadge s={complaint.status} />
                        <UrgencyBadge u={complaint.urgency} />
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
                            <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', marginTop: '0.5rem' }}>{complaint.description}</p>
                            {complaint.image && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <h4 className="form-label text-sm text-muted">Attached Document / Image</h4>
                                    <img src={complaint.image} alt="Complaint Attachment" style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
                                </div>
                            )}
                        </div>

                        {complaint.assignedStaff && (complaint.status === 'Assigned' || complaint.status === 'In Progress' || complaint.status === 'Resolved') && (
                            <div className="card">
                                <h3 className="form-label" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Assigned Staff</h3>
                                <div className="assigned-staff-card text-main" style={{ color: 'var(--text-main)' }}>
                                    <div className="avatar" style={{ background: 'var(--primary)' }}>{complaint.assignedStaff.name.charAt(0)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div className="font-medium" style={{ fontSize: '1rem' }}>{complaint.assignedStaff.name}</div>
                                        <div className="text-sm text-muted">{complaint.assignedStaff.role}</div>
                                        <div className="text-sm" style={{ color: 'var(--warning)', fontWeight: 500 }}>⭐ {complaint.assignedStaff.rating}</div>
                                    </div>
                                    <button className="btn btn-primary" onClick={() => alert(`Calling ${complaint.assignedStaff.phone}`)}>Call</button>
                                </div>
                            </div>
                        )}

                        <div className="card">
                            <h3 className="form-label" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>Activity History</h3>
                            <div className="timeline">
                                {(complaint.timeline || []).map((t, i) => (
                                    <div key={i} className="timeline-item">
                                        <div className="timeline-date">{formatDate(t.date)}</div>
                                        <div className="timeline-content"><span className="font-medium">{t.status}</span> - {t.note}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {complaint.status === 'Resolved' && (
                            <div className="card" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'var(--success)' }}>
                                <h3 className="form-label text-success" style={{ color: 'var(--success)', fontSize: '1.125rem' }}>Issue Resolved!</h3>
                                <p className="text-sm text-muted mb-4">How was your experience solving this complaint?</p>
                                <div className="flex gap-2">
                                    <button className="btn btn-primary" onClick={() => alert('Feedback submitted: Great')}>👍 Fixed well!</button>
                                    <button className="btn btn-secondary" onClick={() => alert('Feedback submitted: Issues')}>👎 Still having issues</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <h3 className="form-label" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Support Chat</h3>
                        <p className="text-xs text-muted mb-4">Communicate directly with the assigned staff member or admin.</p>
                        
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
                            {complaint.status !== 'Resolved' && (
                                <div className="chat-input-area border-t pt-3 mt-auto">
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
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
