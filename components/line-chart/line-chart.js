Component({
  properties: {
    data: {
      type: Array,
      value: []
    },
    field: {
      type: String,
      value: 'cycleLength'
    },
    title: {
      type: String,
      value: ''
    },
    color: {
      type: String,
      value: '#E85D75'
    }
  },

  data: {
    canvasWidth: 300,
    canvasHeight: 200
  },

  observers: {
    'data, field': function () {
      this.drawChart()
    }
  },

  lifetimes: {
    ready() {
      const sys = wx.getSystemInfoSync()
      const width = sys.windowWidth - 48
      this.setData({
        canvasWidth: width,
        canvasHeight: width * 0.55
      }, () => this.drawChart())
    }
  },

  methods: {
    drawChart() {
      const { data, field, color, canvasWidth, canvasHeight } = this.data
      const props = this.properties
      const points = (props.data || []).filter(d => d[props.field] != null)
      if (!points.length) return

      const ctx = wx.createCanvasContext('lineChart', this)
      const padding = { top: 30, right: 20, bottom: 40, left: 40 }
      const w = canvasWidth
      const h = canvasHeight
      const chartW = w - padding.left - padding.right
      const chartH = h - padding.top - padding.bottom

      const values = points.map(p => p[props.field])
      const minVal = Math.min(...values) - 2
      const maxVal = Math.max(...values) + 2
      const range = maxVal - minVal || 1

      ctx.setFillStyle('#F7F8FA')
      ctx.fillRect(0, 0, w, h)

      ctx.setStrokeStyle('#E5E7EB')
      ctx.setLineWidth(1)
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i
        ctx.beginPath()
        ctx.moveTo(padding.left, y)
        ctx.lineTo(w - padding.right, y)
        ctx.stroke()
      }

      ctx.setStrokeStyle(color)
      ctx.setLineWidth(2)
      ctx.beginPath()

      points.forEach((p, i) => {
        const x = padding.left + (chartW / Math.max(points.length - 1, 1)) * i
        const y = padding.top + chartH - ((p[props.field] - minVal) / range) * chartH
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      ctx.setFillStyle(color)
      points.forEach((p, i) => {
        const x = padding.left + (chartW / Math.max(points.length - 1, 1)) * i
        const y = padding.top + chartH - ((p[props.field] - minVal) / range) * chartH
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
      })

      ctx.setFillStyle('#9CA3AF')
      ctx.setFontSize(10)
      points.forEach((p, i) => {
        const x = padding.left + (chartW / Math.max(points.length - 1, 1)) * i
        const label = p.date ? p.date.slice(5) : ''
        ctx.fillText(label, x - 14, h - 10)
      })

      ctx.draw()
    }
  }
})
