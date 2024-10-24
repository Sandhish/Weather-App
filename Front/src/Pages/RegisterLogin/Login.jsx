import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from "firebase/auth";
import { useState } from 'react';
import { auth } from '../../firebaseClient';
import styles from './RegisterLogin.module.css';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../Auth/AuthContext';
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import toast, { Toaster } from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { setCurrentUser } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await setPersistence(auth, browserSessionPersistence);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            toast.success("LoggedIn successfully.");
            setCurrentUser(userCredential.user);
            navigate('/user');
            setError(null);
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                setError('Incorrect password. Please try again.');
            } else if (error.code === 'auth/user-not-found') {
                setError('No account found with this email.');
            } else {
                setError('Failed to log in. Please try again.');
            }
        }
    };

    const handleRegisterClick = () => {
        navigate('/register');
    };

    return (
        <div className={styles.loginContainer}>
            <p className={styles.loginHeader}>Login</p>
            <form onSubmit={handleLogin} className={styles.loginForm}>
                <input type="email" placeholder="Email" value={email} className={styles.loginInputField}
                    onChange={(e) => setEmail(e.target.value)} required
                />
                <div className={styles.passwordContainer}>
                    <input type={showPassword ? "text" : "password"} placeholder="Password" value={password}
                        className={styles.loginInputField} onChange={(e) => setPassword(e.target.value)} required
                    />
                    <span
                        className={styles.eyeIcon}
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <VscEyeClosed /> : <VscEye />}
                    </span>
                </div>
                <button type="submit" className={styles.loginButton}>Login</button>
            </form>
            <p className={styles.account}>Don't have an account? <span onClick={handleRegisterClick}>Register</span>
            </p>
            {error && <p className={styles.errMsg}>{error}</p>}
            <Toaster position="top-center" reverseOrder={false} />
        </div>
    );
};

export default Login;
