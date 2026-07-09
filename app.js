const { getSettings, getThemeVars } = require('./utils/storage')
const { initPrivacyAuthorization } = require('./utils/privacy')

App({
  globalData: {
    themeVars: null,
    refreshHome: false
  },

  onLaunch() {
    this.applyTheme()
    initPrivacyAuthorization()
    this.checkPrivacyOnLaunch()
  },

  applyTheme() {
    const settings = getSettings()
    const themeVars = getThemeVars(settings.theme)
    this.globalData.themeVars = themeVars
  },

  checkPrivacyOnLaunch() {
    const settings = getSettings()
    if (!settings.privacyAccepted) {
      wx.navigateTo({ url: '/pages/privacy/privacy?firstLaunch=1' })
    }
  },

  markHomeRefresh() {
    this.globalData.refreshHome = true
  }
})
