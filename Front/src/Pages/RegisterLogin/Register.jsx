import { useState } from 'react';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from '../../firebaseClient';
import { useAuth } from '../Auth/AuthContext';
import styles from './RegisterLogin.module.css';
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import toast, { Toaster } from 'react-hot-toast';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const { setCurrentUser } = useAuth();
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            toast.success("Registered successfully.");
            setCurrentUser(userCredential.user);
            console.log("Registered user:", userCredential.user);
            navigate('/user');
        } catch (error) {
            setError(error.message);
        }
    };

    const handleRegisterClick = () => {
        navigate('/login');
    };

    return (
        <div className={styles.registerContainer}>
            <Toaster position="top-center" reverseOrder={false} />
            <p className={styles.registerHeader}>Register</p>
            <form onSubmit={handleRegister} className={styles.registerForm}>
                <input type="text" placeholder="Name" value={name} className={styles.registerInputField}
                    onChange={(e) => setName(e.target.value)} required />
                <input type="email" placeholder="Email" value={email} className={styles.registerInputField}
                    onChange={(e) => setEmail(e.target.value)} required />
                <div className={styles.passwordContainer}>
                    <input type={showPassword ? "text" : "password"} placeholder="Password" value={password}
                        className={styles.registerInputField} onChange={(e) => setPassword(e.target.value)} required
                    />
                    <span
                        className={styles.eyeIcon}
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <VscEyeClosed /> : <VscEye />}
                    </span>
                </div>
                <button type="submit" className={styles.registerBtn}>Register</button>
            </form>
            <p className={styles.account}>Already have an account? <span onClick={handleRegisterClick}>Login</span>
            </p>
            {error && <p className={styles.errMsg}>{error}</p>}
        </div>
    );
};

export default Register;
