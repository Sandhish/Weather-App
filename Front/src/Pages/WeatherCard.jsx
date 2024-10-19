import styles from '../Pages/Styles.module.css';

const WeatherCard = ({ data }) => {
    return (
        <div className={styles.weatherCard}>
            <h2 className={styles.locName}> {data.location.name}</h2>
            <p className={styles.temp}>Temperature: {data.current.temp_c}°C</p>
            <p className={styles.humdity}>Humidity: {data.current.humidity}%</p>
            <p className={styles.windSpeed}>Wind Speed: {data.current.wind_kph} km/h</p>
            <img className={styles.weatherIcon} src={data.current.condition.icon} alt={data.current.condition.text} />
            <p className={styles.condition}>{data.current.condition.text}</p>
        </div >
    );
};

export { WeatherCard };