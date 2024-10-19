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

const UserPage = () => {
    const [location, setLocation] = useState('');
    const [weatherData, setWeatherData] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();

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

    const handlePanel = () => {
        setPanelOpen(!panelOpen);
    };

    const handleCloseModal = () => {
        setError(false);
    };

    const handleLogout = async () => {
        try {
            await logout();
            console.log("User logged out");
            navigate("/");
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((position) => {
            const loc = `${position.coords.latitude},${position.coords.longitude}`;
            fetchWeather(loc);
        });
    }, []);

    useEffect(() => {
        if (!currentUser) {
            navigate("/");
        }
    }, [currentUser, navigate]);

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
                        <p className={styles.accName}>{currentUser.email}</p>
                    </div>
                    <button className={styles.logoutButton} onClick={handleLogout}>Logout</button>
                </div>
            )}


        </div>
    );
};

export { UserPage };

// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import { WeatherCard } from './WeatherCard';
// import { ForecastCard } from './Forecast';
// import styles from '../Pages/Styles.module.css';
// import { ErrorPage } from './ErrorPage';
// import { FaSearch, FaTimes } from 'react-icons/fa';
// import { MdAccountCircle } from 'react-icons/md';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from './Auth/AuthContext';

// const UserPage = () => {
//     const [location, setLocation] = useState('');
//     const [weatherData, setWeatherData] = useState(null);
//     const [forecastData, setForecastData] = useState(null);
//     const [historyData, setHistoryData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState(false);
//     const [panelOpen, setPanelOpen] = useState(false);
//     const [favoriteLocations, setFavoriteLocations] = useState([]);
//     const navigate = useNavigate();
//     const { currentUser, logout } = useAuth();

//     const apiKey = import.meta.env.VITE_API_KEY;

//     const getFormattedDate = (daysOffset) => {
//         const date = new Date();
//         date.setDate(date.getDate() + daysOffset);
//         return date.toISOString().split('T')[0];
//     };

//     const fetchWeather = async (loc) => {
//         setLoading(true);
//         setError(false);

//         try {
//             const currentWeather = await axios.get(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${loc}`);
//             const forecast = await axios.get(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${loc}&days=3`);
//             setWeatherData(currentWeather.data);
//             setForecastData(forecast.data.forecast.forecastday);

//             const yesterday = getFormattedDate(-1);
//             const dayBeforeYesterday = getFormattedDate(-2);

//             const historyDay1 = await axios.get(`https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${loc}&dt=${yesterday}`);
//             const historyDay2 = await axios.get(`https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${loc}&dt=${dayBeforeYesterday}`);

//             setHistoryData([historyDay2.data.forecast.forecastday[0], historyDay1.data.forecast.forecastday[0]]);
//             setLocation('');
//         } catch (error) {
//             console.error('Error fetching weather data:', error);
//             if (error.response && error.response.status === 400) {
//                 setError(true);
//             }
//         } finally {
//             setTimeout(() => {
//                 setLoading(false);
//             }, 1500);
//         }
//     };

//     const handleSearch = (e) => {
//         e.preventDefault();
//         if (location) {
//             fetchWeather(location);
//         }
//     };

//     const handlePanel = () => {
//         setPanelOpen(!panelOpen);
//     };

//     const handleCloseModal = () => {
//         setError(false);
//     };

//     const handleLogout = async () => {
//         try {
//             await logout();
//             console.log("User logged out");
//             navigate("/");
//         } catch (error) {
//             console.error("Error logging out:", error);
//         }
//     };

//     const fetchCurrentLocationWeather = () => {
//         navigator.geolocation.getCurrentPosition((position) => {
//             const loc = `${position.coords.latitude},${position.coords.longitude}`;
//             fetchWeather(loc);
//         });
//     };

//     const handleFavoriteLocation = (loc) => {
//         fetchWeather(loc);
//     };

//     const addFavoriteLocation = (loc) => {
//         setFavoriteLocations([...favoriteLocations, loc]);
//     };

//     useEffect(() => {
//         fetchCurrentLocationWeather();
//     }, []);

//     useEffect(() => {
//         if (!currentUser) {
//             navigate("/");
//         }
//     }, [currentUser, navigate]);

//     return (
//         <div className={styles.Main}>
//             <img src="/R.jpeg" alt="background" className={styles.backgroundImage} />
//             {!loading && <h1 className={styles.heading}>Weather App</h1>}

//             <form onSubmit={handleSearch} className={styles.form}>
//                 <div className={styles.inputContainer}>
//                     <FaSearch className={styles.searchIcon} onClick={handleSearch} />
//                     <input type="text" className={styles.inputBox} placeholder="Enter location"
//                         value={location} onChange={(e) => setLocation(e.target.value)}
//                     />
//                     <MdAccountCircle className={styles.accIcon} onClick={handlePanel} />
//                 </div>
//             </form>

//             {loading && (
//                 <div className={styles.spinnerOverlay}>
//                     <div className={styles.loader}>
//                         <div></div>
//                         <div></div>
//                         <div></div>
//                         <div></div>
//                     </div>
//                 </div>
//             )}

//             {!loading && error && (
//                 <ErrorPage show={error} onClose={handleCloseModal} />
//             )}

//             {!loading && !error && weatherData && (
//                 <>
//                     <WeatherCard data={weatherData} />

//                     <div className={styles.forecastContainer}>
//                         {historyData && historyData.map((day, index) => (
//                             <ForecastCard key={index} data={day} />
//                         ))}
//                         {forecastData && forecastData.slice(0, 3).map((day, index) => (
//                             <ForecastCard key={index} data={day} />
//                         ))}
//                     </div>
//                 </>
//             )}

//             {currentUser && (
//                 <div className={`${styles.panel} ${panelOpen ? styles.panelOpen : ''}`}>
//                     <p className={styles.accHeader}>Account Info</p>
//                     <FaTimes className={styles.closeIcon} onClick={handlePanel} />
//                     <div className={styles.accInfoContainer}>
//                         <MdAccountCircle className={styles.accIconCenter} />
//                         <p className={styles.accName}>{currentUser.email}</p>
//                     </div>

//                     {/* Current Location Button */}
//                     <button className={styles.locationButton} onClick={fetchCurrentLocationWeather}>
//                         Current Location
//                     </button>

//                     {/* Favorite Locations Section */}
//                     <p className={styles.accHeader}>Favorite Locations</p>
//                     {favoriteLocations.map((loc, index) => (
//                         <button key={index} className={styles.locationButton} onClick={() => handleFavoriteLocation(loc)}>
//                             {loc}
//                         </button>
//                     ))}

//                     <button className={styles.logoutButton} onClick={handleLogout}>Logout</button>
//                 </div>
//             )}
//         </div>
//     );
// };

// export { UserPage };
