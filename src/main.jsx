import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from '@/Layout.jsx'
import Dashboard from '@/pages/Dashboard.jsx'
import Contests from '@/pages/Contests.jsx'
import Feed from '@/pages/Feed.jsx'
import Search from '@/pages/Search.jsx'
import Profile from '@/pages/Profile.jsx'
import Winners from '@/pages/Winners'
import UserProfile from '@/pages/UserProfile'
import AboutUs from '@/pages/AboutUs'
import CreateContest from './pages/CreateContest.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

function App() {
  console.log('App component rendering...');
  
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/contests" element={<Contests />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/winners" element={<Winners />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/:userId" element={<UserProfile />} />
                  <Route path="/about" element={<AboutUs />} />
                  <Route path="/create-contest" element={<AdminRoute><CreateContest /></AdminRoute>} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

// Add error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
            <p className="text-slate-300 mb-4">Check the console for details</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
