const STORAGE_KEY = 'qingqi_data'

const DEFAULT_SETTINGS = {
  periodLength: 5,
  cycleLength: 28,
  hasCustomizedSettings: false,
  smartBannerDismissed: false,
  mode: 'normal',
  theme: 'rose',
  privacyAccepted: false,
  reminders: {
    periodEnabled: true,
    periodDaysBefore: 2,
    ovulationEnabled: false,
    calendarAddedKeys: []
  }
}

const THEMES = {
  rose: {
    name: '玫瑰粉',
    primary: '#E85D75',
    primaryLight: '#FDE8EC',
    primarySoft: '#F9A8B4',
    period: '#E85D75',
    periodPredict: '#F9C4CE',
    ovulation: '#7C6CF0',
    fertile: '#A78BFA'
  },
  mint: {
    name: '薄荷绿',
    primary: '#3DAB9A',
    primaryLight: '#E6F7F4',
    primarySoft: '#8ED4C8',
    period: '#E85D75',
    periodPredict: '#F9C4CE',
    ovulation: '#5B8DEF',
    fertile: '#93B4F5'
  },
  morandi: {
    name: '莫兰迪灰',
    primary: '#9B8E8E',
    primaryLight: '#F3F0EF',
    primarySoft: '#C4B8B8',
    period: '#C97B84',
    periodPredict: '#E8C4C8',
    ovulation: '#8B9EAB',
    fertile: '#B0BEC7'
  },
  klein: {
    name: '克莱因蓝',
    primary: '#2563EB',
    primaryLight: '#EFF6FF',
    primarySoft: '#93C5FD',
    period: '#E85D75',
    periodPredict: '#F9C4CE',
    ovulation: '#1D4ED8',
    fertile: '#60A5FA'
  }
}

function getDefaultData() {
  return {
    periods: [],
    settings: { ...DEFAULT_SETTINGS, reminders: { ...DEFAULT_SETTINGS.reminders } }
  }
}

function loadData() {
  try {
    const raw = wx.getStorageSync(STORAGE_KEY)
    if (!raw) return getDefaultData()
    return {
      periods: raw.periods || [],
      settings: { ...DEFAULT_SETTINGS, ...raw.settings, reminders: { ...DEFAULT_SETTINGS.reminders, ...(raw.settings && raw.settings.reminders) } }
    }
  } catch (e) {
    return getDefaultData()
  }
}

function saveData(data) {
  wx.setStorageSync(STORAGE_KEY, data)
}

function getPeriods() {
  return loadData().periods
}

function getSettings() {
  return loadData().settings
}

function savePeriods(periods) {
  const data = loadData()
  data.periods = periods
  saveData(data)
}

function saveSettings(settings) {
  const data = loadData()
  data.settings = { ...data.settings, ...settings }
  saveData(data)
}

function clearAllData() {
  wx.removeStorageSync(STORAGE_KEY)
}

function getThemeVars(themeKey) {
  const theme = THEMES[themeKey] || THEMES.rose
  return {
    '--color-primary': theme.primary,
    '--color-primary-light': theme.primaryLight,
    '--color-primary-soft': theme.primarySoft,
    '--color-period': theme.period,
    '--color-period-predict': theme.periodPredict,
    '--color-ovulation': theme.ovulation,
    '--color-fertile': theme.fertile
  }
}

function getThemeStyle(themeKey) {
  const vars = getThemeVars(themeKey)
  return Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')
}

module.exports = {
  DEFAULT_SETTINGS,
  THEMES,
  loadData,
  saveData,
  getPeriods,
  getSettings,
  savePeriods,
  saveSettings,
  clearAllData,
  getThemeVars,
  getThemeStyle
}
