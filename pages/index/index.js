// pages/index/index.js
Page({
  data: {
    foodList: [],
    loading: true,
    dbReady: false
  },

  onShow() {
    // 每次显示页面时刷新列表（从添加页返回后也能看到新数据）
    this.loadFoodList()
  },

  onPullDownRefresh() {
    this.loadFoodList()
  },

  /**
   * 从云数据库加载菜品列表
   */
  loadFoodList() {
    const db = wx.cloud.database()

    db.collection('foods')
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        this.setData({
          foodList: res.data,
          loading: false,
          dbReady: true
        })
        wx.stopPullDownRefresh()
      })
      .catch(err => {
        console.error('加载菜品失败', err)
        this.setData({ loading: false })
        wx.stopPullDownRefresh()
        this.handleLoadError(err)
      })
  },

  /**
   * 分析加载失败原因，给出针对性提示
   */
  handleLoadError(err) {
    const msg = (err && (err.errMsg || err.message)) || ''
    const errCode = err && err.errCode

    // 1. 集合不存在（最常见：未在云开发控制台创建 foods 集合）
    if (msg.includes('collection not exists') || msg.includes('DATABASE_COLLECTION_NOT_EXIST') || errCode === -502005) {
      wx.showModal({
        title: '数据库集合不存在',
        content: '请在云开发控制台 → 数据库 → 新建集合 foods，权限选「所有用户可读，仅创建者可读写」，然后重新进入本页。',
        showCancel: false,
        confirmText: '知道了'
      })
      return
    }

    // 2. 环境不存在 / 未开通云开发
    if (msg.includes('env not exists') || msg.includes('ENV_NOT_FOUND') || errCode === -502001) {
      wx.showModal({
        title: '云环境未配置',
        content: '请确认已开通云开发，并检查 app.js 中的 env 环境ID是否与云开发控制台一致。',
        showCancel: false,
        confirmText: '知道了'
      })
      return
    }

    // 3. 权限不足
    if (msg.includes('permission') || msg.includes('PERMISSION_DENIED') || errCode === -502003) {
      wx.showModal({
        title: '权限不足',
        content: '请将 foods 集合权限设置为「所有用户可读，仅创建者可读写」。',
        showCancel: false,
        confirmText: '知道了'
      })
      return
    }

    // 4. 其他错误
    wx.showModal({
      title: '加载失败',
      content: '请确认：① 云开发已开通；② foods 集合已创建；③ 网络正常。详情见控制台日志。',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /**
   * 点击菜品卡片，跳转到详情页
   */
  onTapFood(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  /**
   * 点击添加按钮，跳转到添加菜品页
   */
  onTapAdd() {
    wx.navigateTo({
      url: '/pages/add/add'
    })
  }
})
