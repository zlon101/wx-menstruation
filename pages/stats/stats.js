const {
  getPeriods,
  getSettings,
  getThemeStyle
} = require('../../utils/storage')
const { getStatsData } = require('../../utils/cycle')
const { diffDays } = require('../../utils/date')

Page({
  data: {
    themeStyle: '',
    stats: {},
    chartData: [],
    hasData: false
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
    this.refresh()
  },

  refresh() {
    const periods = getPeriods()
    const settings = getSettings()
    const stats = getStatsData(periods, settings)

    const chartData = []
    const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate))
    for (let i = 1; i < sorted.length; i++) {
      chartData.push({
        date: sorted[i].startDate,
        cycleLength: diffDays(sorted[i].startDate, sorted[i - 1].startDate),
        periodLength: sorted[i - 1].endDate
          ? diffDays(sorted[i - 1].endDate, sorted[i - 1].startDate) + 1
          : null
      })
    }

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const sixMonthStr = sixMonthsAgo.toISOString().slice(0, 10)
    const recentChart = chartData.filter(d => d.date >= sixMonthStr)

    this.setData({
      themeStyle: getThemeStyle(settings.theme),
      stats,
      chartData: recentChart,
      hasData: periods.length >= 2
    })
  }
})
