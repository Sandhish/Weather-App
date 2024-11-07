import { useState, useEffect } from 'react';
import axios from 'axios';
import { WeatherCard } from './WeatherCard';
import { ForecastCard } from './Forecast';
import styles from '../Pages/Styles.module.css';
import { ErrorPage } from './ErrorPage';
import { FaSearch } from 'react-icons/fa';
import { Link } from "react-router-dom";
import { BsFillInfoCircleFill } from "react-icons/bs";

const Home = () => {
    const [location, setLocation] = useState('');
    const [weatherData, setWeatherData] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);

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

    const handleCloseModal = () => setError(false);

    const handleInfo = () => setShowInfoModal(!showInfoModal);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((position) => {
            const loc = `${position.coords.latitude},${position.coords.longitude}`;
            fetchWeather(loc);
        });
    }, []);

    return (
        <div className={styles.Main}>
            <img src="/R.jpeg" alt="background" className={styles.backgroundImage} />
            {!loading && <h1 className={styles.heading}>Weather App</h1>}
            <form onSubmit={handleSearch} className={styles.form}>
                <div className={styles.inputContainer}>
                    <FaSearch className={styles.searchIcon} onClick={handleSearch} />
                    <input type="text" className={styles.inputBox} placeholder="Enter location"
                        value={location} onChange={(e) => setLocation(e.target.value)}
                    />
                    <BsFillInfoCircleFill className={styles.infoIcon} onClick={handleInfo} />
                </div>
                <Link to="/login" className={styles.loginBtn}>Login</Link>
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

            {showInfoModal && (
                <div className={styles.infoModal}>
                    <div className={styles.infoModalContent}>
                        <span className={styles.closeButton} onClick={handleInfo}>&times;</span>
                        <p className={styles.infoContent}>
                            <h2>Welcome to the Weather App!</h2>
                            <p>
                                With this app, you can easily check the current weather and forecast for any location. To access advanced features, consider logging in.
                            </p>
                            <p>
                                As a registered user, you can:
                            </p>
                            <ul>
                                <li><strong>Save Favorite Locations:</strong> Store multiple favorite locations for quick access to their weather details.</li>
                                <li><strong>Set Weather Alerts:</strong> Define custom minimum and maximum temperature thresholds for each saved location.</li>
                                <li><strong>Email Notifications:</strong> The app will monitor your saved locations every 5 hours. If the weather in any location goes above or below your set threshold, an email alert will be sent to notify you.</li>
                            </ul>
                            <p>
                                To start using these features, please <Link to="/login" className={styles.infoLogin}>Log in</Link> or create an account. Enjoy a personalized weather experience!
                            </p>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export { Home };
