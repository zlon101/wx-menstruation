const { getThemeStyle, getSettings } = require('../../utils/storage')

Page({
  data: {
    themeStyle: ''
  },

  onLoad() {
    const settings = getSettings()
    this.setData({ themeStyle: getThemeStyle(settings.theme) })
  }
})
