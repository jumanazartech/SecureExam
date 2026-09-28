import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import Login from './pages/Login';
import TeacherLogin from './pages/TeacherLogin';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ExamEditor from './pages/ExamEditor';
import StudentDashboard from './pages/StudentDashboard';
import ExamRunner from './pages/ExamRunner';
import StudentProfile from './pages/StudentProfile';
import TeacherDashboard from './pages/TeacherDashboard';

// Admin Pages
import AdminExams from './pages/admin/AdminExams';
import AdminClasses from './pages/admin/AdminClasses';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminStudents from './pages/admin/AdminStudents';
import AdminApplications from './pages/admin/AdminApplications';
import AdminResults from './pages/admin/AdminResults';

// Teacher Pages
import TeacherExams from './pages/teacher/TeacherExams';
import TeacherClasses from './pages/teacher/TeacherClasses';
import TeacherApplications from './pages/teacher/TeacherApplications';
import TeacherMyStudents from './pages/teacher/TeacherMyStudents';

// Student Pages
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import AuthCallback from './pages/AuthCallback';
import Pricing from './pages/Pricing';
import ShareCard from './pages/ShareCard';
import TeacherAccount from './pages/teacher/TeacherAccount';
import AdminVerifications from './pages/admin/AdminVerifications';
import UpgradeModal from './components/UpgradeModal';
import Landing from './pages/Landing';
import TeacherAttestation from './pages/teacher/TeacherAttestation';
import StudentExams from './pages/student/StudentExams';
import StudentResults from './pages/student/StudentResults';
import StudentApplications from './pages/student/StudentApplications';

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user || user.role !== 'admin') return <AdminLogin />;
    return children;
};

const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) {
        if (role === 'teacher' || role === 'admin') return <Navigate to="/teacher/login" />;
        return <Navigate to="/login" />;
    }
    if (role && user.role !== role) return <Navigate to="/" />;
    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/r/:token" element={<ShareCard />} />
            <Route path="/teacher/login" element={<TeacherLogin />} />

            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>}>
                <Route index element={<Navigate to="/admin/exams" replace />} />
                <Route path="exams" element={<AdminExams />} />
                <Route path="classes" element={<AdminClasses />} />
                <Route path="teachers" element={<AdminTeachers />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="applications" element={<AdminApplications />} />
                <Route path="verifications" element={<AdminVerifications />} />
                <Route path="results/:id" element={<AdminResults />} />
            </Route>

            <Route path="/admin/create-exam" element={
                <AdminRoute><ExamEditor /></AdminRoute>
            } />
            <Route path="/admin/edit-exam/:id" element={
                <AdminRoute><ExamEditor /></AdminRoute>
            } />

            <Route path="/student" element={
                <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
            }>
                <Route index element={<Navigate to="/student/exams" replace />} />
                <Route path="exams" element={<StudentExams />} />
                <Route path="results" element={<StudentResults />} />
                <Route path="applications" element={<StudentApplications />} />
            </Route>

            <Route path="/student/profile" element={
                <ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>
            } />
            <Route path="/student/exam/:id" element={
                <ProtectedRoute role="student"><ExamRunner /></ProtectedRoute>
            } />

            <Route path="/teacher" element={
                <ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>
            }>
                <Route index element={<Navigate to="/teacher/exams" replace />} />
                <Route path="exams" element={<TeacherExams />} />
                <Route path="classes" element={<TeacherClasses />} />
                <Route path="mystudent" element={<TeacherMyStudents />} />
                <Route path="attestation" element={<TeacherAttestation />} />
                <Route path="account" element={<TeacherAccount />} />
                <Route path="applications" element={<TeacherApplications />} />
            </Route>
            <Route path="/teacher/exam/:id" element={
                <ProtectedRoute role="teacher"><ExamRunner /></ProtectedRoute>
            } />

            <Route path="/teacher/create-exam" element={
                <ProtectedRoute role="teacher"><ExamEditor /></ProtectedRoute>
            } />
            <Route path="/teacher/edit-exam/:id" element={
                <ProtectedRoute role="teacher"><ExamEditor /></ProtectedRoute>
            } />

            <Route path="/" element={<Landing />} />
        </Routes>
    );
};

function App() {
    return (
        <Router>
            <AlertProvider>
                <AuthProvider>
                    <AppRoutes />
                    <UpgradeModal />
                </AuthProvider>
            </AlertProvider>
        </Router>
    )
}

export default App;
