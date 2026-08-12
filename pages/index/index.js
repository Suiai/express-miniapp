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
        wx.showToast({
          title: '加载失败，请确认云开发已开通',
          icon: 'none'
        })
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
