import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp, uploadProfileImage } from '../services/authService';
import { HOSTEL_LIST } from '../utils/data';

export default function StudentSignup() {
    const navigate = useNavigate();
    
    const [name, setName] = useState('');
    const [registerNumber, setRegisterNumber] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('student');
    const [hostelBlock, setHostelBlock] = useState(HOSTEL_LIST[0]);
    const [roomNumber, setRoomNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [profileImg, setProfileImg] = useState(null);
    const [profileImgPreview, setProfileImgPreview] = useState(null);
    
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImg(file);
            setProfileImgPreview(URL.createObjectURL(file));
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        
        if (password !== confirmPassword) {
            return setErrorMsg("Passwords do not match");
        }

        // RA Validation
        if (!registerNumber.toUpperCase().startsWith('RA')) {
            return setErrorMsg("Register number MUST start with 'RA'");
        }

        // Phone Validation (10 digits)
        const phoneRegex = /^[0-9]{10}$/;
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (!phoneRegex.test(cleanPhone)) {
            return setErrorMsg("Phone number must be exactly 10 digits");
        }

        if (role === 'student' && !roomNumber) {
            return setErrorMsg("Room number is required for students");
        }

        setLoading(true);
        
        try {
            let profile_url = null;
            if (profileImg) {
                profile_url = await uploadProfileImage(profileImg);
            }

            const userData = {
                name,
                register_number: registerNumber.toUpperCase(),
                phone: cleanPhone,
                role,
                hostel_block: hostelBlock,
                room_number: roomNumber,
                profile_url
            };

            await signUp(email, password, userData);
            alert("Account created successfully! Please Log In.");
            navigate('/login');
        } catch (error) {
            console.error("Signup failed:", error);
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <nav className="top-navbar">
                <Link to="/" className="sidebar-logo" style={{ marginBottom: 0, textDecoration: 'none' }}>
                    HostelCare
                </Link>
                <div className="nav-links">
                    <Link to="/login" className="btn btn-secondary">Login Instead</Link>
                </div>
            </nav>

            <main className="login-main py-12">
                <div className="login-card card" style={{ maxWidth: '600px', width: '100%' }}>
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white">Create Account</h1>
                        <p className="text-gray-400 mt-2">Join the HostelCare platform</p>
                    </div>

                    {errorMsg && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-500 p-3 rounded mb-6 text-sm">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-4">
                        {/* Profile Image Upload */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-600 mb-2 overflow-hidden flex items-center justify-center bg-gray-800 relative group cursor-pointer" onClick={() => document.getElementById('profileUpload').click()}>
                                {profileImgPreview ? (
                                    <img src={profileImgPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl opacity-50">📷</span>
                                )}
                                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-xs text-white">Upload</div>
                            </div>
                            <input id="profileUpload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            <span className="text-xs text-gray-500">Upload Profile Image (Optional)</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group mb-0">
                                <label className="form-label">Full Name</label>
                                <input type="text" className="form-control" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                            <div className="form-group mb-0">
                                <label className="form-label">Register Number</label>
                                <input type="text" className="form-control" placeholder="RAXXXXXXXXXXXXXXX" value={registerNumber} onChange={e => setRegisterNumber(e.target.value)} required />
                            </div>
                            <div className="form-group mb-0">
                                <label className="form-label">Phone Number</label>
                                <input type="tel" className="form-control" placeholder="10-digit number" value={phone} onChange={e => setPhone(e.target.value)} required />
                            </div>
                            <div className="form-group mb-0">
                                <label className="form-label">Role</label>
                                <select className="form-control bg-gray-900 border-gray-700" value={role} onChange={e => setRole(e.target.value)}>
                                    <option value="student">Student</option>
                                    <option value="staff">Staff</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="warden">Warden</option>
                                </select>
                            </div>
                            <div className="form-group mb-0">
                                <label className="form-label">Hostel Block</label>
                                <select className="form-control bg-gray-900 border-gray-700" value={hostelBlock} onChange={e => setHostelBlock(e.target.value)}>
                                    {HOSTEL_LIST.map(hostel => (
                                        <option key={hostel} value={hostel}>{hostel}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group mb-0">
                                <label className="form-label">Room Number</label>
                                <input type="text" className="form-control" placeholder="e.g. A-101" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required={role === 'student'} />
                            </div>
                        </div>

                        <hr className="border-gray-800 my-6" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group mb-0 md:col-span-2">
                                <label className="form-label">Email (Login ID)</label>
                                <input type="email" className="form-control" placeholder="e.g. S2023001@hostel.com" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <div className="form-group mb-0">
                                <label className="form-label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showPass ? "text" : "password"} className="form-control" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-group mb-0">
                                <label className="form-label flex justify-between">
                                    <span>Confirm Password</span>
                                    <span className="text-xs text-indigo-400 cursor-pointer" onClick={() => setShowPass(!showPass)}>{showPass ? 'Hide' : 'Show'}</span>
                                </label>
                                <input type={showPass ? "text" : "password"} className="form-control" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-full mt-6 py-3 text-lg" disabled={loading}>
                            {loading ? 'Creating Account & Profile...' : 'Complete Sign Up'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
