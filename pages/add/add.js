// pages/add/add.js
Page({
  data: {
    name: '',
    description: '',
    price: '',
    image: '',        // base64 图片数据
    imageTempPath: ''  // 临时路径（预览用）
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

        // 读取为 base64 用于持久化存储
        try {
          const fs = wx.getFileSystemManager()
          const base64 = fs.readFileSync(tempFilePath, 'base64')
          this.setData({
            image: `data:image/jpeg;base64,${base64}`,
            imageTempPath: tempFilePath
          })
        } catch (e) {
          // 读取失败则仅使用临时路径
          this.setData({
            image: '',
            imageTempPath: tempFilePath
          })
        }
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
   * 保存菜品
   */
  onSave() {
    const { name, description, price, image } = this.data

    // 表单验证
    if (!name.trim()) {
      wx.showToast({ title: '请输入菜品名称', icon: 'none' })
      return
    }
    if (!description.trim()) {
      wx.showToast({ title: '请输入菜品描述', icon: 'none' })
      return
    }

    // 从本地存储读取已有列表
    const foodList = wx.getStorageSync('foodList') || []

    // 创建新菜品
    const newFood = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      price: price.trim(),
      image: image,
      createTime: Date.now()
    }

    // 添加到列表头部
    foodList.unshift(newFood)

    // 保存到本地存储
    wx.setStorageSync('foodList', foodList)

    wx.showToast({
      title: '添加成功',
      icon: 'success'
    })

    // 延迟返回上一页
    setTimeout(() => {
      wx.navigateBack()
    }, 1000)
  }
})
