import { useState, useEffect } from 'react'

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
const LAT = 40.7128
const LON = -74.006
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

// Module-level cache shared between Weather and ChaosWave
let cache = null
let cacheTime = 0
let inflightPromise = null

function iconEmoji(code) {
  if (!code) return '🌡️'
  const id = code.slice(0, 2)
  const map = {
    '01': '☀️',
    '02': '⛅',
    '03': '🌥️',
    '04': '☁️',
    '09': '🌧️',
    '10': '🌦️',
    '11': '⛈️',
    '13': '❄️',
    '50': '🌫️',
  }
  return map[id] || '🌡️'
}

async function fetchWeatherData() {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL) return cache
  if (inflightPromise) return inflightPromise

  const promise = (async () => {
    try {
      const [curRes, fcRes] = await Promise.all([
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=imperial`
        ),
        fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=imperial`
        ),
      ])

      if (!curRes.ok) throw new Error(`Weather API error: ${curRes.status}`)
      if (!fcRes.ok) throw new Error(`Forecast API error: ${fcRes.status}`)

      const cur = await curRes.json()
      const fc = await fcRes.json()

      const current = {
        temp: Math.round(cur.main.temp),
        condition: cur.weather[0].description,
        high: Math.round(cur.main.temp_max),
        low: Math.round(cur.main.temp_min),
        humidity: cur.main.humidity,
      }

      const today = new Date().toDateString()
      const days = {}
      fc.list.forEach((item) => {
        const date = new Date(item.dt * 1000)
        if (date.toDateString() === today) return
        const key = date.toLocaleDateString('en-US', { weekday: 'short' })
        if (!days[key]) {
          days[key] = { high: -Infinity, low: Infinity, icon: item.weather[0].icon }
        }
        if (item.main.temp_max > days[key].high) days[key].high = Math.round(item.main.temp_max)
        if (item.main.temp_min < days[key].low) days[key].low = Math.round(item.main.temp_min)
      })

      const forecast = Object.entries(days)
        .slice(0, 3)
        .map(([day, d]) => ({ day, high: d.high, low: d.low, icon: iconEmoji(d.icon) }))

      cache = { current, forecast }
      cacheTime = Date.now()
      return cache
    } finally {
      inflightPromise = null
    }
  })()
  inflightPromise = promise

  return inflightPromise
}

export function useWeather() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchWeatherData()
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch((e) => {
        setError(e)
        setLoading(false)
      })

    const id = setInterval(() => {
      fetchWeatherData()
        .then((d) => setData(d))
        .catch(() => {})
    }, CACHE_TTL)

    return () => clearInterval(id)
  }, [])

  return { data, loading, error }
}
