import { useState, useEffect } from 'react'
import GtfsRealtimeBindings from 'gtfs-realtime-bindings'

const FEED_URL = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/mnr%2Fgtfs-mnr'
// Metro-North stop IDs: Grand Central Terminal = '1'
const GCT_STOP_ID = '1'
const CACHE_TTL = 60 * 1000 // refresh every minute

let cache = null
let cacheTime = 0
let inflightPromise = null

function toNum(val) {
  if (!val) return 0
  if (typeof val === 'object' && typeof val.toNumber === 'function') return val.toNumber()
  return Number(val)
}

function secToTime(secs) {
  const d = new Date(secs * 1000)
  const h = d.getHours()
  const m = d.getMinutes()
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

async function fetchMtaData() {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL) return cache
  if (inflightPromise) return inflightPromise

  const promise = (async () => {
    try {
      const res = await fetch(FEED_URL)
      if (!res.ok) throw new Error(`MTA error: ${res.status}`)
      const buf = await res.arrayBuffer()
      const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buf))

      const nowSecs = Math.floor(Date.now() / 1000)
      const departures = []

      for (const entity of feed.entity) {
        const tu = entity.tripUpdate
        if (!tu) continue

        for (const stu of tu.stopTimeUpdate) {
          if (stu.stopId !== GCT_STOP_ID) continue

          // Only outbound: GCT is origin so there's a departure but no meaningful arrival
          const depSecs = toNum(stu.departure?.time)
          if (!depSecs || depSecs <= nowSecs) continue

          const minsAway = Math.round((depSecs - nowSecs) / 60)

          // Express detection: fewer stops in the update typically = express,
          // or check trip short name (odd = outbound on MNR, but not always express)
          const stopCount = tu.stopTimeUpdate.length
          const type = stopCount <= 6 ? 'Express' : 'Local'

          departures.push({
            depTime: secToTime(depSecs),
            arrTime: null,
            minsAway,
            duration: null,
            type,
            depSecs,
          })
          break // one entry per trip
        }
      }

      departures.sort((a, b) => a.depSecs - b.depSecs)
      const result = departures.slice(0, 3)
      cache = result
      cacheTime = Date.now()
      return result
    } finally {
      inflightPromise = null
    }
  })()

  inflightPromise = promise
  return promise
}

export function useMta() {
  const [departures, setDepartures] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMtaData()
      .then(setDepartures)
      .catch((e) => setError(e))

    const id = setInterval(() => {
      fetchMtaData().then(setDepartures).catch(() => {})
    }, CACHE_TTL)

    return () => clearInterval(id)
  }, [])

  return { departures, error }
}
