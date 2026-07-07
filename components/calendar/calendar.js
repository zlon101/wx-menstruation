const { getMonthDays, getWeekday, formatDate, getMonthsRange, todayStr } = require('../../utils/date')

Component({
  properties: {
    marks: {
      type: Object,
      value: {}
    },
    year: {
      type: Number,
      value: new Date().getFullYear()
    },
    month: {
      type: Number,
      value: new Date().getMonth()
    },
    mode: {
      type: String,
      value: 'normal'
    },
    selectedDate: {
      type: String,
      value: ''
    }
  },

  data: {
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    weeks: [],
    swiperIndex: 1,
    monthPanels: [],
    headerLabel: '',
    isOnToday: true
  },

  observers: {
    'year, month, marks, mode': function () {
      this.updateHeader()
      this.buildCalendar()
    },
    selectedDate: function () {
      this.updateHeader()
    }
  },

  lifetimes: {
    attached() {
      this.updateHeader()
      this.buildCalendar()
    }
  },

  methods: {
    updateHeader() {
      const { year, month } = this.properties
      const today = new Date()
      const isOnToday =
        year === today.getFullYear() &&
        month === today.getMonth() &&
        this.properties.selectedDate === todayStr()
      this.setData({
        headerLabel: `${year}年${month + 1}月`,
        isOnToday
      })
    },

    buildCalendar() {
      const { year, month } = this.properties
      const panels = getMonthsRange(year, month, 3)
      const monthPanels = panels.map(p => this.buildMonth(p.year, p.month))
      this.setData({ monthPanels, swiperIndex: 1 })
    },

    buildMonth(year, month) {
      const daysInMonth = getMonthDays(year, month)
      const firstWeekday = getWeekday(year, month, 1)
      const days = []

      for (let i = 0; i < firstWeekday; i++) {
        days.push({ empty: true })
      }

      const today = formatDate(new Date())
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = formatDate(new Date(year, month, d))
        const mark = this.properties.marks[dateStr] || null
        let markClass = ''
        if (mark) {
          if (mark.type === 'period') {
            markClass = mark.isPredicted ? 'predict-period' : 'real-period'
          } else if (mark.type === 'ovulation') {
            markClass = this.properties.mode === 'pregnancy' ? 'ovulation' : 'ovulation-dim'
          } else if (mark.type === 'fertile') {
            markClass = this.properties.mode === 'pregnancy' ? 'fertile' : 'fertile-dim'
          }
        }
        days.push({
          day: d,
          dateStr,
          isToday: dateStr === today,
          isSelected: dateStr === this.properties.selectedDate,
          mark,
          markClass,
          empty: false
        })
      }

      return {
        year,
        month,
        label: `${year}年${month + 1}月`,
        days
      }
    },

    onSwiperChange(e) {
      const index = e.detail.current
      const source = e.detail.source
      const panel = this.data.monthPanels[index]
      if (!panel) return

      // 忽略程序重置 swiperIndex 触发的 change（buildCalendar 会设回 1）
      if (index === 1 || source === '') return

      const targetYear = panel.year
      const targetMonth = panel.month

      this.triggerEvent('monthchange', { year: targetYear, month: targetMonth })
    },

    onDayTap(e) {
      const dateStr = e.currentTarget.dataset.date
      if (!dateStr) return
      this.triggerEvent('daytap', { date: dateStr })
    },

    onGoToday() {
      const today = new Date()
      this.triggerEvent('gotoday', {
        year: today.getFullYear(),
        month: today.getMonth(),
        date: todayStr()
      })
    }
  }
})
