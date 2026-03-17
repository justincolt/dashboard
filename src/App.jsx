import styles from './App.module.css'
import Clock from './components/Clock/Clock'
import Meetings from './components/Meetings/Meetings'
import Weather from './components/Weather/Weather'
import MtaSchedule from './components/MtaSchedule/MtaSchedule'
import Pomodoro from './components/Pomodoro/Pomodoro'
import NowPlaying from './components/NowPlaying/NowPlaying'
import Countdown from './components/Countdown/Countdown'

function App() {
  return (
    <div className={styles.dashboard}>
      <div className={styles.grid}>
        <div className={`${styles.cell} ${styles.cellWide}`}>
          <Clock />
        </div>
        <div className={styles.cell}>
          <Weather />
        </div>
        <div className={styles.cell}>
          <Countdown />
        </div>

        <div className={`${styles.cell} ${styles.cellTall}`}>
          <Meetings />
        </div>
        <div className={styles.cell}>
          <MtaSchedule />
        </div>
        <div className={styles.cell}>
          <Pomodoro />
        </div>
        <div className={styles.cell}>
          <NowPlaying />
        </div>
      </div>
    </div>
  )
}

export default App
