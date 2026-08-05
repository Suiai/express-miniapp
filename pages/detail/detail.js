// pages/detail/detail.js
const { storage, formatDate, timeAgo, isOverdue, getPriorityInfo } = require('../../utils/util.js')

Page({
  data: {
    todo: null,
    priorityText: '',
    priorityClass: '',
    createdTime: '',
    updatedTime: '',
    overdue: false
  },

  onLoad(options) {
    if (options.id) {
      this.loadTodo(options.id)
    }
  },

  onShow() {
    if (this.data.todo) {
      this.loadTodo(this.data.todo.id)
    }
  },

  loadTodo(id) {
    const todo = storage.getById(id)
    if (!todo) {
      wx.showToast({
        title: '待办不存在',
        icon: 'none'
      })
      setTimeout(() => wx.navigateBack(), 1000)
      return
    }

    const info = getPriorityInfo(todo.priority)
    this.setData({
      todo,
      priorityText: info.text,
      priorityClass: 'priority-' + todo.priority,
      createdTime: formatDate(todo.createdAt, 'yyyy-MM-dd HH:mm'),
      updatedTime: formatDate(todo.updatedAt, 'yyyy-MM-dd HH:mm'),
      overdue: isOverdue(todo.dueDate) && !todo.completed
    })
  },

  /**
   * 切换完成状态
   */
  onToggle() {
    const updated = storage.toggle(this.data.todo.id)
    if (updated) {
      this.loadTodo(this.data.todo.id)
      wx.vibrateShort({ type: 'light' })
    }
  },

  /**
   * 编辑
   */
  onEdit() {
    wx.navigateTo({
      url: `/pages/edit/edit?id=${this.data.todo.id}`
    })
  },

  /**
   * 删除
   */
  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除吗？',
      confirmColor: '#FF4D4F',
      success: (res) => {
        if (res.confirm) {
          storage.remove(this.data.todo.id)
          wx.showToast({
            title: '已删除',
            icon: 'success'
          })
          setTimeout(() => wx.navigateBack(), 800)
        }
      }
    })
  }
})
