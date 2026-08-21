// app.js
App({
  onLaunch() {
    console.log('私人菜谱小程序启动')

    // 初始化云开发（已开通，需在开发者工具中确认云环境）
    if (wx.cloud) {
      try {
        wx.cloud.init({
          // DYNAMIC_CURRENT_ENV：自动使用当前小程序关联的云环境
          // 若仍失败，可替换为控制台的环境ID，如 env: 'cloud1-xxxxxx'
          env: wx.cloud.DYNAMIC_CURRENT_ENV,
          traceUser: true
        })
        console.log('云开发初始化成功')
      } catch (e) {
        console.error('云开发初始化失败', e)
      }
    } else {
      console.error('当前基础库不支持云开发，请升级微信开发者工具')
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
    // 当前用户（openid 等，由 user 云函数注册后缓存）
    myOpenid: '',
    myUser: null,
    // 订阅消息模板ID：在微信公众平台（mp.weixin.qq.com）
    // 功能 → 订阅消息 → 添加模板 获取后替换
    subscribeTemplateId: 'C95Rasr4Ky0Gmu-FJRaBzYFHYC25Av_glLmegPTzGcc'
  }
})
