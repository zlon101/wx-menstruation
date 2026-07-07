const {
  getPeriods,
  getSettings,
  savePeriods,
  saveSettings,
  getThemeStyle
} = require('../../utils/storage')
const {
  buildCalendarMarks,
  getStatusSummary,
  getActivePeriod,
  startPeriod,
  endPeriod,
  getDateDetailText
} = require('../../utils/cycle')
const { todayStr } = require('../../utils/date')
const { syncCalendarsAfterPeriodStart } = require('../../utils/calendar-reminder')

Page({
  data: {
    themeStyle: '',
    status: {},
    marks: {},
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth(),
    selectedDate: todayStr(),
    dateDetail: '',
    showSmartBanner: false,
    showRecordSheet: false,
    showPredictionSheet: false,
    hasActivePeriod: false,
    mode: 'normal',
    hasRecords: false
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    this.refresh()
  },

  refresh() {
    const periods = getPeriods()
    const settings = getSettings()
    const marks = buildCalendarMarks(
      periods,
      settings,
      this.data.calendarYear,
      this.data.calendarMonth
    )
    const status = getStatusSummary(periods, settings)
    const active = getActivePeriod(periods)
    const showSmartBanner =
      periods.length > 0 &&
      !settings.hasCustomizedSettings &&
      !settings.smartBannerDismissed

    this.setData({
      themeStyle: getThemeStyle(settings.theme),
      status,
      marks,
      hasActivePeriod: !!active,
      showSmartBanner,
      mode: settings.mode,
      hasRecords: periods.length > 0,
      dateDetail: getDateDetailText(this.data.selectedDate, periods, settings)
    })
  },

  onMonthChange(e) {
    const { year, month } = e.detail
    const periods = getPeriods()
    const settings = getSettings()
    this.setData({
      calendarYear: year,
      calendarMonth: month,
      marks: buildCalendarMarks(periods, settings, year, month)
    })
  },

  onGoToday(e) {
    const { year, month, date } = e.detail
    const periods = getPeriods()
    const settings = getSettings()
    this.setData({
      calendarYear: year,
      calendarMonth: month,
      selectedDate: date,
      marks: buildCalendarMarks(periods, settings, year, month),
      dateDetail: getDateDetailText(date, periods, settings)
    })
  },

  onDayTap(e) {
    const { date } = e.detail
    const periods = getPeriods()
    const settings = getSettings()
    this.setData({
      selectedDate: date,
      dateDetail: getDateDetailText(date, periods, settings),
      showRecordSheet: true
    })
  },

  onRecordTap() {
    this.setData({ showRecordSheet: true })
  },

  onRecordClose() {
    this.setData({ showRecordSheet: false })
  },

  onPeriodStart(e) {
    const date = e.detail.date || todayStr()
    const periods = getPeriods()
    const result = startPeriod(periods, date)
    if (!result.success) {
      wx.showToast({ title: result.message, icon: 'none' })
      return
    }
    savePeriods(result.periods)
    syncCalendarsAfterPeriodStart(result.periods, getSettings())
    getApp().markHomeRefresh()
    this.setData({ showRecordSheet: false })
    wx.showToast({ title: '已记录', icon: 'success' })
    this.refresh()
  },

  onPeriodEnd(e) {
    const date = e.detail.date || todayStr()
    const periods = getPeriods()
    const result = endPeriod(periods, date)
    if (!result.success) {
      wx.showToast({ title: result.message, icon: 'none' })
      return
    }
    savePeriods(result.periods)
    getApp().markHomeRefresh()
    this.setData({ showRecordSheet: false })
    wx.showToast({ title: '已记录', icon: 'success' })
    this.refresh()
  },

  onInfoTap() {
    this.setData({ showPredictionSheet: true })
  },

  onPredictionClose() {
    this.setData({ showPredictionSheet: false })
  },

  onBannerClose() {
    saveSettings({ smartBannerDismissed: true })
    this.setData({ showSmartBanner: false })
  },

  onBannerGoSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  }
})
