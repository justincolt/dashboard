import { useState, useEffect, useRef, useCallback } from 'react'

const CLIENT_ID   = '54a303c7e20f4279ae6bb058705d9fb2'
const REDIRECT_URI = window.location.origin + import.meta.env.BASE_URL
const SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ')

const LS_ACCESS   = 'sp_access'
const LS_REFRESH  = 'sp_refresh'
const LS_EXPIRY   = 'sp_expiry'
const LS_VERIFIER = 'sp_verifier'

// ── PKCE helpers ──────────────────────────────────────────────────
function randBase64() {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function sha256b64(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// ── Token helpers ─────────────────────────────────────────────────
function storedToken() {
  const tok = localStorage.getItem(LS_ACCESS)
  const exp = Number(localStorage.getItem(LS_EXPIRY) || 0)
  return tok && exp > Date.now() + 60_000 ? tok : null
}

async function refreshToken() {
  const rt = localStorage.getItem(LS_REFRESH)
  if (!rt) return null

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, grant_type: 'refresh_token', refresh_token: rt }),
  })

  if (!res.ok) {
    ;[LS_ACCESS, LS_REFRESH, LS_EXPIRY].forEach(k => localStorage.removeItem(k))
    return null
  }

  const d = await res.json()
  localStorage.setItem(LS_ACCESS, d.access_token)
  localStorage.setItem(LS_EXPIRY, Date.now() + d.expires_in * 1000)
  if (d.refresh_token) localStorage.setItem(LS_REFRESH, d.refresh_token)
  return d.access_token
}

async function validToken() {
  return storedToken() ?? refreshToken()
}

// ── Public: kick off OAuth ────────────────────────────────────────
export async function initiateSpotifyAuth() {
  const verifier  = randBase64()
  const challenge = await sha256b64(verifier)
  localStorage.setItem(LS_VERIFIER, verifier)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES,
  })
  window.location.href = `https://accounts.spotify.com/authorize?${params}`
}

// ── Handle redirect callback ──────────────────────────────────────
async function maybeHandleCallback() {
  const params = new URLSearchParams(window.location.search)
  const code   = params.get('code')
  const err    = params.get('error')
  if (code || err) window.history.replaceState({}, '', window.location.pathname)
  if (!code || err) return false

  const verifier = localStorage.getItem(LS_VERIFIER)
  if (!verifier) return false

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  })

  localStorage.removeItem(LS_VERIFIER)
  if (!res.ok) return false

  const d = await res.json()
  localStorage.setItem(LS_ACCESS, d.access_token)
  localStorage.setItem(LS_REFRESH, d.refresh_token)
  localStorage.setItem(LS_EXPIRY, Date.now() + d.expires_in * 1000)
  return true
}

// ── Utilities ─────────────────────────────────────────────────────
function msToStr(ms) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// ── Hook ──────────────────────────────────────────────────────────
export function useSpotify() {
  const [connected,    setConnected]    = useState(false)
  const [authChecked,  setAuthChecked]  = useState(false)
  const [track,        setTrack]        = useState(null) // null = nothing playing
  const [progressPct,  setProgressPct]  = useState(0)
  const [elapsed,      setElapsed]      = useState('0:00')

  const playbackRef  = useRef(null)  // { progressMs, duration, isPlaying, fetchedAt }
  const timerRef     = useRef(null)
  const rafRef       = useRef(null)
  const pollRef      = useRef(null)

  // Smooth progress via rAF
  useEffect(() => {
    const tick = () => {
      const pb = playbackRef.current
      if (pb?.isPlaying) {
        const live = pb.progressMs + (Date.now() - pb.fetchedAt)
        const clamped = Math.min(live, pb.duration)
        setProgressPct(pb.duration > 0 ? (clamped / pb.duration) * 100 : 0)
        setElapsed(msToStr(clamped))
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const poll = useCallback(async () => {
    const token = await validToken()
    if (!token) { setConnected(false); return }
    setConnected(true)

    try {
      const res = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 204) { setTrack(null); playbackRef.current = null; return }
      if (!res.ok) return

      const d = await res.json()
      playbackRef.current = {
        progressMs: d.progress_ms ?? 0,
        duration:   d.item?.duration_ms ?? 0,
        isPlaying:  d.is_playing ?? false,
        fetchedAt:  Date.now(),
      }
      if (!d.is_playing) {
        setProgressPct(d.item?.duration_ms > 0 ? (d.progress_ms / d.item.duration_ms) * 100 : 0)
        setElapsed(msToStr(d.progress_ms ?? 0))
      }
      setTrack({
        name:       d.item?.name ?? 'Unknown',
        artist:     d.item?.artists?.map(a => a.name).join(', ') ?? '',
        album:      d.item?.album?.name ?? '',
        albumArt:   d.item?.album?.images?.[0]?.url ?? null,
        duration:   msToStr(d.item?.duration_ms ?? 0),
        isPlaying:  d.is_playing ?? false,
        deviceName: d.device?.name ?? '',
      })
    } catch { /* network error — keep last state */ }
  }, [])

  useEffect(() => {
    pollRef.current = poll

    const init = async () => {
      await maybeHandleCallback()
      setAuthChecked(true)
      poll()
      timerRef.current = setInterval(() => pollRef.current(), 5000)
    }

    init()
    return () => {
      clearInterval(timerRef.current)
      cancelAnimationFrame(rafRef.current)
    }
  }, [poll])

  const sendControl = async (method, endpoint) => {
    const token = await validToken()
    if (!token) return
    await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    })
    setTimeout(poll, 400)
  }

  const disconnect = () => {
    ;[LS_ACCESS, LS_REFRESH, LS_EXPIRY].forEach(k => localStorage.removeItem(k))
    setConnected(false)
    setTrack(null)
    playbackRef.current = null
  }

  return {
    connected,
    authChecked,
    track,
    progressPct,
    elapsed,
    togglePlay: () => sendControl('PUT', track?.isPlaying ? 'pause' : 'play'),
    nextTrack:  () => sendControl('POST', 'next'),
    prevTrack:  () => sendControl('POST', 'previous'),
    disconnect,
  }
}
