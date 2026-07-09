const { getNextPeriodPrediction, getOvulationInfo } = require('./cycle')
const { saveSettings } = require('./storage')

function dateToUnix(dateStr) {
  const parts = dateStr.split('-').map(Number)
  return Math.floor(new Date(parts[0], parts[1] - 1, parts[2]).getTime() / 1000)
}

function dateToUnixAt(dateStr, hour, minute) {
  const parts = dateStr.split('-').map(Number)
  return Math.floor(new Date(parts[0], parts[1] - 1, parts[2], hour, minute, 0).getTime() / 1000)
}

function addDays(dateStr, days) {
  const parts = dateStr.split('-').map(Number)
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function compareDate(a, b) {
  return dateToUnix(a) - dateToUnix(b)
}

function todayStr() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

  const daysBefore = reminders.periodDaysBefore || 2
  const reminderDate = addDays(prediction.start, -daysBefore)
  if (compareDate(reminderDate, todayStr()) < 0) {
    return Promise.resolve({ skipped: true, type: 'period', reason: 'expired' })
  }

  const dedupeKey = `period:${prediction.start}:before:${daysBefore}`
  if (hasAddedKey(reminders.calendarAddedKeys, dedupeKey)) {
    return Promise.resolve({ skipped: true, type: 'period', reason: 'duplicate' })
  }

  return addPhoneCalendarEvent({
    title: '姨妈快造访啦',
    description: `轻期提醒：预计 ${prediction.start} 来临，记得提前准备`,
    startTime: dateToUnixAt(reminderDate, 18, 0),
    endTime: dateToUnixAt(reminderDate, 18, 5),
    allDay: false,
    alarm: true,
    alarmOffset: 0
  })
    .then(() => {
      markAddedKey(reminders, dedupeKey)
      return { success: true, type: 'period', date: reminderDate }
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

  if (compareDate(ovInfo.ovulationDay, todayStr()) < 0) {
    return Promise.resolve({ skipped: true, type: 'ovulation', reason: 'expired' })
  }

  const dedupeKey = `ovulation:${ovInfo.ovulationDay}`
  if (hasAddedKey(reminders.calendarAddedKeys, dedupeKey)) {
    return Promise.resolve({ skipped: true, type: 'ovulation', reason: 'duplicate' })
  }

  return addPhoneCalendarEvent({
    title: '预计排卵日',
    description: '轻期预测，仅供参考',
    startTime: dateToUnixAt(ovInfo.ovulationDay, 18, 0),
    endTime: dateToUnixAt(ovInfo.ovulationDay, 18, 5),
    allDay: false,
    alarm: true,
    alarmOffset: 0
  })
    .then(() => {
      markAddedKey(reminders, dedupeKey)
      return { success: true, type: 'ovulation', date: ovInfo.ovulationDay }
    })
    .catch((err) => ({ success: false, type: 'ovulation', err }))
}

function getErrorMessage(err) {
  if (!err) {
    return '未知错误'
  }
  const msg = err.errMsg || err.message || String(err)
  const errno = err.errno != null ? ` (errno: ${err.errno})` : ''
  return `${msg}${errno}`
}

function isAuthError(err) {
  const msg = (err && err.errMsg) || (err && err.message) || ''
  return msg.indexOf('auth') !== -1 ||
    msg.indexOf('authorize') !== -1 ||
    msg.indexOf('permission') !== -1
}

function isPrivacyAgreementError(err) {
  const msg = (err && err.errMsg) || (err && err.message) || ''
  const errno = err && err.errno
  return errno === 112 ||
    errno === 101100 ||
    errno === 101102 ||
    msg.indexOf('privacy agreement') !== -1 ||
    msg.indexOf('privacy permission') !== -1
}

function showAuthDeniedModal(failed) {
  const details = Array.isArray(failed) && failed.length
    ? failed.map((r) => {
      const label = r.type === 'period' ? '经期提醒' : '排卵提醒'
      return `${label}：${getErrorMessage(r.err)}`
    }).join('\n') + '\n\n'
    : ''

  wx.showModal({
    title: '需要日历权限',
    content: `${details}请在设置中允许「添加到日历」，以便接收经期与排卵提醒`,
    confirmText: '去设置',
    success: (res) => {
      if (res.confirm) wx.openSetting()
    }
  })
}

function showPrivacyAgreementModal(failed) {
  const details = failed.map((r) => {
    const label = r.type === 'period' ? '经期提醒' : '排卵提醒'
    return `${label}：${getErrorMessage(r.err)}`
  }).join('\n')
  wx.showModal({
    title: '隐私协议未授权',
    content: `${details}\n\n请在微信公众平台完善「日历（仅写入）」隐私声明，并同意小程序隐私保护指引后重试。`,
    showCancel: false
  })
}

function showCalendarFailureModal(failed) {
  const details = failed.map((r) => {
    const label = r.type === 'period' ? '经期提醒' : '排卵提醒'
    return `${label}：${getErrorMessage(r.err)}`
  }).join('\n')

  wx.showModal({
    title: '添加日历提醒失败',
    content: details,
    showCancel: false
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
    if (failed.some(r => isPrivacyAgreementError(r.err))) {
      showPrivacyAgreementModal(failed.filter(r => isPrivacyAgreementError(r.err)))
    } else if (failed.some(r => isAuthError(r.err))) {
      showAuthDeniedModal(failed.filter(r => isAuthError(r.err)))
    } else if (failed.length > 0) {
      showCalendarFailureModal(failed)
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
