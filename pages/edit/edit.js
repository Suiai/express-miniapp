// pages/edit/edit.js
const { storage, formatDate } = require('../../utils/util.js')

Page({
  data: {
    isEdit: false,
    id: '',
    title: '',
    desc: '',
    priority: 'medium',
    dueDate: '',
    showDatePicker: false
  },

  onLoad(options) {
    if (options.id) {
      const todo = storage.getById(options.id)
      if (todo) {
        this.setData({
          isEdit: true,
          id: todo.id,
          title: todo.title,
          desc: todo.desc,
          priority: todo.priority,
          dueDate: todo.dueDate || ''
        })
        wx.setNavigationBarTitle({ title: '编辑待办' })
      }
    } else {
      wx.setNavigationBarTitle({ title: '新增待办' })
    }
  },

  /**
   * 输入标题
   */
  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  /**
   * 输入描述
   */
  onDescInput(e) {
    this.setData({ desc: e.detail.value })
  },

  /**
   * 选择优先级
   */
  onPriorityChange(e) {
    this.setData({ priority: e.currentTarget.dataset.priority })
  },

  /**
   * 选择日期
   */
  onDateChange(e) {
    this.setData({ dueDate: e.detail.value })
  },

  /**
   * 清除日期
   */
  onClearDate() {
    this.setData({ dueDate: '' })
  },

  /**
   * 保存
   */
  onSave() {
    const { title, desc, priority, dueDate, isEdit, id } = this.data

    if (!title.trim()) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      })
      return
    }

    if (isEdit) {
      storage.update(id, { title: title.trim(), desc: desc.trim(), priority, dueDate })
      wx.showToast({
        title: '已保存',
        icon: 'success'
      })
    } else {
      storage.add({ title: title.trim(), desc: desc.trim(), priority, dueDate })
      wx.showToast({
        title: '已添加',
        icon: 'success'
      })
    }

    setTimeout(() => {
      wx.navigateBack()
    }, 800)
  },

  /**
   * 取消
   */
  onCancel() {
    wx.navigateBack()
  }
})
