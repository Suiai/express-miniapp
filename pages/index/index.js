// pages/index/index.js
const app = getApp()

Page({
  data: {
    foodList: [],
    loading: true
  },

  onShow() {
    // 每次显示页面时刷新列表（从添加页返回后也能看到新数据）
    this.loadFoodList()
  },

  /**
   * 从本地存储加载菜品列表
   */
  loadFoodList() {
    const foodList = wx.getStorageSync('foodList') || []
    this.setData({
      foodList,
      loading: false
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
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadFoodList()
    wx.stopPullDownRefresh()
  }
})
