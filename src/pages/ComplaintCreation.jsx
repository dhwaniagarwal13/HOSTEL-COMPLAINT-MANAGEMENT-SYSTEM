import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createComplaint, uploadImage, getStaffForCategory } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import toast, { Toaster } from 'react-hot-toast';

export default function ComplaintCreation() {
    const navigate = useNavigate();
    const { user, profile, loading } = useAuth();
    const [step, setStep] = useState(1);
    
    // Form State
    const [category, setCategory] = useState('');
    const [subCat, setSubCat] = useState('');
    const [location, setLocation] = useState('');
    const [desc, setDesc] = useState('');
    const [urgency, setUrgency] = useState('Medium');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/login');
            }
            else if (profile && profile.role !== 'student') {
                navigate('/staff');
            } else if (profile) {
                // Auto-fill location if room and block exist
                const autoLocation = `${profile.hostel_block || ''}${profile.room_number ? ' - Room ' + profile.room_number : ''}`;
                setLocation(autoLocation);
            }
        }
    }, [user, profile, loading, navigate]);

    const handleSelectCategory = (cat) => {
        setCategory(cat);
        setStep(2);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => setImagePreview(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!user) return;
        
        if (!category || !location || !desc) {
            toast.error("Please fill all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            let imageUrl = null;
            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
            }
            
            // Auto-assign staff based on category
            const staffId = await getStaffForCategory(category);

            // Compute Deadline automatically based on SLA
            let hoursToAdd = 48; // Medium default
            if (urgency === 'High') hoursToAdd = 24;
            else if (urgency === 'Low') hoursToAdd = 72;
            
            const deadlineDate = new Date();
            deadlineDate.setHours(deadlineDate.getHours() + hoursToAdd);

            const complaintData = {
                user_id: user.id,
                title: subCat ? `${category} - ${subCat}` : category,
                description: `Location: ${location}\n\n${desc}`,
                category: category,
                priority: urgency,
                hostel_block: profile?.hostel_block || 'Not Specified',
                assigned_staff_id: staffId,
                status: 'pending',
                image_url: imageUrl,
                deadline: deadlineDate.toISOString()
            };

            await createComplaint(complaintData);
            toast.success('Complaint submitted successfully!');
            setTimeout(() => navigate(`/tracking`), 1500);
        } catch (error) {
            console.error("Error creating complaint:", error);
            toast.error("Failed to submit the complaint: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (e) {
            toast.error('Logout Error: ' + e.message);
        }
    };

    if (loading || !user) return <div className="h-screen flex items-center justify-center bg-gray-900 text-white">Loading Session...</div>;

    return (
        <div className="app-container text-gray-200">
            <Toaster position="top-right" />
            <aside className="sidebar">
                <div className="sidebar-logo">HostelCare</div>
                <div style={{ marginBottom: '2rem' }}>
                    <div className="text-xs font-medium text-muted mb-2 px-4" style={{ textTransform: 'uppercase' }}>Menu</div>
                    <Link to="/dashboard" className="nav-link">Dashboard</Link>
                    <Link to="/tracking" className="nav-link">Complaint History</Link>
                </div>
                <div style={{ marginTop: 'auto' }}>
                    <button className="nav-link" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', color: 'var(--danger)' }} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <div className="text-sm text-muted mb-2">
                    <Link to="/dashboard" style={{color: 'inherit'}}>Dashboard</Link> / <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>Make Complaint</span>
                </div>
                
                <div className="header mb-6">
                    <div>
                        <h1>Report an Issue</h1>
                        <p className="text-muted text-sm mt-1">Please provide accurate details to help us resolve the issue swiftly.</p>
                    </div>
                    {step === 2 && (
                        <button className="btn btn-secondary" onClick={() => setStep(1)}>← Change Category</button>
                    )}
                </div>

                {step === 1 && (
                    <div className="card">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Step 1: Select Category</h2>
                        <p className="text-muted text-sm mb-6">What type of issue are you experiencing?</p>
                        
                        <div className="category-grid">
                            {[
                                { name: 'Electrical', icon: '⚡' },
                                { name: 'Plumbing', icon: '🚰' },
                                { name: 'Furniture', icon: '🪑' },
                                { name: 'Internet', icon: '🌐' },
                                { name: 'Housekeeping', icon: '🧹' },
                                { name: 'Water', icon: '💧' },
                                { name: 'Pest Control', icon: '🐜' },
                                { name: 'Other', icon: '❓' }
                            ].map(cat => (
                                <div key={cat.name} className="category-card" onClick={() => handleSelectCategory(cat.name)}>
                                    <div className="category-icon">{cat.icon}</div>
                                    <div className="font-medium">{cat.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="card" style={{ maxWidth: '800px', padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Step 2: Issue Details</h2>
                        <p className="text-muted text-sm mb-6">Category selected: <strong style={{ color: 'var(--primary)' }}>{category}</strong></p>

                        <form onSubmit={handleSubmit}>
                            <div className="flex gap-4 mb-4">
                                <div className="form-group w-full">
                                    <label className="form-label">Sub-Category (Optional)</label>
                                    <input type="text" className="form-control" placeholder="E.g. Leaking pipe, Broken bulb" value={subCat} onChange={e => setSubCat(e.target.value)} />
                                </div>
                                <div className="form-group w-full">
                                    <label className="form-label">Urgency</label>
                                    <select className="form-control" value={urgency} onChange={e => setUrgency(e.target.value)}>
                                        <option value="Low">Low - No rush (+72 hrs)</option>
                                        <option value="Medium">Medium - Standard Priority (+48 hrs)</option>
                                        <option value="High">High - Requires immediate attention (+24 hrs)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group mb-4">
                                <label className="form-label">Exact Location</label>
                                <input type="text" className="form-control" placeholder="E.g. Inside bathroom, Near window" required value={location} onChange={e => setLocation(e.target.value)} />
                            </div>

                            <div className="form-group mb-4">
                                <label className="form-label">Detailed Description</label>
                                <textarea className="form-control" placeholder="Please describe the issue in detail..." required value={desc} onChange={e => setDesc(e.target.value)}></textarea>
                                <div className="text-right text-xs text-muted mt-1">{desc.length}/500</div>
                            </div>

                            <div className="form-group mb-6">
                                <label className="form-label">Attach Image (Optional)</label>
                                <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} />
                                {imagePreview && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <img src={imagePreview} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} alt="Preview" />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between align-center border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
