export const meetings = [
  {
    id: 1,
    title: 'Daily Standup',
    time: '9:00 AM',
    endTime: '9:15 AM',
    type: 'video',
    link: '#',
  },
  {
    id: 2,
    title: 'Design Review',
    time: '11:00 AM',
    endTime: '12:00 PM',
    type: 'video',
    link: '#',
  },
  {
    id: 3,
    title: 'Lunch with Sarah',
    time: '12:30 PM',
    endTime: '1:30 PM',
    type: 'in-person',
  },
  {
    id: 4,
    title: 'Sprint Planning',
    time: '3:00 PM',
    endTime: '4:00 PM',
    type: 'video',
    link: '#',
  },
]

export const weather = {
  location: 'New York, NY',
  current: {
    temp: 62,
    condition: 'Partly Cloudy',
    icon: '⛅',
    high: 68,
    low: 54,
    humidity: 45,
    wind: '12 mph',
  },
  forecast: [
    { day: 'Tue', high: 65, low: 52, icon: '🌤️' },
    { day: 'Wed', high: 58, low: 48, icon: '🌧️' },
    { day: 'Thu', high: 70, low: 55, icon: '☀️' },
  ],
}

export const trainSchedule = (() => {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()

  // Metro-North New Haven Line: Grand Central → Fairfield CT
  // Generate next 3 plausible departures based on current time
  // Trains run roughly every 30-60 min, trip ~75-90 min
  const baseMins = [7, 37, 52, 17, 47, 22] // repeating departure minutes
  const departures = []
  for (let offset = 0; offset < 4 && departures.length < 3; offset++) {
    for (const bm of baseMins) {
      const depH = h + offset
      if (depH >= 24) break
      if (offset === 0 && bm <= m) continue
      const depTime = `${depH > 12 ? depH - 12 : depH || 12}:${String(bm).padStart(2, '0')} ${depH >= 12 ? 'PM' : 'AM'}`
      const dur = 75 + Math.floor(Math.random() * 15)
      const arrH = depH + Math.floor((bm + dur) / 60)
      const arrM = (bm + dur) % 60
      const arrTime = `${arrH > 12 ? arrH - 12 : arrH || 12}:${String(arrM).padStart(2, '0')} ${arrH >= 12 ? 'PM' : 'AM'}`
      const minsAway = (depH - h) * 60 + (bm - m)
      const type = dur <= 78 ? 'Express' : 'Local'
      departures.push({ depTime, arrTime, minsAway, duration: `${dur} min`, type })
      if (departures.length >= 3) break
    }
  }

  return {
    line: 'Metro-North',
    route: 'New Haven Line',
    from: 'Grand Central',
    to: 'Fairfield, CT',
    color: '#00843D',
    departures,
  }
})()

export const nowPlaying = {
  track: 'Midnight City',
  artist: 'M83',
  album: 'Hurry Up, We\'re Dreaming',
  progress: 65,
  duration: '4:03',
  elapsed: '2:37',
  isPlaying: true,
}

export const countdown = {
  event: 'Summer Vacation',
  date: '2026-07-04T00:00:00',
}
