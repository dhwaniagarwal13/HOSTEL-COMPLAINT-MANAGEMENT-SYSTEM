import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import StudentLogin from './pages/StudentLogin';
import StudentSignup from './pages/StudentSignup';
import StudentDashboard from './pages/StudentDashboard';
import ComplaintCreation from './pages/ComplaintCreation';
import ComplaintTracking from './pages/ComplaintTracking';
import ComplaintDetailsStudent from './pages/ComplaintDetailsStudent';
import StaffDashboard from './pages/StaffDashboard';
import ComplaintDetailsStaff from './pages/ComplaintDetailsStaff';
import AdminManagementPanel from './pages/AdminManagementPanel';
import AdminAnalyticsDashboard from './pages/AdminAnalyticsDashboard';
import Directory from './pages/Directory';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return <div style={{ color: 'white', padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        // Redirect to their own dashboard if they try to access a page they aren't allowed to
        if (profile.role === 'staff' || profile.role === 'supervisor' || profile.role === 'warden') return <Navigate to="/staff" replace />;
        if (profile.role === 'admin') return <Navigate to="/admin" replace />;
        return <Navigate to="/dashboard" replace />;
    }
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<StudentLogin />} />
          <Route path="/signup" element={<StudentSignup />} />
          
          {/* Student Routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute allowedRoles={['student']}><ComplaintCreation /></ProtectedRoute>} />
          <Route path="/tracking" element={<ProtectedRoute allowedRoles={['student']}><ComplaintTracking /></ProtectedRoute>} />
          <Route path="/details" element={<ProtectedRoute allowedRoles={['student']}><ComplaintDetailsStudent /></ProtectedRoute>} />
          
          {/* Staff Routes */}
          <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff', 'admin', 'supervisor', 'warden']}><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff-details" element={<ProtectedRoute allowedRoles={['staff', 'admin', 'supervisor', 'warden']}><ComplaintDetailsStaff /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminManagementPanel /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute allowedRoles={['admin', 'supervisor']}><AdminAnalyticsDashboard /></ProtectedRoute>} />
          
          {/* Shared / Directory */}
          <Route path="/directory" element={<ProtectedRoute><Directory /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
