import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import { motion } from 'framer-motion';

export default function Directory() {
    const navigate = useNavigate();
    const { user, profile, loading } = useAuth();
    const [directoryData, setDirectoryData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [filterRole, setFilterRole] = useState('All');
    const [filterBlock, setFilterBlock] = useState('All');
    const [blocks, setBlocks] = useState([]);
    const [fetchLoading, setFetchLoading] = useState(true);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/login');
                return;
            }
            fetchDirectory();
        }
    }, [user, loading, navigate]);

    const fetchDirectory = async () => {
        setFetchLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, name, role, email, phone, hostel_block, profile_url')
                .in('role', ['staff', 'warden', 'supervisor']);
            
            if (error) throw error;
            setDirectoryData(data || []);
            setFilteredData(data || []);
            
            // Extract unique hostel blocks
            const uniqueBlocks = [...new Set(data.map(u => u.hostel_block).filter(Boolean))];
            setBlocks(uniqueBlocks);
        } catch(err) {
            console.error("Failed to fetch directory:", err);
        } finally {
            setFetchLoading(false);
        }
    };

    useEffect(() => {
        let res = directoryData;
        if(filterRole !== 'All') {
            res = res.filter(u => u.role === filterRole);
        }
        if(filterBlock !== 'All') {
            res = res.filter(u => u.hostel_block === filterBlock);
        }
        setFilteredData(res);
    }, [filterRole, filterBlock, directoryData]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch(e) {
            console.error(e);
        }
    };

    if (loading || !user || !profile) return <div className="h-screen flex text-white bg-gray-900 justify-center items-center">Loading Directory...</div>;

    const renderCard = (u, index) => (
        <motion.div 
            key={u.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)" }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="card p-6 bg-gray-800/60 backdrop-blur-sm border border-gray-700 hover:border-indigo-500/50 transition shadow-lg"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center text-xl font-bold shadow-md">
                        {u.profile_url ? (
                            <img src={u.profile_url} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                            u.name?.charAt(0) || '?'
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">{u.name}</h3>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase mt-1 ${
                            u.role === 'supervisor' ? 'bg-purple-500/20 text-purple-400' :
                            (u.role === 'warden' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400')
                        }`}>
                            {u.role}
                        </span>
                    </div>
                </div>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
                <p className="flex items-center gap-2"><span className="text-gray-500 w-16">Block:</span> {u.hostel_block || 'Global'}</p>
                <p className="flex items-center gap-2"><span className="text-gray-500 w-16">Email:</span> {u.email}</p>
                <p className="flex items-center gap-2"><span className="text-gray-500 w-16">Phone:</span> {u.phone || 'N/A'}</p>
            </div>
            {u.phone && (
                <a href={`tel:${u.phone}`} className="btn btn-primary w-full mt-6 text-center block">📞 Call Direct</a>
            )}
        </motion.div>
    );

    return (
        <div className="app-container text-gray-200">
            <aside className="sidebar">
                <div className="sidebar-logo">HostelCare</div>
                
                <div className="mb-8 mt-4">
                    <div className="text-xs font-medium text-gray-500 mb-2 px-4 uppercase tracking-wider">Navigation</div>
                    {profile.role === 'admin' ? (
                        <Link to="/admin" className="nav-link">Management Panel</Link>
                    ) : (['staff', 'supervisor', 'warden'].includes(profile.role)) ? (
                        <Link to="/staff" className="nav-link">Staff Dashboard</Link>
                    ) : (
                        <Link to="/dashboard" className="nav-link">Student Dashboard</Link>
                    )}
                    <Link to="/directory" className="nav-link active">Staff Directory</Link>
                </div>

                <div className="mt-auto">
                    <button className="nav-link w-full text-left border-0 bg-transparent text-red-500 hover:text-red-400" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <div className="header mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Staff Directory</h1>
                        <p className="text-gray-400 text-sm mt-1">Easily find and contact hostel administration and staff.</p>
                    </div>
                    <div className="flex gap-4">
                        <select className="form-control" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                            <option value="All">All Roles</option>
                            <option value="staff">Staff</option>
                            <option value="warden">Warden</option>
                            <option value="supervisor">Supervisor</option>
                        </select>
                        <select className="form-control" value={filterBlock} onChange={e => setFilterBlock(e.target.value)}>
                            <option value="All">All Blocks</option>
                            {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                </div>

                {fetchLoading ? (
                    <div className="flex flex-col items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                        <p className="text-gray-400">Fetching directory details...</p>
                    </div>
                ) : filteredData.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-12 card border border-gray-700 border-dashed bg-transparent">
                        <div className="text-4xl mb-4 opacity-50">👥</div>
                        <h3 className="text-xl font-medium text-gray-300">No admin available</h3>
                        <p className="text-gray-500 mt-2 text-sm">Try adjusting your filters or check back later.</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredData.map((u, i) => renderCard(u, i))}
                    </div>
                )}
            </main>
        </div>
    );
}
