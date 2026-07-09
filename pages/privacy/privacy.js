const { getSettings, saveSettings, getThemeStyle } = require('../../utils/storage')
const { getPrivacyContractName, openPrivacyContract } = require('../../utils/privacy')

Page({
  data: {
    themeStyle: '',
    isFirstLaunch: false,
    privacyContractName: '《用户隐私保护指引》',
    showPrivacyContractLink: false
  },

  onLoad(options) {
    const settings = getSettings()
    this.setData({
      themeStyle: getThemeStyle(settings.theme),
      isFirstLaunch: options.firstLaunch === '1',
      showPrivacyContractLink: typeof wx.openPrivacyContract === 'function'
    })
    getPrivacyContractName().then((name) => {
      this.setData({ privacyContractName: name })
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
  },

  onOpenPrivacyContract() {
    openPrivacyContract()
  }
})
