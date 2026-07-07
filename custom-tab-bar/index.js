Component({
  data: {
    selected: 0,
    safeBottom: 0,
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: '🏠' },
      { pagePath: '/pages/records/records', text: '记录', icon: '📝' },
      { pagePath: '/pages/stats/stats', text: '统计', icon: '📊' },
      { pagePath: '/pages/mine/mine', text: '我的', icon: '👤' }
    ]
  },

  lifetimes: {
    attached() {
      const sys = wx.getSystemInfoSync()
      this.setData({ safeBottom: sys.safeAreaInsets ? sys.safeAreaInsets.bottom : 0 })
    }
  },

  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index
      const path = this.data.list[index].pagePath
      wx.switchTab({ url: path })
      this.setData({ selected: index })
    }
  }
})
