const { getSettings, saveSettings, getThemeStyle } = require('../../utils/storage')
const { canUseCalendar } = require('../../utils/calendar-reminder')

Page({
  data: {
    themeStyle: '',
    reminders: {},
    daysBeforeOptions: [1, 2],
    daysBeforeIndex: 1
  },

  onLoad() {
    this.refresh()
  },

  refresh() {
    const settings = getSettings()
    const reminders = settings.reminders || {}
    const periodDaysBefore = reminders.periodDaysBefore || 2
    this.setData({
      themeStyle: getThemeStyle(settings.theme),
      reminders,
      daysBeforeIndex: periodDaysBefore === 1 ? 0 : 1
    })
  },

  onPeriodToggle(e) {
    const enabled = e.detail.value
    if (enabled) {
      if (!canUseCalendar()) {
        wx.showToast({ title: '请升级微信后使用日历提醒', icon: 'none' })
        this.refresh()
        return
      }
      wx.showModal({
        title: '系统日历提醒',
        content: '开启后，每次记录经期开始时，将自动在下次经期前 1-2 天的 18:00 添加一条系统日历提醒。',
        showCancel: false,
        success: () => {
          this.saveReminder({ periodEnabled: true })
        }
      })
    } else {
      this.saveReminder({ periodEnabled: false })
    }
  },

  onOvulationToggle(e) {
    const enabled = e.detail.value
    if (enabled) {
      if (!canUseCalendar()) {
        wx.showToast({ title: '请升级微信后使用日历提醒', icon: 'none' })
        this.refresh()
        return
      }
      wx.showModal({
        title: '排卵日日历提醒',
        content: '开启后，每次记录经期开始时，将自动在预计排卵日当天 18:00 添加一条系统日历提醒。',
        showCancel: false,
        success: () => {
          this.saveReminder({ ovulationEnabled: true })
        }
      })
    } else {
      this.saveReminder({ ovulationEnabled: false })
    }
  },

  onDaysBeforeChange(e) {
    const index = Number(e.detail.value)
    const periodDaysBefore = this.data.daysBeforeOptions[index]
    this.setData({ daysBeforeIndex: index })
    this.saveReminder({ periodDaysBefore })
  },

  saveReminder(updates) {
    const settings = getSettings()
    const reminders = { ...settings.reminders, ...updates }
    if (!Array.isArray(reminders.calendarAddedKeys)) {
      reminders.calendarAddedKeys = []
    }
    saveSettings({ reminders })
    this.setData({ reminders })
  }
})
