// Live chain reading for the hero, and the schedule diagram.
//
// Both public nodes answer JSON-RPC over HTTPS with CORS open, so the page can
// read mainnet directly. If neither answers, the hero shows an estimate from
// the last known reading and says so.

const NODES = ['https://node.zenonhub.io:35997', 'https://my.hc1node.com:35997']
const FROZEN_AT = 13243712 // first momentum after the community upgrade key expired
const REOPENS_AT = 14567887 // window proposed in go-zenon pull request 101
const SLOTS = 30
const POLL_MS = 10000
const REFERENCE = { height: 14332979, time: 1791010950, interval: 10.34 } // read 3 Oct 2026

const fmt = new Intl.NumberFormat('en-US')
const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
const $ = (id) => document.getElementById(id)

let preferred = 0
async function rpc(method, params) {
  for (let i = 0; i < NODES.length; i++) {
    const n = (preferred + i) % NODES.length
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), 8000)
    try {
      const res = await fetch(NODES[n], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        signal: ctl.signal,
      })
      const body = await res.json()
      if (body.error) throw new Error(body.error.message)
      preferred = n
      return body.result
    } catch {
      // try the next node
    } finally {
      clearTimeout(timer)
    }
  }
  throw new Error('no node answered')
}

let shown = [] // heights currently in the strip

function setStatus(kind, text) {
  const el = $('status')
  el.classList.remove('live', 'estimated')
  el.classList.add(kind)
  $('status-text').textContent = text
}

function beat() {
  const dot = document.querySelector('.status .dot')
  dot.classList.remove('beat')
  void dot.offsetWidth // restart the animation
  dot.classList.add('beat')
}

function drawStrip(list) {
  const strip = $('strip')
  strip.classList.remove('offline')
  const before = new Set(shown)
  strip.replaceChildren(
    ...list.map((m) => {
      const cell = document.createElement('span')
      const txs = (m.content || []).length
      cell.className = 'cell' + (txs ? ' full' : '') + (before.size && !before.has(m.height) ? ' new' : '')
      cell.title = `Momentum ${fmt.format(m.height)}: ${txs} ${txs === 1 ? 'transaction' : 'transactions'}`
      return cell
    }),
  )
  shown = list.map((m) => m.height)
  const busy = list.filter((m) => (m.content || []).length).length
  const note =
    busy === 0
      ? `None of the last ${list.length} momentums carried a transaction.`
      : `${busy} of the last ${list.length} momentums carried transactions. A filled bar is one with transactions.`
  $('strip-note').textContent = note
  strip.setAttribute('aria-label', note)
}

function drawWindow(height, nowSeconds, interval) {
  const remaining = REOPENS_AT - height
  const done = Math.min(1, Math.max(0, (height - FROZEN_AT) / (REOPENS_AT - FROZEN_AT)))
  $('bar-fill').style.width = `${(done * 100).toFixed(2)}%`
  $('bar').setAttribute('aria-valuenow', (done * 100).toFixed(0))
  if (remaining <= 0) {
    $('remaining').textContent = 'The window is open.'
    return
  }
  const eta = new Date((nowSeconds + remaining * interval) * 1000)
  $('remaining').textContent = `${fmt.format(remaining)} momentums to go, about ${day.format(eta)} at the current pace.`
}

async function refresh() {
  try {
    const frontier = await rpc('ledger.getFrontierMomentum', [])
    if (shown.length && frontier.height === shown[shown.length - 1]) return
    const from = Math.max(1, frontier.height - SLOTS + 1)
    const { list } = await rpc('ledger.getMomentumsByHeight', [from, SLOTS])
    const first = list[0]
    const last = list[list.length - 1]
    const interval = list.length > 1 ? (last.timestamp - first.timestamp) / (list.length - 1) : REFERENCE.interval
    $('height').textContent = fmt.format(last.height)
    setStatus('live', 'Live from a public node')
    beat()
    drawStrip(list)
    drawWindow(last.height, last.timestamp, interval)
  } catch {
    const now = Date.now() / 1000
    const height = REFERENCE.height + Math.floor((now - REFERENCE.time) / REFERENCE.interval)
    $('height').textContent = fmt.format(height)
    setStatus('estimated', 'Estimated: no public node answered')
    $('strip').classList.add('offline')
    $('strip-note').textContent = 'Recent momentums appear here when a public node answers.'
    drawWindow(height, now, REFERENCE.interval)
  }
}

refresh()
setInterval(refresh, POLL_MS)

// ---------- schedule ----------
// Mermaid is 3.5 MB, so it loads only when the schedule comes near the screen.

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = () => reject(new Error(`could not load ${src}`))
    document.head.append(s)
  })
}

async function drawSchedule(pre) {
  try {
    await loadScript('assets/vendor/mermaid.min.js')
    await document.fonts.ready
    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: '#1a1a1a',
        fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
        fontSize: '14px',
        primaryColor: '#123a25',
        primaryTextColor: '#fafafa',
        primaryBorderColor: '#00d557',
        lineColor: '#5c5c5c',
        textColor: '#fafafa',
        sectionBkgColor: 'rgba(255,255,255,0.025)',
        altSectionBkgColor: 'rgba(0,0,0,0)',
        sectionBkgColor2: 'rgba(255,255,255,0.025)',
        taskBkgColor: '#123a25',
        taskBorderColor: '#00d557',
        taskTextColor: '#fafafa',
        taskTextLightColor: '#fafafa',
        taskTextDarkColor: '#fafafa',
        taskTextOutsideColor: '#d9d9d9',
        critBkgColor: '#f91690',
        critBorderColor: '#f91690',
        gridColor: '#2e2e2e',
        todayLineColor: '#3d8bff',
      },
      gantt: { barHeight: 18, barGap: 9, topPadding: 36, leftPadding: 150, fontSize: 13, sectionFontSize: 13, numberSectionStyles: 2 },
    })
    await window.mermaid.run({ nodes: [pre] })
  } catch {
    const p = document.createElement('p')
    p.className = 'schedule-error'
    p.textContent = 'The schedule could not be drawn. The plain text above lists the same dates.'
    pre.closest('figure').append(p)
  }
}

const schedule = document.querySelector('#schedule pre.mermaid')
if (schedule) {
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      io.disconnect()
      drawSchedule(schedule)
    },
    { rootMargin: '800px 0px' },
  )
  io.observe(schedule)
}
