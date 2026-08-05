// app.js
App({
  onLaunch() {
    // 小程序启动时执行
    console.log('Todo小程序启动')

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
   * 初始化本地存储，如果没有待办数据则写入示例数据
   */
  initStorage() {
    const todos = wx.getStorageSync('todos')
    if (!todos) {
      const sampleTodos = [
        {
          id: '1',
          title: '欢迎使用待办清单',
          desc: '这是一个示例待办事项，点击左侧圆圈可以标记完成',
          priority: 'high',
          dueDate: '',
          completed: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: '2',
          title: '体验小程序功能',
          desc: '点击右下角加号添加新待办，左滑可以删除',
          priority: 'medium',
          dueDate: '',
          completed: false,
          createdAt: Date.now() - 1000,
          updatedAt: Date.now() - 1000
        },
        {
          id: '3',
          title: '已完成的任务示例',
          desc: '已完成的任务会显示删除线',
          priority: 'low',
          dueDate: '',
          completed: true,
          createdAt: Date.now() - 2000,
          updatedAt: Date.now() - 2000
        }
      ]
      wx.setStorageSync('todos', sampleTodos)
    }
  },

  globalData: {
    userInfo: null
  }
})
