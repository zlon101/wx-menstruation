Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    mode: {
      type: String,
      value: 'sheet'
    }
  },

  methods: {
    onMaskTap() {
      this.triggerEvent('close')
    },

    preventBubble() {},

    onClose() {
      this.triggerEvent('close')
    }
  }
})
