const { todayStr } = require('../../utils/date')

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    hasActivePeriod: {
      type: Boolean,
      value: false
    },
    selectedDate: {
      type: String,
      value: ''
    }
  },

  data: {
    recordDate: ''
  },

  observers: {
    visible(val) {
      if (val) {
        this.setData({
          recordDate: this.properties.selectedDate || todayStr()
        })
      }
    }
  },

  methods: {
    onMaskTap() {
      this.triggerEvent('close')
    },

    preventBubble() {},

    onStart() {
      this.triggerEvent('start', { date: this.data.recordDate })
    },

    onEnd() {
      this.triggerEvent('end', { date: this.data.recordDate })
    },

    onClose() {
      this.triggerEvent('close')
    }
  }
})
