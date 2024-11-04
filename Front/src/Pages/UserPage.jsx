import { useState, useEffect } from 'react';
import axios from 'axios';
import { WeatherCard } from './WeatherCard';
import { ForecastCard } from './Forecast';
import styles from '../Pages/Styles.module.css';
import { ErrorPage } from './ErrorPage';
import { FaSearch, FaTimes, FaPlus } from 'react-icons/fa';
import { MdAccountCircle } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './Auth/AuthContext';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
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
    const [favoriteLocations, setFavoriteLocations] = useState([]);
    const [newFavorite, setNewFavorite] = useState('');
    const [showFavoriteInput, setShowFavoriteInput] = useState(false);
    const [minThreshold, setMinThreshold] = useState('');
    const [maxThreshold, setMaxThreshold] = useState('');
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const firestore = getFirestore();

    const apiKey = import.meta.env.VITE_API_KEY;

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

    const getFormattedDate = (daysOffset) => {
        const date = new Date();
        date.setDate(date.getDate() + daysOffset);
        return date.toISOString().split('T')[0];
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (location) {
            fetchWeather(location);
        }
    };

    const handlePanel = () => setPanelOpen(!panelOpen);
    const handleCloseModal = () => setError(false);
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

    const fetchFavoriteLocations = async () => {
        if (!currentUser) return;

        try {
            const userDoc = doc(firestore, 'WeatherApi', currentUser.uid);
            const docSnapshot = await getDoc(userDoc);
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                setFavoriteLocations(userData.favoriteLocations || []);
            }
        } catch (error) {
            console.error("Error fetching favorite locations:", error);
        }
    };

    const handleAddFavoriteField = () => {
        setShowFavoriteInput((prev) => !prev);
        setNewFavorite('');
        setMinThreshold('');
        setMaxThreshold('');
    };

    const handleSaveFavoriteLocation = async () => {
        if (!newFavorite.trim() || !currentUser) return;

        if (favoriteLocations.some(fav => fav.location === newFavorite)) {
            toast.error("Location already in favorites.");
            return;
        }

        const userDoc = doc(firestore, 'WeatherApi', currentUser.uid);

        try {
            const docSnapshot = await getDoc(userDoc);
            const existingFavorites = docSnapshot.exists() ? docSnapshot.data().favoriteLocations || [] : [];

            const updatedFavorites = [
                ...existingFavorites,
                { location: newFavorite, minThreshold: Number(minThreshold), maxThreshold: Number(maxThreshold) }
            ];
            await setDoc(userDoc, { favoriteLocations: updatedFavorites }, { merge: true });

            setFavoriteLocations(updatedFavorites);
            setNewFavorite('');
            setMinThreshold('');
            setMaxThreshold('');
            setShowFavoriteInput(false);

            toast.success("Favorite location saved successfully.");
            await fetchWeather(newFavorite);
        } catch (error) {
            console.error("Error saving favorite location:", error);
            toast.error("Failed to save favorite location. Please try again.");
        }
    };

    const handleDeleteFavoriteLocation = async (locationToDelete) => {
        const updatedFavorites = favoriteLocations.filter(fav => fav.location !== locationToDelete);
        const userDoc = doc(firestore, 'WeatherApi', currentUser.uid);

        try {
            await setDoc(userDoc, { favoriteLocations: updatedFavorites });
            setFavoriteLocations(updatedFavorites);
            toast.success("Favorite location deleted successfully.");
        } catch (error) {
            console.error("Error deleting favorite location:", error);
            toast.error("Error deleting favorite location. Please try again.");
        }
    };

    const handleShowForecastDetails = (loc) => fetchWeather(loc);

    useEffect(() => {
        if (currentUser) {
            fetchFavoriteLocations();
            handleCurrentLocation();
        }
    }, [currentUser]);

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
                        <div></div><div></div><div></div><div></div>
                    </div>
                </div>
            )}

            {error && <ErrorPage show={error} onClose={handleCloseModal} />}

            {!loading && !error && weatherData && (
                <>
                    <WeatherCard data={weatherData} />
                    <div className={styles.forecastContainer}>
                        {historyData.map((day, index) => <ForecastCard key={index} data={day} />)}
                        {forecastData.slice(0, 3).map((day, index) => <ForecastCard key={index} data={day} />)}
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
                    <button className={styles.userPageButton} onClick={handleCurrentLocation}>Current Location</button>

                    <div className={styles.favoriteLocationSection}>
                        <p className={styles.favLocDesc}>Your Favorite Locations:</p>
                        {favoriteLocations.map((fav, index) => (
                            <div key={index} className={styles.favoriteLocationItem}>
                                <button onClick={() => handleShowForecastDetails(fav.location)}>
                                    {fav.location} (Min: {fav.minThreshold}°C, Max: {fav.maxThreshold}°C)
                                </button>
                                <button onClick={() => handleDeleteFavoriteLocation(fav.location)}>Delete</button>
                            </div>
                        ))}

                        {showFavoriteInput && (
                            <div className={styles.newFavoriteContainer}>
                                <input type="text" className={styles.favInputBox} placeholder="Enter favorite location"
                                    value={newFavorite} onChange={(e) => setNewFavorite(e.target.value)}
                                />
                                <input type="number" className={styles.favInputBox} placeholder="Min Threshold"
                                    value={minThreshold} onChange={(e) => setMinThreshold(e.target.value)}
                                />
                                <input type="number" className={styles.favInputBox} placeholder="Max Threshold"
                                    value={maxThreshold} onChange={(e) => setMaxThreshold(e.target.value)}
                                />
                                <button className={styles.userPageButton} onClick={handleSaveFavoriteLocation}>
                                    Save Favorite Location
                                </button>
                            </div>
                        )}

                        <button className={styles.favAddButton} onClick={handleAddFavoriteField}>
                            <FaPlus className={styles.plusIcon} /> Add Favorite Location
                        </button>
                    </div>

                    <button className={styles.logoutButton} onClick={handleLogout}>
                        <TbLogout className={styles.logoutIcon} /> Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export  {UserPage};
