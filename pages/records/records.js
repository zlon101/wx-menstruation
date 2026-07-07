const {
  getPeriods,
  getSettings,
  savePeriods,
  getThemeStyle
} = require('../../utils/storage')
const {
  sortPeriods,
  startPeriod,
  endPeriod,
  deletePeriod,
  getActivePeriod
} = require('../../utils/cycle')
const {
  exportPeriodsToFile,
  importPeriodsFromFile,
  mergePeriods
} = require('../../utils/data-transfer')
const { todayStr, diffDays } = require('../../utils/date')
const { syncCalendarsAfterPeriodStart } = require('../../utils/calendar-reminder')

Page({
  data: {
    themeStyle: '',
    records: [],
    hasActivePeriod: false,
    showRecordSheet: false,
    selectedDate: todayStr()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
    this.refresh()
  },

  refresh() {
    const periods = getPeriods()
    const settings = getSettings()
    const sorted = sortPeriods(periods).reverse()
    const records = sorted.map(p => {
      const duration = p.endDate
        ? diffDays(p.endDate, p.startDate) + 1
        : null
      return {
        ...p,
        duration,
        statusText: p.endDate ? `持续 ${duration} 天` : '进行中'
      }
    })

    this.setData({
      themeStyle: getThemeStyle(settings.theme),
      records,
      hasActivePeriod: !!getActivePeriod(periods)
    })
  },

  onAddTap() {
    this.setData({ showRecordSheet: true, selectedDate: todayStr() })
  },

  onRecordClose() {
    this.setData({ showRecordSheet: false })
  },

  onPeriodStart(e) {
    const date = e.detail.date || todayStr()
    const periods = getPeriods()
    const result = startPeriod(periods, date)
    if (!result.success) {
      wx.showToast({ title: result.message, icon: 'none' })
      return
    }
    savePeriods(result.periods)
    syncCalendarsAfterPeriodStart(result.periods, getSettings())
    this.setData({ showRecordSheet: false })
    wx.showToast({ title: '已记录', icon: 'success' })
    this.refresh()
    getApp().markHomeRefresh()
  },

  onPeriodEnd(e) {
    const date = e.detail.date || todayStr()
    const periods = getPeriods()
    const result = endPeriod(periods, date)
    if (!result.success) {
      wx.showToast({ title: result.message, icon: 'none' })
      return
    }
    savePeriods(result.periods)
    this.setData({ showRecordSheet: false })
    wx.showToast({ title: '已记录', icon: 'success' })
    this.refresh()
    getApp().markHomeRefresh()
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除记录',
      content: '确定删除这条经期记录吗？',
      success: (res) => {
        if (res.confirm) {
          const periods = deletePeriod(getPeriods(), id)
          savePeriods(periods)
          this.refresh()
          getApp().markHomeRefresh()
        }
      }
    })
  },

  onExport() {
    const periods = getPeriods()
    if (!periods.length) {
      wx.showToast({ title: '暂无记录可导出', icon: 'none' })
      return
    }
    exportPeriodsToFile(periods)
      .then((res) => {
        if (res.cancelled) return
        wx.showToast({ title: '已生成备份文件', icon: 'success' })
      })
      .catch((err) => {
        wx.showToast({ title: err.message || '导出失败', icon: 'none' })
      })
  },

  onImport() {
    importPeriodsFromFile()
      .then((imported) => {
        if (!imported) return
        this.showImportOptions(imported)
      })
      .catch((err) => {
        wx.showToast({ title: err.message || '导入失败', icon: 'none' })
      })
  },

  showImportOptions(imported) {
    wx.showActionSheet({
      itemList: ['合并导入', '覆盖导入'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.applyMergeImport(imported)
        } else if (res.tapIndex === 1) {
          this.applyReplaceImport(imported)
        }
      }
    })
  },

  applyMergeImport(imported) {
    const existing = getPeriods()
    const merged = mergePeriods(existing, imported)
    savePeriods(merged)
    this.refresh()
    getApp().markHomeRefresh()
    wx.showToast({ title: `已合并，共 ${merged.length} 条记录`, icon: 'success' })
  },

  applyReplaceImport(imported) {
    const existing = getPeriods()
    wx.showModal({
      title: '覆盖导入',
      content: `将清空现有 ${existing.length} 条记录，替换为 ${imported.length} 条导入记录，确定继续吗？`,
      confirmColor: '#E85D75',
      success: (res) => {
        if (res.confirm) {
          savePeriods(imported)
          this.refresh()
          getApp().markHomeRefresh()
          wx.showToast({ title: `已导入 ${imported.length} 条记录`, icon: 'success' })
        }
      }
    })
  }
})
