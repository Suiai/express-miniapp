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
   * 从云数据库加载菜品详情
   */
  loadFoodDetail(id) {
    const db = wx.cloud.database()

    db.collection('foods')
      .doc(id)
      .get()
      .then(res => {
        const food = res.data
        this.setData({ food })
        wx.setNavigationBarTitle({ title: food.name })
      })
      .catch(err => {
        console.error('加载菜品详情失败', err)
        wx.showToast({ title: '菜品不存在', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 1000)
      })
  },

  /**
   * 确认点餐 → 请求订阅授权 → 云函数发送微信通知
   */
  onConfirmOrder() {
    if (this.data.ordering) return
    this.setData({ ordering: true })

    const templateId = app.globalData.subscribeTemplateId

    // 模板ID未配置时给出指引
    if (!templateId || templateId === 'TEMPLATE_ID_REPLACE_ME') {
      this.setData({ ordering: false })
      wx.showModal({
        title: '通知功能未配置',
        content: '请先在微信公众平台创建订阅消息模板，将模板ID填入 app.js 的 subscribeTemplateId 后重新编译。\n\n（订单仍会记录，只是暂无法发送微信通知）',
        showCancel: false,
        confirmText: '知道了',
        confirmColor: '#ff6b35'
      })
      return
    }

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
        this.setData({ ordering: false })
        wx.showToast({
          title: '授权失败，无法发送通知',
          icon: 'none'
        })
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
            content: '已为您发送微信通知，请到微信服务通知中查看',
            showCancel: false,
            confirmText: '知道了',
            confirmColor: '#ff6b35'
          })
        } else {
          const errMsg = (res.result && res.result.error) || '未知错误'
          wx.showModal({
            title: '通知发送失败',
            content: `${errMsg}\n\n请检查云函数是否已部署、模板字段是否匹配`,
            showCancel: false,
            confirmText: '知道了',
            confirmColor: '#ff6b35'
          })
        }
      },
      fail: (err) => {
        console.error('云函数调用失败', err)
        this.setData({ ordering: false })
        const detail = (err && (err.errMsg || err.message)) || '未知错误'
        wx.showModal({
          title: '通知发送失败',
          content: `${detail}\n\n如报 -501000/未找到云函数，请确认小程序与云函数在同一云环境`,
          showCancel: false,
          confirmText: '知道了',
          confirmColor: '#ff6b35'
        })
      }
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
