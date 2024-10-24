import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Home } from './Pages/home';
import Login from './Pages/RegisterLogin/Login';
import Register from './Pages/RegisterLogin/Register';
import { UserPage } from './Pages/UserPage';
import { AuthProvider } from './Pages/Auth/AuthContext';
import ProtectedRoute from './Pages/Auth/ProtectRoute';
import { Toaster } from 'react-hot-toast';

function App() {
    return (
        <AuthProvider>
            <Toaster position="top-center" reverseOrder={false}
                toastOptions={{
                    duration: 4500,
                }}
            />
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/user" element={
                        <ProtectedRoute>
                            <UserPage />
                        </ProtectedRoute>
                    } />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
