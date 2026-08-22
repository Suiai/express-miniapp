// pages/index/index.js
const app = getApp()

Page({
  data: {
    scope: 'personal',      // personal 我的菜谱 | team 团队菜谱
    myOpenid: '',
    teamList: [],           // 我的团队（团队模式用）
    currentTeamId: '',      // 当前选中团队
    foodList: [],
    loading: true
  },

  onLoad() {
    this.ensureUser()
  },

  onShow() {
    this.refresh()
  },

  onPullDownRefresh() {
    this.refresh()
  },

  /**
   * 确保用户已注册并拿到 openid（user 云函数）
   */
  ensureUser() {
    if (app.globalData.myOpenid) {
      this.setData({ myOpenid: app.globalData.myOpenid })
      return Promise.resolve()
    }
    // 复用进行中的请求，避免重复注册
    if (this._userPromise) return this._userPromise
    this._userPromise = wx.cloud.callFunction({ name: 'user', data: { action: 'get' } })
      .then(res => {
        if (res.result && res.result.success) {
          app.globalData.myOpenid = res.result.user.openid
          app.globalData.myUser = res.result.user
          this.setData({ myOpenid: res.result.user.openid })
        }
      })
      .catch(err => console.error('获取用户失败', err))
      .finally(() => { this._userPromise = null })
    return this._userPromise
  },

  /**
   * 刷新：确保用户 → 加载团队（团队模式）→ 加载菜谱
   */
  refresh() {
    this.ensureUser().then(() => {
      this.loadTeams().then(() => this.loadFoodList())
    })
  },

  /**
   * 加载我的团队列表（仅团队模式需要）
   */
  loadTeams() {
    if (this.data.scope !== 'team') return Promise.resolve()
    return wx.cloud.callFunction({ name: 'team', data: { action: 'listMyTeams' } })
      .then(res => {
        if (res.result && res.result.success) {
          const list = res.result.list || []
          let currentTeamId = this.data.currentTeamId
          // 当前团队已失效（被解散/退出）时回退到第一个
          if (!list.some(t => t._id === currentTeamId)) {
            currentTeamId = list.length ? list[0]._id : ''
          }
          this.setData({ teamList: list, currentTeamId })
        }
      })
      .catch(err => console.error('加载团队失败', err))
  },

  /**
   * 加载菜谱列表（走 recipe 云函数，前端无数据库权限）
   */
  loadFoodList() {
    const { scope, currentTeamId } = this.data
    wx.cloud.callFunction({
      name: 'recipe',
      data: { action: 'list', scope, teamId: currentTeamId }
    }).then(res => {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
      if (res.result && res.result.success) {
        this.setData({ foodList: res.result.list || [] })
      } else {
        const msg = (res.result && res.result.error) || '加载失败'
        wx.showToast({ title: msg, icon: 'none' })
      }
    }).catch(err => {
      console.error('加载菜谱失败', err)
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
      this.handleLoadError(err)
    })
  },

  /**
   * 分析加载失败原因
   */
  handleLoadError(err) {
    const msg = (err && (err.errMsg || err.message)) || ''
    if (msg.includes('FunctionName') || msg.includes('FUNCTION_NOT_FOUND') || msg.includes('-501000')) {
      wx.showModal({
        title: '云函数未部署',
        content: '请先部署 user/recipe/team 云函数（右键云函数目录 → 上传并部署：云端安装依赖）。云函数首次调用会自动建集合，但仍建议运行一次 initDB 完成旧数据迁移。',
        showCancel: false,
        confirmText: '知道了'
      })
      return
    }
    wx.showModal({
      title: '加载失败',
      content: '请确认：① 云开发已开通；② 云函数已部署为最新代码；③ 重新编译后重试。详情见控制台日志。',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /**
   * 切换 我的菜谱 / 团队菜谱
   */
  onSwitchScope(e) {
    const scope = e.currentTarget.dataset.scope
    if (scope === this.data.scope) return
    this.setData({ scope, foodList: [], loading: true })
    this.refresh()
  },

  /**
   * 切换团队
   */
  onSelectTeam(e) {
    const id = e.currentTarget.dataset.id
    if (id === this.data.currentTeamId) return
    this.setData({ currentTeamId: id, foodList: [], loading: true })
    this.loadFoodList()
  },

  /**
   * 进入团队管理页
   */
  onManageTeam() {
    wx.navigateTo({ url: '/pages/team/team' })
  },

  /**
   * 点击菜谱卡片 → 详情
   */
  onTapFood(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  /**
   * 添加菜谱（个人 → 直接添加；团队 → 加入当前团队）
   */
  onTapAdd() {
    const { scope, currentTeamId } = this.data
    if (scope === 'team') {
      if (!currentTeamId) {
        wx.showToast({ title: '请先创建或加入团队', icon: 'none' })
        return
      }
      wx.navigateTo({ url: `/pages/add/add?scope=team&teamId=${currentTeamId}` })
    } else {
      wx.navigateTo({ url: '/pages/add/add?scope=personal' })
    }
  }
})
