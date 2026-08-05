// pages/index/index.js
const { storage } = require('../../utils/util.js')

Page({
  data: {
    todos: [],
    filter: 'all', // all | active | completed
    stats: {
      total: 0,
      active: 0,
      completed: 0
    },
    startX: 0,
    swipedId: '' // 当前左滑打开的项ID
  },

  onShow() {
    this.loadTodos()
  },

  /**
   * 加载待办列表
   */
  loadTodos() {
    const todos = storage.getAll()
    const stats = {
      total: todos.length,
      active: todos.filter(t => !t.completed).length,
      completed: todos.filter(t => t.completed).length
    }
    this.setData({ todos, stats })
  },

  /**
   * 切换筛选
   */
  onFilterChange(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ filter })
  },

  /**
   * 获取筛选后的列表
   */
  getFilteredTodos() {
    const { todos, filter } = this.data
    if (filter === 'active') return todos.filter(t => !t.completed)
    if (filter === 'completed') return todos.filter(t => t.completed)
    return todos
  },

  /**
   * 切换完成状态
   */
  onToggle(e) {
    const id = e.detail.id
    storage.toggle(id)
    this.loadTodos()
    wx.vibrateShort({ type: 'light' })
  },

  /**
   * 点击查看详情
   */
  onTap(e) {
    const id = e.detail.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  /**
   * 编辑
   */
  onEdit(e) {
    const id = e.detail.id
    wx.navigateTo({
      url: `/pages/edit/edit?id=${id}`
    })
  },

  /**
   * 删除
   */
  onDelete(e) {
    const id = e.detail.id
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除吗？',
      confirmColor: '#FF4D4F',
      success: (res) => {
        if (res.confirm) {
          storage.remove(id)
          this.loadTodos()
          wx.showToast({
            title: '已删除',
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 跳转到新增页面
   */
  onAdd() {
    wx.navigateTo({
      url: '/pages/edit/edit'
    })
  },

  /**
   * 清除已完成
   */
  onClearCompleted() {
    const { stats } = this.data
    if (stats.completed === 0) {
      wx.showToast({
        title: '没有已完成的任务',
        icon: 'none'
      })
      return
    }
    wx.showModal({
      title: '清除已完成',
      content: `将删除 ${stats.completed} 条已完成的任务，确定吗？`,
      confirmColor: '#FF4D4F',
      success: (res) => {
        if (res.confirm) {
          storage.clearCompleted()
          this.loadTodos()
          wx.showToast({
            title: '已清除',
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadTodos()
    wx.stopPullDownRefresh()
  }
})
