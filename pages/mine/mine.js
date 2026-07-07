const {
  getSettings,
  saveSettings,
  clearAllData,
  getThemeStyle,
  THEMES
} = require('../../utils/storage')

Page({
  data: {
    themeStyle: '',
    settings: {},
    themeList: [],
    modeText: '常规记录模式'
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    this.refresh()
  },

  refresh() {
    const settings = getSettings()
    const themeList = Object.keys(THEMES).map(key => ({
      key,
      name: THEMES[key].name,
      active: settings.theme === key
    }))

    this.setData({
      themeStyle: getThemeStyle(settings.theme),
      settings,
      themeList,
      modeText: settings.mode === 'pregnancy' ? '备孕模式' : '常规记录模式'
    })
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  goPrediction() {
    wx.navigateTo({ url: '/pages/prediction/prediction' })
  },

  goReminder() {
    wx.navigateTo({ url: '/pages/reminder/reminder' })
  },

  goPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' })
  },

  onModeSwitch(e) {
    const mode = e.detail.value ? 'pregnancy' : 'normal'
    saveSettings({ mode })
    this.refresh()
    getApp().markHomeRefresh()
    wx.showToast({
      title: mode === 'pregnancy' ? '已切换备孕模式' : '已切换常规模式',
      icon: 'none'
    })
  },

  onThemeSelect(e) {
    const key = e.currentTarget.dataset.key
    saveSettings({ theme: key })
    getApp().applyTheme()
    this.refresh()
    const pages = getCurrentPages()
    pages.forEach(p => {
      if (p.refresh) p.refresh()
    })
  },

  onClearData() {
    wx.showModal({
      title: '清除所有数据',
      content: '此操作将彻底删除本地所有记录，且不可恢复。确定继续吗？',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          clearAllData()
          getApp().markHomeRefresh()
          this.refresh()
          wx.showToast({ title: '已清除', icon: 'success' })
        }
      }
    })
  }
})
