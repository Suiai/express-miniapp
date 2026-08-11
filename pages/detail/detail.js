// pages/detail/detail.js
const app = getApp()

Page({
  data: {
    food: null,
    ordering: false
  },

  onLoad(options) {
    const { id } = options
    this.loadFoodDetail(id)
  },

  /**
   * 加载菜品详情
   */
  loadFoodDetail(id) {
    const foodList = wx.getStorageSync('foodList') || []
    const food = foodList.find(item => item.id === id)

    if (food) {
      this.setData({ food })
      wx.setNavigationBarTitle({ title: food.name })
    } else {
      wx.showToast({ title: '菜品不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1000)
    }
  },

  /**
   * 确认点餐 → 发送微信通知
   */
  onConfirmOrder() {
    if (this.data.ordering) return
    this.setData({ ordering: true })

    const { name, description, price } = this.data.food
    const templateId = app.globalData.subscribeTemplateId

    // 1. 请求订阅消息授权
    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success: (res) => {
        if (res[templateId] === 'accept') {
          // 用户同意接收通知，调用云函数发送
          this.sendNotification()
        } else {
          this.setData({ ordering: false })
          wx.showToast({
            title: '需要授权才能发送通知',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.log('订阅消息授权失败', err)
        // 授权失败时使用模拟通知
        this.simulateNotification()
      }
    })
  },

  /**
   * 通过云函数发送订阅消息通知
   */
  sendNotification() {
    const { name, description, price } = this.data.food
    const templateId = app.globalData.subscribeTemplateId

    wx.cloud.callFunction({
      name: 'sendOrderNotify',
      data: {
        templateId,
        name,
        description: description || '暂无描述',
        price: price || '0',
        time: this.formatTime(new Date())
      },
      success: (res) => {
        this.setData({ ordering: false })
        if (res.result && res.result.success) {
          wx.showModal({
            title: '点餐成功',
            content: '已为您发送微信通知，请到微信消息中查看',
            showCancel: false,
            confirmText: '知道了'
          })
        } else {
          // 云函数返回失败，使用模拟通知
          this.simulateNotification()
        }
      },
      fail: (err) => {
        console.log('云函数调用失败', err)
        // 云函数未部署，使用模拟通知
        this.simulateNotification()
      }
    })
  },

  /**
   * 模拟通知（云开发未开通时的降级方案）
   */
  simulateNotification() {
    this.setData({ ordering: false })
    const { name } = this.data.food
    wx.showModal({
      title: '点餐成功',
      content: `您已成功点餐：${name}\n\n（温馨提示：当前为模拟通知。如需接收真实微信通知，请在微信开发者工具中开通云开发并部署云函数，详见 README）`,
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#ff6b35'
    })
  },

  /**
   * 格式化时间
   */
  formatTime(date) {
    const y = date.getFullYear()
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    const h = date.getHours().toString().padStart(2, '0')
    const min = date.getMinutes().toString().padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}`
  }
})
