Component({
  properties: {
    title: String,
    subtitle: String,
    showInfo: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    onInfoTap() {
      this.triggerEvent('infotap')
    }
  }
})
