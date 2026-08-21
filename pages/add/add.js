// pages/add/add.js
// 新增/编辑菜谱：兼容个人与团队两种归属
//   - 新增：onLoad 接收 scope（personal/team）与 teamId（团队时）
//   - 编辑：onLoad 接收 id，加载菜谱数据填充表单
// 所有数据库读写走 recipe 云函数（权限在云端校验）
Page({
  data: {
    foodId: '',         // 编辑模式：菜谱 _id；空 = 新增
    isEdit: false,
    scope: 'personal',  // personal 个人菜谱 | team 团队菜谱
    teamId: '',         // 团队菜谱所属团队
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
      wx.setNavigationBarTitle({ title: '编辑菜谱' })
      this.loadFood(options.id)
    } else {
      // 新增模式
      const scope = options.scope === 'team' ? 'team' : 'personal'
      this.setData({ scope, teamId: options.teamId || '' })
      wx.setNavigationBarTitle({ title: scope === 'team' ? '添加团队菜谱' : '添加菜谱' })
    }
  },

  /**
   * 编辑模式：通过 recipe 云函数加载菜谱
   */
  loadFood(id) {
    wx.showLoading({ title: '加载中...' })
    wx.cloud.callFunction({ name: 'recipe', data: { action: 'get', recipeId: id } })
      .then(res => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          const food = res.result.recipe
          this.setData({
            scope: food.scope || 'personal',
            teamId: food.teamId || '',
            name: food.name || '',
            description: food.description || '',
            price: food.price || '',
            imageFileID: food.image || '',
            imageTempPath: food.image || ''  // 编辑模式下预览复用已有 fileID
          })
        } else {
          const msg = (res.result && res.result.error) || '菜谱不存在'
          wx.showToast({ title: msg, icon: 'none' })
          setTimeout(() => wx.navigateBack(), 1200)
        }
      })
      .catch(err => {
        wx.hideLoading()
        console.error('加载菜谱失败', err)
        wx.showToast({ title: '加载失败', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 1200)
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

        this.setData({ imageTempPath: tempFilePath })
      }
    })
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onDescInput(e) {
    this.setData({ description: e.detail.value })
  },

  onPriceInput(e) {
    this.setData({ price: e.detail.value })
  },

  /**
   * 保存：根据模式分流
   */
  onSave() {
    if (this.data.saving) return

    const { name } = this.data
    if (!name.trim()) {
      wx.showToast({ title: '请输入菜谱名称', icon: 'none' })
      return
    }

    if (this.data.isEdit) {
      this.saveEdit()
    } else {
      this.saveAdd()
    }
  },

  /**
   * 新增：图片传云存储 → recipe.create 云函数写库
   */
  saveAdd() {
    const { name, description, price, imageTempPath, scope, teamId } = this.data
    this.setData({ saving: true })
    wx.showLoading({ title: '保存中...' })

    this.uploadImage(imageTempPath)
      .then(fileID => {
        return wx.cloud.callFunction({
          name: 'recipe',
          data: {
            action: 'create',
            scope,
            teamId,
            data: {
              name: name.trim(),
              description: description.trim(),
              price: price.trim(),
              image: fileID || ''
            }
          }
        })
      })
      .then(res => {
        wx.hideLoading()
        this.setData({ saving: false })
        if (res.result && res.result.success) {
          wx.showToast({ title: '添加成功', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 1000)
        } else {
          wx.showToast({ title: (res.result && res.result.error) || '保存失败', icon: 'none' })
        }
      })
      .catch(err => {
        console.error('保存失败', err)
        wx.hideLoading()
        this.setData({ saving: false })
        this.handleSaveError(err)
      })
  },

  /**
   * 编辑：换图则上传新图并删旧图 → recipe.update 云函数
   */
  saveEdit() {
    const { foodId, name, description, price, imageTempPath, imageFileID } = this.data
    const changedImage = !!imageTempPath && imageTempPath !== imageFileID

    const updateData = {
      name: name.trim(),
      description: description.trim(),
      price: price.trim()
    }

    this.setData({ saving: true })
    wx.showLoading({ title: '保存中...' })

    const imageTask = changedImage
      ? this.uploadImage(imageTempPath)
      : Promise.resolve('')

    imageTask
      .then(newFileID => {
        if (newFileID) updateData.image = newFileID
        return wx.cloud.callFunction({
          name: 'recipe',
          data: { action: 'update', recipeId: foodId, data: updateData }
        })
      })
      .then(res => {
        wx.hideLoading()
        this.setData({ saving: false })
        if (res.result && res.result.success) {
          // 换了图且原来有图，删除旧图（失败不阻断）
          if (changedImage && imageFileID) {
            wx.cloud.deleteFile({ fileList: [imageFileID] }).catch(() => {})
          }
          wx.showToast({ title: '修改成功', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 1000)
        } else {
          wx.showToast({ title: (res.result && res.result.error) || '修改失败', icon: 'none' })
        }
      })
      .catch(err => {
        console.error('修改失败', err)
        wx.hideLoading()
        this.setData({ saving: false })
        this.handleSaveError(err)
      })
  },

  /**
   * 保存失败提示（含权限不足引导）
   */
  handleSaveError(err) {
    wx.showToast({ title: '操作失败，请重试', icon: 'none' })
  },

  /**
   * 上传图片到云存储，返回 fileID（无图直接跳过）
   */
  uploadImage(tempFilePath) {
    if (!tempFilePath) return Promise.resolve('')

    const ext = tempFilePath.split('.').pop() || 'jpg'
    const cloudPath = `recipes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    return wx.cloud.uploadFile({
      cloudPath,
      filePath: tempFilePath
    }).then(res => res.fileID)
  }
})
