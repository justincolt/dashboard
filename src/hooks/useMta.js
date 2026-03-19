import { useState, useEffect } from 'react'
import GtfsRealtimeBindings from 'gtfs-realtime-bindings'

export const MNR_FEED_URL = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/mnr%2Fgtfs-mnr'
const CACHE_TTL = 60 * 1000 // 1 minute

// Per-feed module-level caches
const feedCacheMap = new Map()   // url -> { feed, time }
const inflightMap  = new Map()   // url -> promise

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

async function fetchFeed(url) {
  const now = Date.now()
  const cached = feedCacheMap.get(url)
  if (cached && now - cached.time < CACHE_TTL) return cached.feed
  if (inflightMap.has(url)) return inflightMap.get(url)

  const promise = (async () => {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`MTA ${res.status}`)
      const buf = await res.arrayBuffer()
      const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buf))
      feedCacheMap.set(url, { feed, time: Date.now() })
      return feed
    } finally {
      inflightMap.delete(url)
    }
  })()

  inflightMap.set(url, promise)
  return promise
}

// direction: 'N' | 'S' | null
// For subway, stop IDs in the feed are like "127N" / "127S"
// For MNR, stop IDs are plain numbers — no suffix
function parseDepartures(feed, fromId, direction, limit = 3) {
  const nowSecs = Math.floor(Date.now() / 1000)
  const stopTarget = direction ? `${fromId}${direction}` : String(fromId)
  const departures = []

  for (const entity of feed.entity) {
    const tu = entity.tripUpdate
    if (!tu) continue

    for (const stu of tu.stopTimeUpdate) {
      if (String(stu.stopId) !== stopTarget) continue

      const depSecs = toNum(stu.departure?.time) || toNum(stu.arrival?.time)
      if (!depSecs || depSecs <= nowSecs) continue

      const minsAway = Math.round((depSecs - nowSecs) / 60)
      const stopCount = tu.stopTimeUpdate.length
      const type = stopCount <= 6 ? 'Express' : 'Local'

      departures.push({ depTime: secToTime(depSecs), minsAway, type, depSecs })
      break
    }
  }

  departures.sort((a, b) => a.depSecs - b.depSecs)
  return departures.slice(0, limit)
}

// routes: [{ id, feedUrl, fromId, direction }]
// returns: { results: { [routeId]: departures[] }, error, isLive }
export function useMta(routes) {
  const [results, setResults] = useState(null)
  const [error, setError]     = useState(null)

  const routeKey = routes?.map(r => `${r.id}:${r.feedUrl}:${r.fromId}:${r.direction}`).join(',') ?? ''

  useEffect(() => {
    if (!routes?.length) return
    let cancelled = false

    const load = async () => {
      try {
        // Group routes by feed URL to avoid duplicate fetches
        const feedGroups = {}
        for (const route of routes) {
          const url = route.feedUrl || MNR_FEED_URL
          if (!feedGroups[url]) feedGroups[url] = []
          feedGroups[url].push(route)
        }

        // Fetch all unique feeds in parallel
        const feedResults = await Promise.all(
          Object.entries(feedGroups).map(([url, _]) => fetchFeed(url).then(feed => [url, feed]))
        )
        const feedByUrl = Object.fromEntries(feedResults)

        if (cancelled) return

        const map = {}
        for (const route of routes) {
          const url = route.feedUrl || MNR_FEED_URL
          const feed = feedByUrl[url]
          map[route.id] = feed ? parseDepartures(feed, route.fromId, route.direction ?? null) : []
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

  const isLive = results !== null
  return { results, error, isLive }
}
