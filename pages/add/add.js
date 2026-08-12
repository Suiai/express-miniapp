// pages/add/add.js
Page({
  data: {
    name: '',
    description: '',
    price: '',
    imageTempPath: '',  // 本地临时路径（预览用）
    saving: false
  },

  /**
   * 选择照片
   */
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        const fileSize = res.tempFiles[0].size

        // 限制图片大小（2MB以内）
        if (fileSize > 2 * 1024 * 1024) {
          wx.showToast({
            title: '图片不能超过2MB',
            icon: 'none'
          })
          return
        }

        this.setData({ imageTempPath: tempFilePath })
      }
    })
  },

  /**
   * 输入菜品名称
   */
  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  /**
   * 输入菜品描述
   */
  onDescInput(e) {
    this.setData({ description: e.detail.value })
  },

  /**
   * 输入价格
   */
  onPriceInput(e) {
    this.setData({ price: e.detail.value })
  },

  /**
   * 保存菜品：图片传云存储，数据写云数据库
   */
  onSave() {
    if (this.data.saving) return

    const { name, description, price, imageTempPath } = this.data

    // 表单验证
    if (!name.trim()) {
      wx.showToast({ title: '请输入菜品名称', icon: 'none' })
      return
    }
    if (!description.trim()) {
      wx.showToast({ title: '请输入菜品描述', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    wx.showLoading({ title: '保存中...' })

    // 先上传图片（如有），再写入数据库
    this.uploadImage(imageTempPath)
      .then(fileID => {
        return this.addFood({
          name: name.trim(),
          description: description.trim(),
          price: price.trim(),
          image: fileID || ''
        })
      })
      .then(() => {
        wx.hideLoading()
        this.setData({ saving: false })
        wx.showToast({ title: '添加成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1000)
      })
      .catch(err => {
        console.error('保存失败', err)
        wx.hideLoading()
        this.setData({ saving: false })
        wx.showToast({
          title: '保存失败，请检查云开发配置',
          icon: 'none'
        })
      })
  },

  /**
   * 上传图片到云存储，返回 fileID（无图直接跳过）
   */
  uploadImage(tempFilePath) {
    if (!tempFilePath) return Promise.resolve('')

    const ext = tempFilePath.split('.').pop() || 'jpg'
    const cloudPath = `foods/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    return wx.cloud.uploadFile({
      cloudPath,
      filePath: tempFilePath
    }).then(res => res.fileID)
  },

  /**
   * 写入云数据库 foods 集合
   */
  addFood(food) {
    const db = wx.cloud.database()
    return db.collection('foods').add({
      data: {
        ...food,
        createTime: Date.now()
      }
    })
  }
})
