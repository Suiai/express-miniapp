// cloudfunctions/user/index.js
// 云函数：用户注册与档案
// actions:
//   get            - 获取当前用户（不存在则自动注册），返回 { success, user }
//   updateProfile  - 更新昵称/头像，返回 { success, user }

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 懒创建集合：若集合尚未初始化则自动创建（initDB 未执行时的兜底）
async function ensureCollections() {
  try {
    await db.createCollection('users')
  } catch (e) {
    // 已存在或其他错误均忽略
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { action, nickname, avatarUrl } = event

  try {
    // 兜底：确保 users 集合存在（首次调用时自动创建）
    await ensureCollections()

    // 获取当前用户（自动注册）
    if (action === 'get') {
      let user = null
      try {
        const res = await db.collection('users').doc(OPENID).get()
        user = res.data
      } catch (e) {
        // 用户不存在，首次进入自动注册
      }

      if (!user) {
        user = {
          _id: OPENID,
          openid: OPENID,
          nickname: nickname || `用户${OPENID.slice(-4)}`,
          avatarUrl: avatarUrl || '',
          createTime: Date.now()
        }
        await db.collection('users').doc(OPENID).set({ data: user })
      }
      return { success: true, user }
    }

    // 更新昵称/头像
    if (action === 'updateProfile') {
      const updateData = {}
      if (nickname !== undefined && nickname !== null) updateData.nickname = nickname.trim() || `用户${OPENID.slice(-4)}`
      if (avatarUrl !== undefined && avatarUrl !== null) updateData.avatarUrl = avatarUrl
      if (Object.keys(updateData).length === 0) {
        const res = await db.collection('users').doc(OPENID).get()
        return { success: true, user: res.data }
      }
      updateData.updateTime = Date.now()
      await db.collection('users').doc(OPENID).update({ data: updateData })
      const res = await db.collection('users').doc(OPENID).get()
      return { success: true, user: res.data }
    }

    return { success: false, error: '未知操作' }
  } catch (err) {
    console.error('user 云函数错误', err)
    return { success: false, error: err.errMsg || String(err) }
  }
}
