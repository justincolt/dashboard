import { useState, useEffect } from 'react'
import GtfsRealtimeBindings from 'gtfs-realtime-bindings'

const FEED_URL = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/mnr%2Fgtfs-mnr'
const CACHE_TTL = 60 * 1000 // 1 minute

// Module-level feed cache shared across all hook instances
let feedCache = null
let feedCacheTime = 0
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

async function fetchFeed() {
  const now = Date.now()
  if (feedCache && now - feedCacheTime < CACHE_TTL) return feedCache
  if (inflightPromise) return inflightPromise

  const promise = (async () => {
    try {
      const res = await fetch(FEED_URL)
      if (!res.ok) throw new Error(`MTA ${res.status}`)
      const buf = await res.arrayBuffer()
      const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buf))
      feedCache = feed
      feedCacheTime = Date.now()
      return feed
    } finally {
      inflightPromise = null
    }
  })()

  inflightPromise = promise
  return promise
}

function parseDepartures(feed, fromStopId, limit = 3) {
  const nowSecs = Math.floor(Date.now() / 1000)
  const departures = []

  for (const entity of feed.entity) {
    const tu = entity.tripUpdate
    if (!tu) continue

    for (const stu of tu.stopTimeUpdate) {
      if (String(stu.stopId) !== String(fromStopId)) continue

      const depSecs = toNum(stu.departure?.time) || toNum(stu.arrival?.time)
      if (!depSecs || depSecs <= nowSecs) continue

      const minsAway = Math.round((depSecs - nowSecs) / 60)
      const stopCount = tu.stopTimeUpdate.length
      const type = stopCount <= 6 ? 'Express' : 'Local'

      departures.push({ depTime: secToTime(depSecs), minsAway, type, depSecs })
      break // one entry per trip
    }
  }

  departures.sort((a, b) => a.depSecs - b.depSecs)
  return departures.slice(0, limit)
}

// routes: [{ id, fromId }, ...]
// returns: { results: { [routeId]: departures[] }, error }
export function useMta(routes) {
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  // Stable key so effect only re-runs when routes actually change
  const routeKey = routes?.map(r => `${r.id}:${r.fromId}`).join(',') ?? ''

  useEffect(() => {
    if (!routes?.length) return

    let cancelled = false

    const load = async () => {
      try {
        const feed = await fetchFeed()
        if (cancelled) return
        const map = {}
        for (const route of routes) {
          map[route.id] = parseDepartures(feed, route.fromId)
        }
        setResults(map)
      } catch (e) {
        if (!cancelled) setError(e)
      }
    }

    load()
    const id = setInterval(load, CACHE_TTL)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [routeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return { results, error }
}
