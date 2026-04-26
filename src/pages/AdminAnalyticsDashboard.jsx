import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllComplaints } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

export default function AdminAnalyticsDashboard() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [allData, setAllData] = useState([]);
    
    // Analytics stats
    const [stats, setStats] = useState({
        total: 0,
        resolved: 0,
        pending: 0,
        urgent: 0,
        avgTimeHours: 0,
    });

    const [categoryData, setCategoryData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [timeData, setTimeData] = useState([]);
    const [hostelData, setHostelData] = useState([]);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#475569'];

    useEffect(() => {
        if (!user) return;
        if (profile && profile.role !== 'admin' && profile.role !== 'supervisor') {
            navigate('/login');
            return;
        }

        const fetchAnalytics = async () => {
            try {
                const all = await getAllComplaints();
                setAllData(all);
                
                // Base stats
                const resolvedList = all.filter(c => c.status?.toLowerCase() === 'resolved');
                const pendingList = all.filter(c => c.status?.toLowerCase() !== 'resolved');
                const urgents = all.filter(c => c.priority === 'High' && c.status?.toLowerCase() !== 'resolved');

                // Average Resolution Time (in hours)
                let totalResTime = 0;
                let resolvedCount = 0;
                resolvedList.forEach(c => {
                    if(c.resolved_at) {
                        const t = new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime();
                        if(t > 0) {
                            totalResTime += t;
                            resolvedCount++;
                        }
                    }
                });
                const avgHours = resolvedCount > 0 ? (totalResTime / resolvedCount / (1000 * 60 * 60)).toFixed(1) : 0;

                setStats({
                    total: all.length,
                    resolved: resolvedList.length,
                    pending: pendingList.length,
                    urgent: urgents.length,
                    avgTimeHours: avgHours
                });

                // Status chart (Pending vs Resolved)
                setStatusData([
                    { name: 'Resolved', value: resolvedList.length },
                    { name: 'Pending/Active', value: pendingList.length }
                ]);

                // Category distribution
                const catMap = {};
                all.forEach(c => {
                    catMap[c.category] = (catMap[c.category] || 0) + 1;
                });
                setCategoryData(Object.entries(catMap).map(([k,v]) => ({ name: k, count: v })));

                // Hostel specific distribution
                const hostelMap = {};
                all.forEach(c => {
                    const hb = c.hostel_block || 'Unknown';
                    hostelMap[hb] = (hostelMap[hb] || 0) + 1;
                });
                setHostelData(Object.entries(hostelMap).map(([k,v]) => ({ name: k, count: v })));

                // Time trend (Peak complaint times based on Hour of Day)
                const hourMap = Array(24).fill(0);
                all.forEach(c => {
                    const h = new Date(c.created_at).getHours();
                    hourMap[h]++;
                });
                
                setTimeData(hourMap.map((count, hour) => ({
                    time: `${hour}:00`,
                    complaints: count
                })));

            } catch (err) {
                console.error("Failed to load analytics", err);
            }
        };
        fetchAnalytics();
    }, [navigate, user, profile]);

    const handleExportCSV = () => {
        if (allData.length === 0) return alert("No data to export");
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID,Category,Priority,Status,Hostel,Room,Created At\n";
        
        allData.forEach(row => {
            const dateStr = new Date(row.created_at).toLocaleString().replace(/,/g, '');
            csvContent += `${row.id},${row.category},${row.priority},${row.status},${row.hostel_block},N/A,${dateStr}\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `HostelCare_Complaints_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if(!user || !profile) return null;

    return (
        <div className="app-container text-gray-200">
            <aside className="sidebar">
                <div className="sidebar-logo">HostelCare <span className="text-xs text-red-500 font-normal ml-2">ADMIN</span></div>
                
                <div className="mb-8">
                    <div className="text-xs font-medium text-gray-400 mb-2 px-4 uppercase">Core</div>
                    <Link to="/admin" className="nav-link">Management Panel</Link>
                    <Link to="/analytics" className="nav-link active">Analytics Hub</Link>
                    <Link to="/directory" className="nav-link">Staff Directory</Link>
                </div>

                <div className="mt-auto">
                    <button className="nav-link w-full text-left bg-transparent border-0 text-red-500" onClick={logout}>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <div className="header mb-8 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">System Analytics</h1>
                        <p className="text-gray-400 text-sm mt-1">Real-time performance metrics and trends.</p>
                    </div>
                    <div className="flex gap-4 items-center flex-wrap">
                        <button className="btn btn-primary" onClick={handleExportCSV}>⬇ Export Data (CSV)</button>
                        <div className="flex items-center gap-3 md:border-l border-gray-700 pl-2 md:pl-4 ml-2">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg border border-gray-600">
                                {profile?.profile_url ? <img src={profile.profile_url} alt="Profile" className="w-full h-full object-cover" /> : (profile?.name?.charAt(0) || user.email?.charAt(0) || '?').toUpperCase()}
                            </div>
                            <div className="hidden sm:block leading-tight">
                                <div className="text-sm font-semibold">{profile?.name || 'Administrator'}</div>
                                <div className="text-xs text-indigo-400 capitalize">{profile?.role || 'admin'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-6 mb-8">
                    <div className="card p-6 border border-gray-700 bg-gray-800/40">
                        <span className="text-sm font-medium text-gray-400 block mb-1">Total Complaints</span>
                        <span className="text-3xl font-bold text-white">{stats.total}</span>
                    </div>
                    <div className="card p-6 border border-gray-700 bg-gray-800/40">
                        <span className="text-sm font-medium text-gray-400 block mb-1">Resolution Rate</span>
                        <span className="text-3xl font-bold text-green-500">
                            {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                        </span>
                    </div>
                    <div className="card p-6 border border-gray-700 bg-gray-800/40">
                        <span className="text-sm font-medium text-gray-400 block mb-1">Avg Resolution Time</span>
                        <span className="text-3xl font-bold text-indigo-400">{stats.avgTimeHours} <span className="text-base font-normal">hrs</span></span>
                    </div>
                    <div className="card p-6 border border-red-500/30 bg-red-500/5">
                        <span className="text-sm font-medium text-red-400 block mb-1">High Priority Open</span>
                        <span className="text-3xl font-bold text-red-500">{stats.urgent}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    {/* Complaints By Category */}
                    <div className="card p-6 border border-gray-700 bg-gray-800/40 h-[400px]">
                        <h2 className="text-lg font-semibold mb-6">Complaints by Category</h2>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} angle={-30} textAnchor="end" />
                                <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                                <RechartsTooltip cursor={{fill: '#374151'}} contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff'}} />
                                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pending vs Resolved Pie Chart */}
                    <div className="card p-6 border border-gray-700 bg-gray-800/40 h-[400px]">
                        <h2 className="text-lg font-semibold mb-6">Status Overview</h2>
                        <ResponsiveContainer width="100%" height="85%">
                            <PieChart>
                                <Pie 
                                    data={statusData} 
                                    cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} 
                                    dataKey="value"
                                >
                                    <Cell fill="#10b981" /> {/* Resolved - Green */}
                                    <Cell fill="#f59e0b" /> {/* Pending - Yellow */}
                                </Pie>
                                <RechartsTooltip contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff'}} />
                                <Legend wrapperStyle={{ color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    {/* Peak Timings */}
                    <div className="card p-6 border border-gray-700 bg-gray-800/40 h-[400px]">
                        <h2 className="text-lg font-semibold mb-6">Peak Submission Times (24h)</h2>
                        <ResponsiveContainer width="100%" height="85%">
                            <LineChart data={timeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} minTickGap={30} />
                                <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                                <RechartsTooltip contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff'}} />
                                <Line type="monotone" dataKey="complaints" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Complaints per Hostel */}
                    <div className="card p-6 border border-gray-700 bg-gray-800/40 h-[400px]">
                        <h2 className="text-lg font-semibold mb-6">Complaints By Hostel Area</h2>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={hostelData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                                <XAxis type="number" stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                                <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} />
                                <RechartsTooltip cursor={{fill: '#374151'}} contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff'}} />
                                <Bar dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </main>
        </div>
    );
}
