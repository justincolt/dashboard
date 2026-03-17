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

export const mtaSchedule = [
  {
    line: '1',
    color: '#EE352E',
    destination: 'South Ferry',
    arrivals: [2, 8, 15],
  },
  {
    line: 'A',
    color: '#2850AD',
    destination: 'Far Rockaway',
    arrivals: [4, 12, 20],
  },
  {
    line: 'L',
    color: '#A7A9AC',
    destination: 'Canarsie',
    arrivals: [1, 6, 11],
  },
]

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
