// pages/add/add.js
// 兼容「新增菜品」与「编辑菜品」两种模式：
//   - 新增：onLoad 无 id 参数
//   - 编辑：onLoad 收到 id 参数，加载菜品数据填充表单，保存时用 update
Page({
  data: {
    foodId: '',         // 编辑模式：菜品 _id；空 = 新增
    isEdit: false,      // 是否编辑模式
    name: '',
    description: '',
    price: '',
    imageTempPath: '',  // 预览用路径：编辑模式初始为云端 fileID，选新图后变为本地临时路径
    imageFileID: '',    // 已上传的云端图片 fileID（用于判断是否更换了图片）
    saving: false
  },

  onLoad(options) {
    if (options.id) {
      // 编辑模式
      this.setData({ foodId: options.id, isEdit: true })
      wx.setNavigationBarTitle({ title: '编辑菜品' })
      this.loadFood(options.id)
    } else {
      // 新增模式
      wx.setNavigationBarTitle({ title: '添加菜品' })
    }
  },

  /**
   * 编辑模式：加载菜品现有数据
   */
  loadFood(id) {
    const db = wx.cloud.database()
    wx.showLoading({ title: '加载中...' })
    db.collection('foods').doc(id).get()
      .then(res => {
        wx.hideLoading()
        const food = res.data
        this.setData({
          name: food.name || '',
          description: food.description || '',
          price: food.price || '',
          imageFileID: food.image || '',
          imageTempPath: food.image || ''  // 编辑模式下预览复用已有 fileID
        })
      })
      .catch(err => {
        wx.hideLoading()
        console.error('加载菜品失败', err)
        wx.showToast({ title: '菜品不存在', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 1000)
      })
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

        // 限制图片大小（2MB 以内）
        if (fileSize > 2 * 1024 * 1024) {
          wx.showToast({ title: '图片不能超过2MB', icon: 'none' })
          return
        }

        // 选择新图后，imageTempPath 变为本地临时路径，与 imageFileID 不同 → 保存时判定为换图
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
   * 保存菜品：根据模式分流
   */
  onSave() {
    if (this.data.saving) return

    const { name, description } = this.data

    // 表单验证
    if (!name.trim()) {
      wx.showToast({ title: '请输入菜品名称', icon: 'none' })
      return
    }
    if (!description.trim()) {
      wx.showToast({ title: '请输入菜品描述', icon: 'none' })
      return
    }

    if (this.data.isEdit) {
      this.saveEdit()
    } else {
      this.saveAdd()
    }
  },

  /**
   * 新增模式：图片传云存储 → 数据写云数据库
   */
  saveAdd() {
    const { name, description, price, imageTempPath } = this.data
    this.setData({ saving: true })
    wx.showLoading({ title: '保存中...' })

    this.uploadImage(imageTempPath)
      .then(fileID => this.addFood({
        name: name.trim(),
        description: description.trim(),
        price: price.trim(),
        image: fileID || ''
      }))
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
        wx.showToast({ title: '保存失败，请检查云开发配置', icon: 'none' })
      })
  },

  /**
   * 编辑模式：换图则上传新图并删旧图 → update 数据库
   */
  saveEdit() {
    const { foodId, name, description, price, imageTempPath, imageFileID } = this.data
    // 是否选择了新的本地图片（与云端 fileID 不同）
    const changedImage = !!imageTempPath && imageTempPath !== imageFileID

    const updateData = {
      name: name.trim(),
      description: description.trim(),
      price: price.trim(),
      updateTime: Date.now()
    }

    this.setData({ saving: true })
    wx.showLoading({ title: '保存中...' })

    // 1. 处理图片：换图则上传新图；不换则不动 image 字段
    const imageTask = changedImage
      ? this.uploadImage(imageTempPath)
      : Promise.resolve('')

    imageTask
      .then(newFileID => {
        if (newFileID) updateData.image = newFileID
        const db = wx.cloud.database()
        return db.collection('foods').doc(foodId).update({ data: updateData })
      })
      .then(() => {
        // 换了图且原来有图，删除旧图（失败不阻断）
        if (changedImage && imageFileID) {
          wx.cloud.deleteFile({ fileList: [imageFileID] }).catch(() => {})
        }
        wx.hideLoading()
        this.setData({ saving: false })
        wx.showToast({ title: '修改成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1000)
      })
      .catch(err => {
        console.error('修改失败', err)
        wx.hideLoading()
        this.setData({ saving: false })
        this.handleSaveError(err, '修改失败')
      })
  },

  /**
   * 统一处理保存/修改失败：权限不足等给针对性提示
   */
  handleSaveError(err, defaultTitle) {
    const msg = (err && (err.errMsg || err.message)) || ''
    const errCode = err && err.errCode
    if (msg.includes('permission') || msg.includes('PERMISSION_DENIED') || errCode === -502003) {
      wx.showModal({
        title: '权限不足',
        content: '只能编辑自己添加的菜品。系统示例菜品请在云开发控制台修改。',
        showCancel: false,
        confirmText: '知道了',
        confirmColor: '#ff6b35'
      })
    } else {
      wx.showToast({ title: `${defaultTitle}，请重试`, icon: 'none' })
    }
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
   * 写入云数据库 foods 集合（新增模式）
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
