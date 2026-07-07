const MS_PER_DAY = 24 * 60 * 60 * 1000

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

function parseDate(str) {
  if (!str) return null
  const parts = str.split('-').map(Number)
  return new Date(parts[0], parts[1] - 1, parts[2])
}

function formatDate(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : parseDate(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function todayStr() {
  return formatDate(new Date())
}

function addDays(dateStr, days) {
  const d = parseDate(dateStr)
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

function diffDays(a, b) {
  const da = parseDate(a)
  const db = parseDate(b)
  return Math.round((da - db) / MS_PER_DAY)
}

function isSameDay(a, b) {
  return a === b
}

function isBefore(a, b) {
  return diffDays(a, b) < 0
}

function isAfter(a, b) {
  return diffDays(a, b) > 0
}

function isBetween(date, start, end) {
  return diffDays(date, start) >= 0 && diffDays(date, end) <= 0
}

function getMonthDays(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getMonthStart(year, month) {
  return `${year}-${pad(month + 1)}-01`
}

function getWeekday(year, month, day) {
  return new Date(year, month, day).getDay()
}

function getMonthsRange(centerYear, centerMonth, count) {
  const months = []
  let y = centerYear
  let m = centerMonth
  const half = Math.floor(count / 2)
  m -= half
  while (m < 0) {
    m += 12
    y -= 1
  }
  while (m > 11) {
    m -= 12
    y += 1
  }
  for (let i = 0; i < count; i++) {
    let cy = y
    let cm = m + i
    while (cm > 11) {
      cm -= 12
      cy += 1
    }
    months.push({ year: cy, month: cm })
  }
  return months
}

module.exports = {
  MS_PER_DAY,
  parseDate,
  formatDate,
  todayStr,
  addDays,
  diffDays,
  isSameDay,
  isBefore,
  isAfter,
  isBetween,
  getMonthDays,
  getMonthStart,
  getWeekday,
  getMonthsRange
}
