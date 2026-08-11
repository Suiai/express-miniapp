// app.js
App({
  onLaunch() {
    console.log('点餐小程序启动')

    // 初始化云开发（如未开通云开发会静默失败，不影响基础功能）
    if (wx.cloud) {
      try {
        wx.cloud.init({
          traceUser: true
        })
        console.log('云开发初始化成功')
      } catch (e) {
        console.log('云开发未开通，通知功能将使用模拟模式')
      }
    }

    // 初始化本地存储
    this.initStorage()
  },

  onShow() {
    console.log('小程序进入前台')
  },

  onHide() {
    console.log('小程序进入后台')
  },

  /**
   * 初始化本地存储，写入示例菜品数据
   */
  initStorage() {
    const foodList = wx.getStorageSync('foodList')
    if (!foodList) {
      const sampleFoods = [
        {
          id: '1',
          name: '宫保鸡丁',
          description: '经典川菜，鸡丁嫩滑，花生酥脆，微辣鲜香',
          image: '',
          price: '28',
          createTime: Date.now()
        },
        {
          id: '2',
          name: '番茄炒蛋',
          description: '家常下饭菜，酸甜可口，蛋香浓郁',
          image: '',
          price: '18',
          createTime: Date.now() - 1000
        },
        {
          id: '3',
          name: '红烧肉',
          description: '肥而不腻，入口即化，酱香四溢',
          image: '',
          price: '38',
          createTime: Date.now() - 2000
        }
      ]
      wx.setStorageSync('foodList', sampleFoods)
    }
  },

  globalData: {
    userInfo: null,
    // 订阅消息模板ID，需在微信公众平台配置后替换
    // 获取路径：mp.weixin.qq.com → 功能 → 订阅消息 → 添加模板
    subscribeTemplateId: 'TEMPLATE_ID_REPLACE_ME'
  }
})
