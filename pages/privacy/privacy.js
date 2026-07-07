const { getSettings, saveSettings, getThemeStyle } = require('../../utils/storage')

Page({
  data: {
    themeStyle: '',
    isFirstLaunch: false
  },

  onLoad(options) {
    const settings = getSettings()
    this.setData({
      themeStyle: getThemeStyle(settings.theme),
      isFirstLaunch: options.firstLaunch === '1'
    })
  },

  onAccept() {
    saveSettings({ privacyAccepted: true })
    if (this.data.isFirstLaunch) {
      wx.switchTab({ url: '/pages/index/index' })
    } else {
      wx.navigateBack()
    }
  },

  onDecline() {
    if (this.data.isFirstLaunch) {
      wx.showModal({
        title: '提示',
        content: '不同意隐私政策将无法使用本小程序',
        showCancel: false
      })
    } else {
      wx.navigateBack()
    }
  }
})
