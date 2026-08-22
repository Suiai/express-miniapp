// cloudfunctions/recipe/index.js
// 云函数：菜谱 CRUD（所有数据读写统一走云函数，前端无数据库直接权限）
// actions:
//   list   - 列表：scope=personal 返回本人菜谱；scope=team 返回指定团队的菜谱（需是成员）
//   get    - 详情：个人菜谱仅创建者可见；团队菜谱仅团队成员可见
//   create - 创建：scope=personal 或 scope=team（需是团队成员）
//   update - 更新：个人仅创建者；团队全体成员可共同维护
//   delete - 删除：个人仅创建者；团队全体成员可删除

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 判断 openid 是否为指定团队的成员
async function isTeamMember(teamId, openid) {
  const res = await db.collection('teamMembers')
    .where({ teamId, openid })
    .count()
  return res.total > 0
}

// 校验某条菜谱对当前用户是否可见/可操作
async function canAccess(recipe, openid) {
  if (!recipe) return false
  if (recipe.scope === 'team') {
    return await isTeamMember(recipe.teamId, openid)
  }
  // 个人菜谱：仅创建者
  return recipe.ownerOpenid === openid
}

// 懒创建集合：若集合尚未初始化则自动创建（initDB 未执行时的兜底）
async function ensureCollections() {
  for (const name of ['recipes', 'teams', 'teamMembers']) {
    try {
      await db.createCollection(name)
    } catch (e) {
      // 已存在或其他错误均忽略
    }
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { action, scope, teamId, recipeId, data } = event

  try {
    // 兜底：确保依赖集合存在（首次调用时自动创建）
    await ensureCollections()

    // ========== 列表 ==========
    if (action === 'list') {
      let list = []
      if (scope === 'team') {
        if (!teamId) return { success: true, list: [] }
        if (!(await isTeamMember(teamId, OPENID))) {
          return { success: false, error: '你不是该团队成员' }
        }
        const res = await db.collection('recipes')
          .where({ scope: 'team', teamId })
          .get()
        list = res.data
      } else {
        // 个人菜谱：仅本人
        const res = await db.collection('recipes')
          .where({ scope: 'personal', ownerOpenid: OPENID })
          .get()
        list = res.data
      }
      // 服务端排序，避免依赖复合索引
      list.sort((a, b) => (b.createTime || 0) - (a.createTime || 0))
      return { success: true, list }
    }

    // ========== 详情 ==========
    if (action === 'get') {
      const res = await db.collection('recipes').doc(recipeId).get().catch(() => null)
      if (!res || !res.data) return { success: false, error: '菜谱不存在或已被删除' }
      const r = res.data
      if (!(await canAccess(r, OPENID))) {
        return { success: false, error: '无权限查看该菜谱' }
      }
      // 附带团队名（团队菜谱展示用）
      let teamName = ''
      if (r.scope === 'team') {
        try {
          const teamRes = await db.collection('teams').doc(r.teamId).get()
          teamName = teamRes.data ? teamRes.data.name : ''
        } catch (e) { /* 团队可能已解散 */ }
      }
      return { success: true, recipe: { ...r, teamName } }
    }

    // ========== 创建 ==========
    if (action === 'create') {
      const { name, description, price, image } = data || {}
      if (!name || !name.trim()) return { success: false, error: '请输入菜谱名称' }

      const base = {
        name: name.trim(),
        description: (description || '').trim(),
        price: (price || '').trim(),
        image: image || '',
        ownerOpenid: OPENID,
        updateTime: Date.now()
      }

      if (scope === 'team') {
        if (!teamId) return { success: false, error: '缺少团队ID' }
        if (!(await isTeamMember(teamId, OPENID))) {
          return { success: false, error: '不是团队成员，无法添加' }
        }
        const doc = { ...base, scope: 'team', teamId, createTime: Date.now() }
        const res = await db.collection('recipes').add({ data: doc })
        return { success: true, id: res._id }
      }

      // 个人菜谱
      const doc = { ...base, scope: 'personal', teamId: '', createTime: Date.now() }
      const res = await db.collection('recipes').add({ data: doc })
      return { success: true, id: res._id }
    }

    // ========== 更新 ==========
    if (action === 'update') {
      const res = await db.collection('recipes').doc(recipeId).get().catch(() => null)
      if (!res || !res.data) return { success: false, error: '菜谱不存在' }
      if (!(await canAccess(res.data, OPENID))) {
        return { success: false, error: '无权限修改该菜谱' }
      }

      const { name, description, price, image } = data || {}
      const updateData = {
        name: (name !== undefined && name !== null ? name : res.data.name).trim(),
        description: description !== undefined ? description : res.data.description,
        price: price !== undefined ? price : res.data.price,
        updateTime: Date.now()
      }
      if (image !== undefined && image !== null) updateData.image = image
      await db.collection('recipes').doc(recipeId).update({ data: updateData })
      return { success: true }
    }

    // ========== 删除 ==========
    if (action === 'delete') {
      const res = await db.collection('recipes').doc(recipeId).get().catch(() => null)
      if (!res || !res.data) return { success: false, error: '菜谱不存在' }
      if (!(await canAccess(res.data, OPENID))) {
        return { success: false, error: '无权限删除该菜谱' }
      }
      await db.collection('recipes').doc(recipeId).remove()
      return { success: true }
    }

    return { success: false, error: '未知操作' }
  } catch (err) {
    console.error('recipe 云函数错误', err)
    return { success: false, error: err.errMsg || String(err) }
  }
}
