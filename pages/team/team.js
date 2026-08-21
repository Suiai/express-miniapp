// pages/team/team.js
// 团队管理页：用户信息、创建团队、邀请码加入、团队列表与成员管理
const app = getApp()

Page({
  data: {
    user: null,
    myOpenid: '',
    teamList: [],
    expandedTeamId: '',   // 展开详情的团队
    detailTeam: null      // 展开的团队详情 { team, members, myRole }
  },

  onShow() {
    this.loadAll()
  },

  /**
   * 加载用户 + 团队列表
   */
  loadAll() {
    const ensure = app.globalData.myUser
      ? Promise.resolve(app.globalData.myUser)
      : wx.cloud.callFunction({ name: 'user', data: { action: 'get' } })
          .then(res => (res.result && res.result.success) ? res.result.user : null)

    ensure.then(user => {
      if (user) {
        app.globalData.myUser = user
        app.globalData.myOpenid = user.openid
        this.setData({ user, myOpenid: user.openid })
      }
      return this.loadTeams()
    })
  },

  /**
   * 加载我的团队列表
   */
  loadTeams() {
    return wx.cloud.callFunction({ name: 'team', data: { action: 'listMyTeams' } })
      .then(res => {
        if (res.result && res.result.success) {
          this.setData({ teamList: res.result.list || [] })
          // 若展开的团队仍在列表中，静默刷新详情
          if (this.data.expandedTeamId &&
              (res.result.list || []).some(t => t._id === this.data.expandedTeamId)) {
            this.loadTeamDetail(this.data.expandedTeamId, true)
          }
        }
      })
      .catch(err => console.error('加载团队失败', err))
  },

  /**
   * 创建团队：两步输入（名称 → 描述）
   */
  onCreateTeam() {
    wx.showModal({
      title: '创建团队',
      editable: true,
      placeholderText: '团队名称（必填）',
      success: (res) => {
        if (!res.confirm) return
        const name = (res.content || '').trim()
        if (!name) {
          wx.showToast({ title: '请输入团队名称', icon: 'none' })
          return
        }
        wx.showModal({
          title: '团队描述',
          editable: true,
          placeholderText: '一句话介绍（选填）',
          success: (res2) => {
            const desc = res2.confirm ? (res2.content || '') : ''
            this.doCreateTeam(name, desc)
          }
        })
      }
    })
  },

  doCreateTeam(name, desc) {
    wx.showLoading({ title: '创建中...' })
    wx.cloud.callFunction({ name: 'team', data: { action: 'create', name, desc } })
      .then(res => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          wx.showToast({ title: '创建成功', icon: 'success' })
          this.loadTeams()
        } else {
          wx.showToast({ title: (res.result && res.result.error) || '创建失败', icon: 'none' })
        }
      })
      .catch(err => {
        wx.hideLoading()
        console.error('创建团队失败', err)
        wx.showToast({ title: '创建失败，请检查云函数', icon: 'none' })
      })
  },

  /**
   * 邀请码加入团队
   */
  onJoinTeam() {
    wx.showModal({
      title: '加入团队',
      editable: true,
      placeholderText: '输入 6 位邀请码',
      success: (res) => {
        if (!res.confirm) return
        const code = (res.content || '').trim()
        if (!code) {
          wx.showToast({ title: '请输入邀请码', icon: 'none' })
          return
        }
        wx.showLoading({ title: '加入中...' })
        wx.cloud.callFunction({ name: 'team', data: { action: 'joinByCode', inviteCode: code } })
          .then(res => {
            wx.hideLoading()
            if (res.result && res.result.success) {
              wx.showModal({
                title: '加入成功',
                content: `你已加入「${res.result.teamName}」`,
                showCancel: false,
                confirmText: '好的'
              })
              this.loadTeams()
            } else {
              wx.showToast({ title: (res.result && res.result.error) || '加入失败', icon: 'none' })
            }
          })
          .catch(err => {
            wx.hideLoading()
            console.error('加入团队失败', err)
            wx.showToast({ title: '加入失败，请检查云函数', icon: 'none' })
          })
      }
    })
  },

  /**
   * 展开/收起团队详情
   */
  onToggleDetail(e) {
    const id = e.currentTarget.dataset.id
    if (this.data.expandedTeamId === id) {
      this.setData({ expandedTeamId: '', detailTeam: null })
    } else {
      this.setData({ expandedTeamId: id })
      this.loadTeamDetail(id)
    }
  },

  /**
   * 加载团队详情（成员列表）
   */
  loadTeamDetail(teamId, silent) {
    if (!silent) wx.showLoading({ title: '加载中...' })
    wx.cloud.callFunction({ name: 'team', data: { action: 'get', teamId } })
      .then(res => {
        if (!silent) wx.hideLoading()
        if (res.result && res.result.success) {
          this.setData({ detailTeam: res.result })
        } else if (!silent) {
          wx.showToast({ title: (res.result && res.result.error) || '加载失败', icon: 'none' })
        }
      })
      .catch(err => {
        if (!silent) wx.hideLoading()
        console.error('加载团队详情失败', err)
      })
  },

  /**
   * 复制邀请码
   */
  onCopyCode(e) {
    const code = e.currentTarget.dataset.code
    wx.setClipboardData({ data: code })
  },

  /**
   * 重置邀请码（owner）
   */
  onRegenerateCode(e) {
    const teamId = e.currentTarget.dataset.id
    wx.showModal({
      title: '重置邀请码',
      content: '重置后旧邀请码将立即失效，确定吗？',
      confirmColor: '#ff6b35',
      success: (res) => {
        if (!res.confirm) return
        wx.cloud.callFunction({ name: 'team', data: { action: 'regenerateCode', teamId } })
          .then(res => {
            if (res.result && res.result.success) {
              wx.showToast({ title: '已重置', icon: 'success' })
              this.loadTeams()
            } else {
              wx.showToast({ title: (res.result && res.result.error) || '操作失败', icon: 'none' })
            }
          })
      }
    })
  },

  /**
   * 移除成员（owner）
   */
  onRemoveMember(e) {
    const { teamId, openid } = e.currentTarget.dataset
    wx.showModal({
      title: '移除成员',
      content: '确定将该成员移出团队吗？',
      confirmColor: '#e64340',
      success: (res) => {
        if (!res.confirm) return
        wx.cloud.callFunction({ name: 'team', data: { action: 'removeMember', teamId, memberOpenid: openid } })
          .then(res => {
            if (res.result && res.result.success) {
              wx.showToast({ title: '已移除', icon: 'success' })
              this.loadTeams()
            } else {
              wx.showToast({ title: (res.result && res.result.error) || '操作失败', icon: 'none' })
            }
          })
      }
    })
  },

  /**
   * 退出团队（成员）
   */
  onLeaveTeam(e) {
    const teamId = e.currentTarget.dataset.id
    wx.showModal({
      title: '退出团队',
      content: '退出后将看不到该团队的菜谱，确定吗？',
      confirmColor: '#e64340',
      success: (res) => {
        if (!res.confirm) return
        wx.cloud.callFunction({ name: 'team', data: { action: 'leave', teamId } })
          .then(res => {
            if (res.result && res.result.success) {
              wx.showToast({ title: '已退出', icon: 'success' })
              this.setData({ expandedTeamId: '', detailTeam: null })
              this.loadTeams()
            } else {
              wx.showToast({ title: (res.result && res.result.error) || '操作失败', icon: 'none' })
            }
          })
      }
    })
  },

  /**
   * 解散团队（owner）
   */
  onDeleteTeam(e) {
    const teamId = e.currentTarget.dataset.id
    wx.showModal({
      title: '解散团队',
      content: '解散后团队菜谱和成员关系将全部删除，不可恢复！确定吗？',
      confirmColor: '#e64340',
      success: (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '解散中...' })
        wx.cloud.callFunction({ name: 'team', data: { action: 'deleteTeam', teamId } })
          .then(res => {
            wx.hideLoading()
            if (res.result && res.result.success) {
              wx.showToast({ title: '已解散', icon: 'success' })
              this.setData({ expandedTeamId: '', detailTeam: null })
              this.loadTeams()
            } else {
              wx.showToast({ title: (res.result && res.result.error) || '操作失败', icon: 'none' })
            }
          })
          .catch(err => {
            wx.hideLoading()
            console.error('解散团队失败', err)
          })
      }
    })
  }
})
