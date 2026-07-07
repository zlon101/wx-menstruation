const { sortPeriods } = require('./cycle')
const { diffDays } = require('./date')

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function buildExportPayload(periods) {
  return {
    app: 'qingqi',
    version: 1,
    exportedAt: new Date().toISOString(),
    periods: sortPeriods(periods).map(p => ({
      id: p.id,
      startDate: p.startDate,
      endDate: p.endDate || null
    }))
  }
}

function normalizePeriod(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (!raw.startDate || !DATE_RE.test(raw.startDate)) return null
  if (raw.endDate != null) {
    if (!DATE_RE.test(raw.endDate)) return null
    if (diffDays(raw.endDate, raw.startDate) < 0) return null
  }
  return {
    id: raw.id ? String(raw.id) : Date.now().toString() + Math.random().toString(36).slice(2, 8),
    startDate: raw.startDate,
    endDate: raw.endDate || null
  }
}

function validateImportData(raw) {
  let data = raw
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw)
    } catch (e) {
      return { success: false, message: '文件格式无效，请确认是轻期导出的 JSON 文件' }
    }
  }
  if (!data || typeof data !== 'object') {
    return { success: false, message: '文件内容无效' }
  }
  const list = data.periods
  if (!Array.isArray(list)) {
    return { success: false, message: '文件中缺少 periods 记录列表' }
  }
  if (list.length === 0) {
    return { success: false, message: '文件中没有可导入的记录' }
  }

  const periods = []
  for (let i = 0; i < list.length; i++) {
    const p = normalizePeriod(list[i])
    if (!p) {
      return { success: false, message: `第 ${i + 1} 条记录格式不正确` }
    }
    periods.push(p)
  }

  return { success: true, periods: sortPeriods(periods) }
}

function pickBetterPeriod(a, b) {
  if (a.endDate && !b.endDate) return a
  if (!a.endDate && b.endDate) return b
  if (a.endDate && b.endDate) {
    const lenA = diffDays(a.endDate, a.startDate)
    const lenB = diffDays(b.endDate, b.startDate)
    return lenA >= lenB ? a : b
  }
  return a
}

function mergePeriods(existing, imported) {
  const map = new Map()
  sortPeriods(existing).forEach(p => map.set(p.startDate, { ...p }))
  sortPeriods(imported).forEach(p => {
    const prev = map.get(p.startDate)
    map.set(p.startDate, prev ? pickBetterPeriod(prev, p) : { ...p })
  })

  let merged = sortPeriods(Array.from(map.values()))
  const active = merged.filter(p => !p.endDate)
  if (active.length > 1) {
    const keep = active[active.length - 1]
    merged = merged.map(p => {
      if (!p.endDate && p.startDate !== keep.startDate) {
        return { ...p, endDate: p.startDate }
      }
      return p
    })
  }
  return sortPeriods(merged)
}

function getExportFileName() {
  const d = new Date()
  const pad = n => (n < 10 ? '0' + n : '' + n)
  const dateStr = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  return `qingqi_records_${dateStr}.json`
}

function exportPeriodsToFile(periods) {
  return new Promise((resolve, reject) => {
    const payload = buildExportPayload(periods)
    const content = JSON.stringify(payload, null, 2)
    const fileName = getExportFileName()
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
    const fs = wx.getFileSystemManager()

    fs.writeFile({
      filePath,
      data: content,
      encoding: 'utf8',
      success: () => {
        wx.shareFileMessage({
          filePath,
          fileName,
          success: () => resolve({ fileName }),
          fail: (err) => {
            if (err && err.errMsg && err.errMsg.indexOf('cancel') !== -1) {
              resolve({ fileName, cancelled: true })
            } else {
              reject(new Error('分享文件失败，请重试'))
            }
          }
        })
      },
      fail: () => reject(new Error('生成备份文件失败'))
    })
  })
}

function importPeriodsFromFile() {
  return new Promise((resolve, reject) => {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file || !file.path) {
          reject(new Error('未选择文件'))
          return
        }
        const fs = wx.getFileSystemManager()
        fs.readFile({
          filePath: file.path,
          encoding: 'utf8',
          success: (readRes) => {
            const result = validateImportData(readRes.data)
            if (!result.success) {
              reject(new Error(result.message))
            } else {
              resolve(result.periods)
            }
          },
          fail: () => reject(new Error('读取文件失败'))
        })
      },
      fail: (err) => {
        if (err && err.errMsg && err.errMsg.indexOf('cancel') !== -1) {
          resolve(null)
        } else {
          reject(new Error('选择文件失败'))
        }
      }
    })
  })
}

module.exports = {
  buildExportPayload,
  validateImportData,
  mergePeriods,
  exportPeriodsToFile,
  importPeriodsFromFile
}
