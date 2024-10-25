import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !currentUser) {
            navigate('/login');
        }
    }, [currentUser, loading, navigate]);

    if (loading) return null;

    return currentUser ? children : null;
};

export default ProtectedRoute;
