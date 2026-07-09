const PRIVACY_AGREE_BTN_ID = 'privacy-agree-btn'

let pendingResolve = null
const listeners = []

function notifyListeners(show, eventInfo) {
  listeners.forEach((fn) => fn(show, eventInfo))
}

function initPrivacyAuthorization() {
  if (typeof wx.onNeedPrivacyAuthorization !== 'function') {
    return
  }

  wx.onNeedPrivacyAuthorization((resolve, eventInfo) => {
    pendingResolve = resolve
    notifyListeners(true, eventInfo)
  })
}

function subscribePrivacyPopup(callback) {
  listeners.push(callback)
  return () => {
    const index = listeners.indexOf(callback)
    if (index !== -1) {
      listeners.splice(index, 1)
    }
  }
}

function agreePrivacyAuthorization() {
  if (!pendingResolve) {
    return
  }
  pendingResolve({ buttonId: PRIVACY_AGREE_BTN_ID, event: 'agree' })
  pendingResolve = null
  notifyListeners(false)
}

function disagreePrivacyAuthorization() {
  if (!pendingResolve) {
    return
  }
  pendingResolve({ event: 'disagree' })
  pendingResolve = null
  notifyListeners(false)
}

function getPrivacyContractName() {
  return new Promise((resolve) => {
    if (typeof wx.getPrivacySetting !== 'function') {
      resolve('《用户隐私保护指引》')
      return
    }
    wx.getPrivacySetting({
      success: (res) => {
        resolve(res.privacyContractName || '《用户隐私保护指引》')
      },
      fail: () => resolve('《用户隐私保护指引》')
    })
  })
}

function openPrivacyContract() {
  if (typeof wx.openPrivacyContract === 'function') {
    wx.openPrivacyContract()
  }
}

module.exports = {
  PRIVACY_AGREE_BTN_ID,
  initPrivacyAuthorization,
  subscribePrivacyPopup,
  agreePrivacyAuthorization,
  disagreePrivacyAuthorization,
  getPrivacyContractName,
  openPrivacyContract
}
