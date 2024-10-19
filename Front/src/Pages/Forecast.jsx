import styles from '../Pages/Styles.module.css';

const ForecastCard = ({ data }) => {
    return (
        <div className={styles.forecastCard}>
            <h3 className={styles.date}>{new Date(data.date).toLocaleDateString()}</h3>
            <p className={styles.maxTemp}>Max Temp: {data.day.maxtemp_c}°C</p>
            <p className={styles.minTemp}>Min Temp: {data.day.mintemp_c}°C</p>
            <img className={styles.weatherIcon} src={data.day.condition.icon} alt={data.day.condition.text} />
            <p className={styles.conditionText}>Condition: {data.day.condition.text}</p>
        </div>
    );
};

export { ForecastCard };
