const { getNextPeriodPrediction, getOvulationInfo } = require('./cycle')
const { saveSettings } = require('./storage')

function dateToUnix(dateStr) {
  const parts = dateStr.split('-').map(Number)
  return Math.floor(new Date(parts[0], parts[1] - 1, parts[2]).getTime() / 1000)
}

function canUseCalendar() {
  return typeof wx.addPhoneCalendar === 'function'
}

function addPhoneCalendarEvent(options) {
  return new Promise((resolve, reject) => {
    wx.addPhoneCalendar({
      ...options,
      success: resolve,
      fail: reject
    })
  })
}

function hasAddedKey(keys, key) {
  return Array.isArray(keys) && keys.indexOf(key) !== -1
}

function markAddedKey(reminders, key) {
  const calendarAddedKeys = [...(reminders.calendarAddedKeys || [])]
  if (calendarAddedKeys.indexOf(key) === -1) {
    calendarAddedKeys.push(key)
  }
  saveSettings({ reminders: { ...reminders, calendarAddedKeys } })
  return calendarAddedKeys
}

function addPeriodReminder(periods, settings) {
  const reminders = settings.reminders || {}
  if (!reminders.periodEnabled) {
    return Promise.resolve({ skipped: true, type: 'period' })
  }

  const prediction = getNextPeriodPrediction(periods, settings)
  if (!prediction) {
    return Promise.resolve({ skipped: true, type: 'period', reason: 'no_prediction' })
  }

  const dedupeKey = `period:${prediction.start}`
  if (hasAddedKey(reminders.calendarAddedKeys, dedupeKey)) {
    return Promise.resolve({ skipped: true, type: 'period', reason: 'duplicate' })
  }

  const daysBefore = reminders.periodDaysBefore || 2
  return addPhoneCalendarEvent({
    title: '姨妈快造访啦',
    description: '轻期预测：记得准备卫生巾哦',
    startTime: dateToUnix(prediction.start),
    endTime: dateToUnix(prediction.end),
    allDay: true,
    alarm: true,
    alarmOffset: daysBefore * 86400
  })
    .then(() => {
      markAddedKey(reminders, dedupeKey)
      return { success: true, type: 'period', date: prediction.start }
    })
    .catch((err) => ({ success: false, type: 'period', err }))
}

function addOvulationReminder(periods, settings) {
  const reminders = settings.reminders || {}
  if (!reminders.ovulationEnabled) {
    return Promise.resolve({ skipped: true, type: 'ovulation' })
  }

  const ovInfo = getOvulationInfo(periods, settings)
  if (!ovInfo || !ovInfo.ovulationDay) {
    return Promise.resolve({ skipped: true, type: 'ovulation', reason: 'no_prediction' })
  }

  const dedupeKey = `ovulation:${ovInfo.ovulationDay}`
  if (hasAddedKey(reminders.calendarAddedKeys, dedupeKey)) {
    return Promise.resolve({ skipped: true, type: 'ovulation', reason: 'duplicate' })
  }

  return addPhoneCalendarEvent({
    title: '预计排卵日',
    description: '轻期预测，仅供参考',
    startTime: dateToUnix(ovInfo.ovulationDay),
    allDay: true,
    alarm: true,
    alarmOffset: 0
  })
    .then(() => {
      markAddedKey(reminders, dedupeKey)
      return { success: true, type: 'ovulation', date: ovInfo.ovulationDay }
    })
    .catch((err) => ({ success: false, type: 'ovulation', err }))
}

function isAuthError(err) {
  const msg = (err && err.errMsg) || (err && err.message) || ''
  return msg.indexOf('auth') !== -1 || msg.indexOf('authorize') !== -1 || msg.indexOf('permission') !== -1
}

function showAuthDeniedModal() {
  wx.showModal({
    title: '需要日历权限',
    content: '请在设置中允许「添加到日历」，以便接收经期与排卵提醒',
    confirmText: '去设置',
    success: (res) => {
      if (res.confirm) wx.openSetting()
    }
  })
}

function syncCalendarsAfterPeriodStart(periods, settings) {
  const reminders = settings.reminders || {}
  if (!reminders.periodEnabled && !reminders.ovulationEnabled) {
    return Promise.resolve({ added: [] })
  }

  if (!canUseCalendar()) {
    wx.showToast({ title: '请升级微信后使用日历提醒', icon: 'none' })
    return Promise.resolve({ added: [] })
  }

  // 必须在用户点击手势链中同步调用 addPhoneCalendar，不能先 await authorize
  return Promise.all([
    addPeriodReminder(periods, settings),
    addOvulationReminder(periods, settings)
  ]).then((results) => {
    const added = results.filter(r => r.success)
    const failed = results.filter(r => r.success === false && r.err)
    if (failed.some(r => isAuthError(r.err))) {
      showAuthDeniedModal()
    } else if (failed.length > 0 && added.length === 0) {
      wx.showToast({ title: '添加日历提醒失败', icon: 'none' })
    } else if (added.length > 0) {
      const labels = added.map(r =>
        r.type === 'period' ? '经期提醒' : '排卵提醒'
      )
      wx.showToast({
        title: `已添加${labels.join('、')}`,
        icon: 'success'
      })
    }
    return { added, results }
  })
}

module.exports = {
  dateToUnix,
  canUseCalendar,
  syncCalendarsAfterPeriodStart
}
