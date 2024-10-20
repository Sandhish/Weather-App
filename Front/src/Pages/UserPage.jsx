import { useState, useEffect } from 'react';
import axios from 'axios';
import { WeatherCard } from './WeatherCard';
import { ForecastCard } from './Forecast';
import styles from '../Pages/Styles.module.css';
import { ErrorPage } from './ErrorPage';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { MdAccountCircle } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './Auth/AuthContext';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { TbLogout } from "react-icons/tb";

const UserPage = () => {
    const [location, setLocation] = useState('');
    const [weatherData, setWeatherData] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [favoriteLocation, setFavoriteLocation] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [showFavoriteDetails, setShowFavoriteDetails] = useState(false);
    const [showForecastDetails, setShowForecastDetails] = useState(false);
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const firestore = getFirestore();

    const apiKey = import.meta.env.VITE_API_KEY;

    const getFormattedDate = (daysOffset) => {
        const date = new Date();
        date.setDate(date.getDate() + daysOffset);
        return date.toISOString().split('T')[0];
    };

    const fetchWeather = async (loc) => {
        setLoading(true);
        setError(false);

        try {
            const currentWeather = await axios.get(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${loc}`);
            const forecast = await axios.get(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${loc}&days=3`);
            setWeatherData(currentWeather.data);
            setForecastData(forecast.data.forecast.forecastday);

            const yesterday = getFormattedDate(-1);
            const dayBeforeYesterday = getFormattedDate(-2);

            const historyDay1 = await axios.get(`https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${loc}&dt=${yesterday}`);
            const historyDay2 = await axios.get(`https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${loc}&dt=${dayBeforeYesterday}`);

            setHistoryData([historyDay2.data.forecast.forecastday[0], historyDay1.data.forecast.forecastday[0]]);
            setLocation('');

            const userEmail = currentUser.email;
            const condition = currentWeather.data.current.condition.text;
            const temperature = currentWeather.data.current.temp_c;

            if (temperature >= 30 || temperature < 11 || condition.includes('Storm') || condition.includes('Heavy Rain')) {
                await axios.post('http://localhost:5000/send-email', {
                    userEmail,
                    weatherCondition: condition,
                    location: favoriteLocation,
                });
                toast.success('Weather alert sent to your email!');
            }

        } catch (error) {
            console.error('Error fetching weather data:', error);
            if (error.response && error.response.status === 400) {
                setError(true);
            }
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 1500);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (location) {
            fetchWeather(location);
        }
    };

    const handlePanel = () => {
        setPanelOpen(!panelOpen);
    };

    const handleCloseModal = () => {
        setError(false);
        setShowModal(false);
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/");
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const handleCurrentLocation = () => {
        navigator.geolocation.getCurrentPosition((position) => {
            const loc = `${position.coords.latitude},${position.coords.longitude}`;
            fetchWeather(loc);
            setPanelOpen(false);
        });
    };

    const fetchFavoriteLocation = async () => {
        try {
            const userDoc = doc(firestore, 'WeatherApi', currentUser.uid);
            const docSnapshot = await getDoc(userDoc);
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                setFavoriteLocation(userData.favoriteLocation || '');
            }
        } catch (error) {
            console.error("Error fetching favorite location:", error);
            setFavoriteLocation('');
        }
    };

    const validateLocation = async (loc) => {
        try {
            await axios.get(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${loc}`);
            return true;
        } catch {
            return false;
        }
    };

    const saveFavoriteLocation = async (loc) => {
        const userDoc = doc(firestore, 'WeatherApi', currentUser.uid);
        await setDoc(userDoc, { favoriteLocation: loc });
        toast.success("Favorite location saved successfully.");
        setShowFavoriteDetails(true);
    };

    const deleteFavoriteLocation = async () => {
        const userDoc = doc(firestore, 'WeatherApi', currentUser.uid);
        try {
            await deleteDoc(userDoc);
            resetAfterDelete();
            toast.success("Favorite location deleted successfully.");
            handleCurrentLocation();
        } catch (error) {
            toast.error("Error deleting favorite location. Please try again.");
            console.error("Error deleting favorite location:", error);
        }
    };

    const resetAfterDelete = () => {
        setFavoriteLocation('');
        setLocation('');
        setShowFavoriteDetails(false);
        setShowForecastDetails(false);
    };

    const handleSaveFavoriteLocation = async () => {
        if (location.trim()) {
            const isValidLocation = await validateLocation(location);
            if (isValidLocation) {
                try {
                    await saveFavoriteLocation(location);
                    setFavoriteLocation(location);
                    setLocation('');
                    setShowFavoriteDetails(true);
                    fetchWeather(location);
                } catch (error) {
                    console.error("Error saving favorite location:", error);
                    toast.error("Failed to save favorite location. Please try again.");
                }
            } else {
                setError(true);
            }
        }
    };

    const handleShowForecastDetails = async () => {
        if (favoriteLocation) {
            const isValidLocation = await validateLocation(favoriteLocation);
            if (isValidLocation) {
                fetchWeather(favoriteLocation);
                setShowForecastDetails(true);
                setPanelOpen(false);
            } else {
                setError(true);
            }
        }
    };

    useEffect(() => {
        handleCurrentLocation();
        fetchFavoriteLocation();
    }, []);

    return (
        <div className={styles.Main}>
            <Toaster position="top-center" reverseOrder={false} />
            <img src="/R.jpeg" alt="background" className={styles.backgroundImage} />
            {!loading && <h1 className={styles.heading}>Weather App</h1>}

            <form onSubmit={handleSearch} className={styles.form}>
                <div className={styles.inputContainer}>
                    <FaSearch className={styles.searchIcon} onClick={handleSearch} />
                    <input type="text" className={styles.inputBox} placeholder="Enter location"
                        value={location} onChange={(e) => setLocation(e.target.value)}
                    />
                    <MdAccountCircle className={styles.accIcon} onClick={handlePanel} />
                </div>
            </form>

            {loading && (
                <div className={styles.spinnerOverlay}>
                    <div className={styles.loader}>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                </div>
            )}

            {!loading && error && (
                <ErrorPage show={error} onClose={handleCloseModal} />
            )}

            {!loading && !error && weatherData && (
                <>
                    <WeatherCard data={weatherData} />
                    <div className={styles.forecastContainer}>
                        {historyData && historyData.map((day, index) => (
                            <ForecastCard key={index} data={day} />
                        ))}
                        {forecastData && forecastData.slice(0, 3).map((day, index) => (
                            <ForecastCard key={index} data={day} />
                        ))}
                    </div>
                </>
            )}

            {currentUser && (
                <div className={`${styles.panel} ${panelOpen ? styles.panelOpen : ''}`}>
                    <p className={styles.accHeader}>Account Info</p>
                    <FaTimes className={styles.closeIcon} onClick={handlePanel} />
                    <div className={styles.accInfoContainer}>
                        <MdAccountCircle className={styles.accIconCenter} />
                        <p className={styles.accName}><strong>Email:</strong> {currentUser.email}</p>
                    </div>
                    <div className={styles.accInfo}>
                        <button className={styles.userPageButton} onClick={handleCurrentLocation}>Current Location</button>
                    </div>

                    <div className={styles.favoriteLocationSection}>
                        {favoriteLocation ? (
                            <>
                                <button className={styles.userPageButton} onClick={handleShowForecastDetails}>Favorite Location</button>
                                <button className={styles.userPageButton} onClick={deleteFavoriteLocation}>Delete Favorite Location</button>
                            </>
                        ) : (
                            <>
                                <input type="text" className={styles.favInputBox} placeholder="Enter favorite location"
                                    value={location} onChange={(e) => setLocation(e.target.value)}
                                />
                                <button className={styles.userPageButton} onClick={handleSaveFavoriteLocation}>Save Favorite Location</button>
                            </>
                        )}
                    </div>
                    <div className={styles.accInfo}>
                        <button className={styles.logoutButton} onClick={handleLogout}>Logout<TbLogout className={styles.logoutIcon} /></button>
                    </div>
                </div>
            )}

            {showModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>{modalMessage}</h3>
                        <button onClick={handleCloseModal}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export { UserPage };
