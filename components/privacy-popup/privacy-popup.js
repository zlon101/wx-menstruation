const {
  PRIVACY_AGREE_BTN_ID,
  subscribePrivacyPopup,
  agreePrivacyAuthorization,
  disagreePrivacyAuthorization,
  getPrivacyContractName,
  openPrivacyContract
} = require('../../utils/privacy')

Component({
  data: {
    visible: false,
    privacyContractName: '《用户隐私保护指引》',
    agreeBtnId: PRIVACY_AGREE_BTN_ID
  },

  lifetimes: {
    attached() {
      this._unsubscribe = subscribePrivacyPopup((show) => {
        if (show) {
          getPrivacyContractName().then((name) => {
            this.setData({
              visible: true,
              privacyContractName: name
            })
          })
        } else {
          this.setData({ visible: false })
        }
      })
    },

    detached() {
      if (this._unsubscribe) {
        this._unsubscribe()
      }
    }
  },

  methods: {
    onAgree() {
      agreePrivacyAuthorization()
      this.setData({ visible: false })
    },

    onDisagree() {
      disagreePrivacyAuthorization()
      this.setData({ visible: false })
    },

    onOpenPrivacyContract() {
      openPrivacyContract()
    },

    preventBubble() {}
  }
})
