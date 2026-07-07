const {
  getSettings,
  saveSettings,
  getThemeStyle
} = require('../../utils/storage')

Page({
  data: {
    themeStyle: '',
    periodLength: 5,
    cycleLength: 28,
    periodRange: [],
    cycleRange: []
  },

  onLoad() {
    const periodRange = []
    const cycleRange = []
    for (let i = 2; i <= 14; i++) periodRange.push(i)
    for (let i = 20; i <= 45; i++) cycleRange.push(i)
    this.setData({ periodRange, cycleRange })
    this.refresh()
  },

  refresh() {
    const settings = getSettings()
    this.setData({
      themeStyle: getThemeStyle(settings.theme),
      periodLength: settings.periodLength,
      cycleLength: settings.cycleLength
    })
  },

  onPeriodChange(e) {
    const index = e.detail.value
    const periodLength = this.data.periodRange[index]
    this.setData({ periodLength })
    saveSettings({
      periodLength,
      hasCustomizedSettings: true
    })
    getApp().markHomeRefresh()
  },

  onCycleChange(e) {
    const index = e.detail.value
    const cycleLength = this.data.cycleRange[index]
    this.setData({ cycleLength })
    saveSettings({
      cycleLength,
      hasCustomizedSettings: true
    })
    getApp().markHomeRefresh()
  }
})
