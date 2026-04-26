import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-200">
            {/* Navbar */}
            <nav className="top-navbar">
                <div className="sidebar-logo" style={{ marginBottom: 0, color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    HostelCare
                </div>
                <div className="nav-links flex gap-4">
                    <Link to="/login" className="btn btn-secondary">Log In</Link>
                    <Link to="/signup" className="btn btn-primary">Sign Up</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex flex-col items-center justify-center text-center px-6 py-24">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white max-w-4xl leading-tight">
                        Hostel Complaint Management System
                    </h1>
                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                        A seamless, fast, and transparent way to report, track, and resolve hostel lifecycle issues in real-time.
                    </p>
                    
                    <div className="flex gap-4 justify-center">
                        <Link to="/signup" className="btn btn-primary px-8 py-4 text-lg rounded-full shadow-lg hover:-translate-y-1 transition">
                            Get Started
                        </Link>
                        <Link to="/login" className="btn btn-secondary px-8 py-4 text-lg rounded-full hover:-translate-y-1 transition">
                            Staff Login
                        </Link>
                    </div>
                </motion.div>

                {/* Features Section */}
                <div className="mt-32 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                        className="p-8 bg-gray-800/40 rounded-2xl border border-gray-700 backdrop-blur-sm shadow-xl"
                    >
                        <div className="text-3xl mb-4 bg-indigo-500/20 w-16 h-16 flex items-center justify-center rounded-xl text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">⚡</div>
                        <h3 className="text-xl font-bold text-white mb-2">Real-Time Tracking</h3>
                        <p className="text-gray-400">Watch the live status of your complaints change instantly as staff acts on it.</p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                        className="p-8 bg-gray-800/40 rounded-2xl border border-gray-700 backdrop-blur-sm shadow-xl"
                    >
                        <div className="text-3xl mb-4 bg-red-500/20 w-16 h-16 flex items-center justify-center rounded-xl text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">⏱️</div>
                        <h3 className="text-xl font-bold text-white mb-2">SLA & Escalation</h3>
                        <p className="text-gray-400">Strict deadline enforcement automatically escalates overdue tickets to management.</p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
                        className="p-8 bg-gray-800/40 rounded-2xl border border-gray-700 backdrop-blur-sm shadow-xl"
                    >
                        <div className="text-3xl mb-4 bg-green-500/20 w-16 h-16 flex items-center justify-center rounded-xl text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]">📊</div>
                        <h3 className="text-xl font-bold text-white mb-2">Smart Analytics</h3>
                        <p className="text-gray-400">Dashboards that provide complete transparency into resolution rates, peaks, and hotspots.</p>
                    </motion.div>
                </div>

                {/* How it Works */}
                <div className="mt-32 max-w-5xl mx-auto w-full">
                    <h2 className="text-3xl font-bold text-white mb-12 text-center">How It Works</h2>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-700 -z-10 translate-y--1/2"></div>
                        
                        {[
                            { step: '1', title: 'Register', desc: 'Securely link your identity via Register Number.' },
                            { step: '2', title: 'Report', desc: 'Detail your issue and upload proof.' },
                            { step: '3', title: 'Resolve', desc: 'System auto-assigns the best staff member.' }
                        ].map((item, index) => (
                            <motion.div 
                                key={item.step}
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: index * 0.2 }}
                                className="bg-gray-800 p-8 rounded-full border-4 border-gray-900 shadow-2xl flex flex-col items-center justify-center w-64 h-64 text-center z-10"
                            >
                                <div className="text-indigo-400 font-black text-4xl mb-2">{item.step}</div>
                                <div className="text-white font-bold text-xl">{item.title}</div>
                                <div className="text-gray-400 text-sm mt-2">{item.desc}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-20 border-t border-gray-800 p-8 text-center text-gray-500 text-sm pb-12">
                <p>© 2026 HostelCare Systems. All rights reserved.</p>
            </footer>
        </div>
    );
}
