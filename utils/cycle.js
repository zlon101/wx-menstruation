const {
  addDays,
  diffDays,
  formatDate,
  isBetween,
  todayStr,
  parseDate
} = require('./date')

const DEFAULT_PERIOD_LENGTH = 5
const DEFAULT_CYCLE_LENGTH = 28
const OVULATION_OFFSET = 14
const FERTILE_BEFORE = 5
const FERTILE_AFTER = 4
const PAUSE_PREDICTION_DAYS = 45
const WEIGHTED_THRESHOLD_MONTHS = 3

function sortPeriods(periods) {
  return [...periods].sort((a, b) => diffDays(a.startDate, b.startDate))
}

function getCompletedPeriods(periods) {
  return sortPeriods(periods).filter(p => p.endDate)
}

function getActivePeriod(periods) {
  return sortPeriods(periods).find(p => !p.endDate) || null
}

function calcCycleLengths(periods) {
  const sorted = sortPeriods(periods)
  const lengths = []
  for (let i = 1; i < sorted.length; i++) {
    const len = diffDays(sorted[i].startDate, sorted[i - 1].startDate)
    if (len >= 20 && len <= 45) lengths.push(len)
  }
  return lengths
}

function calcPeriodLengths(periods) {
  return getCompletedPeriods(periods).map(p => {
    const len = diffDays(p.endDate, p.startDate) + 1
    return len >= 2 && len <= 14 ? len : null
  }).filter(Boolean)
}

function weightedAverage(values) {
  if (!values.length) return null
  let totalWeight = 0
  let sum = 0
  values.forEach((v, i) => {
    const weight = i + 1
    sum += v * weight
    totalWeight += weight
  })
  return Math.round(sum / totalWeight)
}

function simpleAverage(values) {
  if (!values.length) return null
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

function hasEnoughHistory(periods) {
  const sorted = sortPeriods(periods)
  if (sorted.length < 2) return false
  const first = sorted[0].startDate
  const last = sorted[sorted.length - 1].startDate
  return diffDays(last, first) >= WEIGHTED_THRESHOLD_MONTHS * 30
}

function getEffectiveCycleLength(periods, settings) {
  const cycles = calcCycleLengths(periods)
  if (cycles.length === 0) return settings.cycleLength || DEFAULT_CYCLE_LENGTH
  if (hasEnoughHistory(periods)) return weightedAverage(cycles)
  return simpleAverage(cycles) || settings.cycleLength || DEFAULT_CYCLE_LENGTH
}

function getEffectivePeriodLength(periods, settings) {
  const lengths = calcPeriodLengths(periods)
  if (lengths.length === 0) return settings.periodLength || DEFAULT_PERIOD_LENGTH
  if (hasEnoughHistory(periods)) return weightedAverage(lengths)
  return simpleAverage(lengths) || settings.periodLength || DEFAULT_PERIOD_LENGTH
}

function getLastPeriodStart(periods) {
  const sorted = sortPeriods(periods)
  return sorted.length ? sorted[sorted.length - 1].startDate : null
}

function isPredictionPaused(periods) {
  const lastStart = getLastPeriodStart(periods)
  if (!lastStart) return false
  const active = getActivePeriod(periods)
  if (active) return false
  return diffDays(todayStr(), lastStart) > PAUSE_PREDICTION_DAYS
}

function predictNextPeriodStart(periods, settings) {
  const lastStart = getLastPeriodStart(periods)
  if (!lastStart || isPredictionPaused(periods)) return null
  const cycleLen = getEffectiveCycleLength(periods, settings)
  let next = addDays(lastStart, cycleLen)
  const today = todayStr()
  while (diffDays(today, next) > 0) {
    next = addDays(next, cycleLen)
  }
  return next
}

function predictPeriodRange(periods, settings) {
  if (!periods.length || isPredictionPaused(periods)) return []
  const cycleLen = getEffectiveCycleLength(periods, settings)
  const periodLen = getEffectivePeriodLength(periods, settings)
  const nextStart = predictNextPeriodStart(periods, settings)
  if (!nextStart) return []

  const ranges = []
  for (let i = 0; i < 3; i++) {
    const start = addDays(nextStart, i * cycleLen)
    ranges.push({
      start,
      end: addDays(start, periodLen - 1),
      isPredicted: true
    })
  }
  return ranges
}

function getOvulationInfo(periods, settings) {
  const nextStart = predictNextPeriodStart(periods, settings)
  if (!nextStart) return null
  const ovulationDay = addDays(nextStart, -OVULATION_OFFSET)
  return {
    ovulationDay,
    fertileStart: addDays(ovulationDay, -FERTILE_BEFORE),
    fertileEnd: addDays(ovulationDay, FERTILE_AFTER)
  }
}

function getDayType(dateStr, periods, settings) {
  const sorted = sortPeriods(periods)

  for (const p of sorted) {
    if (p.endDate && isBetween(dateStr, p.startDate, p.endDate)) {
      const dayNum = diffDays(dateStr, p.startDate) + 1
      return { type: 'period', dayNum, isPredicted: false }
    }
    if (!p.endDate && dateStr === p.startDate) {
      return { type: 'period', dayNum: 1, isPredicted: false, ongoing: true }
    }
  }

  const predicted = predictPeriodRange(periods, settings)
  for (const r of predicted) {
    if (isBetween(dateStr, r.start, r.end)) {
      const dayNum = diffDays(dateStr, r.start) + 1
      return { type: 'period', dayNum, isPredicted: true }
    }
  }

  const ovInfo = getOvulationInfo(periods, settings)
  if (ovInfo) {
    if (dateStr === ovInfo.ovulationDay) {
      return { type: 'ovulation', isPredicted: true }
    }
    if (isBetween(dateStr, ovInfo.fertileStart, ovInfo.fertileEnd)) {
      return { type: 'fertile', isPredicted: true }
    }
  }

  return { type: 'normal' }
}

function buildCalendarMarks(periods, settings, year, month) {
  const marks = {}
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDate(new Date(year, month, d))
    const info = getDayType(dateStr, periods, settings)
    if (info.type !== 'normal') {
      marks[dateStr] = info
    }
  }
  return marks
}

function getStatusSummary(periods, settings) {
  if (!periods.length) {
    return {
      title: '开启你的纯净记录之旅',
      subtitle: '点击下方「记一笔」，开始记录吧',
      showInfo: false,
      isEmpty: true
    }
  }

  if (isPredictionPaused(periods)) {
    return {
      title: '等待大姨妈中',
      subtitle: '已经有一段时间没记录了，是忘记标记还是有了新情况？',
      showInfo: true,
      isPaused: true
    }
  }

  const active = getActivePeriod(periods)
  if (active) {
    const dayNum = diffDays(todayStr(), active.startDate) + 1
    return {
      title: `经期第 ${dayNum} 天`,
      subtitle: '注意休息，照顾好自己',
      showInfo: true
    }
  }

  const nextStart = predictNextPeriodStart(periods, settings)
  if (nextStart) {
    const daysLeft = diffDays(nextStart, todayStr())
    if (daysLeft === 0) {
      return {
        title: '经期预计今天开始',
        subtitle: '记得准备好用品哦',
        showInfo: true
      }
    }
    return {
      title: `距离下次经期还有 ${daysLeft} 天`,
      subtitle: getEffectiveCycleLength(periods, settings) >= 28
        ? '预测基于你的历史记录'
        : '最近周期有些波动，注意休息哦',
      showInfo: true
    }
  }

  return {
    title: '开启你的纯净记录之旅',
    subtitle: '记录越多，预测越准',
    showInfo: false
  }
}

function getStatsData(periods, settings) {
  const completed = getCompletedPeriods(periods)
  const cycleLengths = calcCycleLengths(periods)
  const periodLengths = calcPeriodLengths(periods)

  const sixMonthsAgo = addDays(todayStr(), -180)
  const recentCycles = []
  const sorted = sortPeriods(periods)

  for (let i = 1; i < sorted.length; i++) {
    const start = sorted[i].startDate
    if (diffDays(start, sixMonthsAgo) >= 0) {
      recentCycles.push({
        date: start,
        cycleLength: diffDays(start, sorted[i - 1].startDate),
        periodLength: sorted[i - 1].endDate
          ? diffDays(sorted[i - 1].endDate, sorted[i - 1].startDate) + 1
          : null
      })
    }
  }

  return {
    totalRecords: periods.length,
    avgCycleLength: getEffectiveCycleLength(periods, settings),
    avgPeriodLength: getEffectivePeriodLength(periods, settings),
    cycleLengths,
    periodLengths,
    recentCycles,
    useWeighted: hasEnoughHistory(periods)
  }
}

function startPeriod(periods, dateStr) {
  const active = getActivePeriod(periods)
  if (active) return { success: false, message: '当前已有进行中的经期，请先标记结束' }

  const existing = periods.find(p => p.startDate === dateStr)
  if (existing) return { success: false, message: '该日期已有记录' }

  const newPeriod = {
    id: Date.now().toString(),
    startDate: dateStr,
    endDate: null
  }
  return { success: true, periods: sortPeriods([...periods, newPeriod]) }
}

function endPeriod(periods, dateStr) {
  const active = getActivePeriod(periods)
  if (!active) return { success: false, message: '没有进行中的经期' }
  if (diffDays(dateStr, active.startDate) < 0) {
    return { success: false, message: '结束日期不能早于开始日期' }
  }

  const updated = periods.map(p =>
    p.id === active.id ? { ...p, endDate: dateStr } : p
  )
  return { success: true, periods: updated }
}

function deletePeriod(periods, id) {
  return periods.filter(p => p.id !== id)
}

function getDateDetailText(dateStr, periods, settings) {
  const info = getDayType(dateStr, periods, settings)
  if (info.type === 'period') {
    const prefix = info.isPredicted ? '预计经期第' : '经期第'
    return `${prefix} ${info.dayNum} 天`
  }
  if (info.type === 'ovulation') return '预计排卵日'
  if (info.type === 'fertile') return '预计易孕期'
  return '平常日'
}

function getNextPeriodPrediction(periods, settings) {
  const start = predictNextPeriodStart(periods, settings)
  if (!start) return null
  const periodLen = getEffectivePeriodLength(periods, settings)
  return {
    start,
    end: addDays(start, periodLen - 1)
  }
}

module.exports = {
  DEFAULT_PERIOD_LENGTH,
  DEFAULT_CYCLE_LENGTH,
  sortPeriods,
  getActivePeriod,
  getEffectiveCycleLength,
  getEffectivePeriodLength,
  isPredictionPaused,
  predictNextPeriodStart,
  predictPeriodRange,
  getOvulationInfo,
  getDayType,
  buildCalendarMarks,
  getStatusSummary,
  getStatsData,
  startPeriod,
  endPeriod,
  deletePeriod,
  getDateDetailText,
  hasEnoughHistory,
  getNextPeriodPrediction
}
