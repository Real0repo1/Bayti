import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Home from './pages/Home';
import Search from './pages/Search';
import Listing from './pages/Listing';
import Favorites from './pages/Favorites';
import BecomeHost from './pages/BecomeHost';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import './index.css';

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/listing/:id" element={<Listing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route 
          path="/favorites" 
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/become-a-host" 
          element={
            <ProtectedRoute>
              <BecomeHost />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
