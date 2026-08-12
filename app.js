// app.js
App({
  onLaunch() {
    console.log('点餐小程序启动')

    // 初始化云开发（已开通，需在开发者工具中确认云环境）
    if (wx.cloud) {
      try {
        wx.cloud.init({
          // 如需指定环境，填写环境ID：env: 'your-env-id'
          traceUser: true
        })
        console.log('云开发初始化成功')
      } catch (e) {
        console.error('云开发初始化失败', e)
      }
    }
  },

  onShow() {
    console.log('小程序进入前台')
  },

  onHide() {
    console.log('小程序进入后台')
  },

  globalData: {
    userInfo: null,
    // 订阅消息模板ID：在微信公众平台（mp.weixin.qq.com）
    // 功能 → 订阅消息 → 添加模板 获取后替换
    subscribeTemplateId: 'TEMPLATE_ID_REPLACE_ME'
  }
})
