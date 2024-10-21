import { useState } from 'react';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from '../../firebaseClient';
import { useAuth } from '../Auth/AuthContext';
import styles from './RegisterLogin.module.css';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const { setCurrentUser } = useAuth();
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            setCurrentUser(userCredential.user); 
            console.log("Registered user:", userCredential.user);
            navigate('/user'); 
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className={styles.registerContainer}>
            <p className={styles.registerHeader}>Register</p>
            <form onSubmit={handleRegister} className={styles.registerForm}>
                <input type="text" placeholder="Name" value={name} className={styles.inputField}
                    onChange={(e) => setName(e.target.value)} required />
                <input type="email" placeholder="Email" value={email} className={styles.inputField}
                    onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} className={styles.inputField}
                    onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" className={styles.registerBtn}>Register</button>
            </form>
            <p className={styles.account}>Already have an account? <a href="/login">Login</a></p>
            {error && <p className={styles.errMsg}>{error}</p>}
        </div>
    );
};

export default Register;
