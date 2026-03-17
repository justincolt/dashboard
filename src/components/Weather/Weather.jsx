import styles from './Weather.module.css'
import { weather } from '../../data/mockData'

export default function Weather() {
  const { current, forecast } = weather

  return (
    <div className={styles.weather}>
      <div className={styles.label}>Weather</div>
      <div className={styles.current}>
        <span className={styles.temp}>{current.temp}°</span>
        <span className={styles.condition}>{current.condition}</span>
      </div>
      <div className={styles.details}>
        <span>H {current.high}°</span>
        <span>L {current.low}°</span>
        <span>{current.humidity}% hum</span>
      </div>
      <div className={styles.forecast}>
        {forecast.map((day) => (
          <div key={day.day} className={styles.forecastDay}>
            <span className={styles.dayName}>{day.day}</span>
            <span className={styles.dayIcon}>{day.icon}</span>
            <span className={styles.dayTemps}>{day.high}/{day.low}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
