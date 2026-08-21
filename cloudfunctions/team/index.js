// cloudfunctions/team/index.js
// 云函数：团队管理
// actions:
//   create          - 创建团队（自动生成邀请码，创建者为 owner）
//   listMyTeams     - 我加入的所有团队（含成员数、我的角色）
//   get             - 团队详情 + 成员列表（需是成员）
//   joinByCode      - 邀请码加入
//   leave           - 退出团队（owner 不可退出，需解散）
//   removeMember    - 移除成员（仅 owner）
//   deleteTeam      - 解散团队（仅 owner，级联删除成员关系与团队菜谱）
//   regenerateCode  - 重置邀请码（仅 owner）

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 生成 6 位邀请码（去掉易混淆字符 0/O/1/I）
function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// 生成不重复的邀请码
async function genUniqueCode() {
  for (let i = 0; i < 10; i++) {
    const code = genCode()
    const res = await db.collection('teams').where({ inviteCode: code }).count()
    if (res.total === 0) return code
  }
  return genCode() // 兜底
}

// 获取用户昵称（团队内展示用）
async function getUser(openid) {
  try {
    const res = await db.collection('users').doc(openid).get()
    return res.data
  } catch (e) {
    return { openid, nickname: `用户${openid.slice(-4)}` }
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { action, teamId, name, desc, inviteCode, memberOpenid } = event

  try {
    // ========== 创建团队 ==========
    if (action === 'create') {
      if (!name || !name.trim()) return { success: false, error: '请输入团队名称' }
      const code = await genUniqueCode()
      const user = await getUser(OPENID)
      const res = await db.collection('teams').add({
        data: {
          name: name.trim(),
          desc: (desc || '').trim(),
          ownerOpenid: OPENID,
          inviteCode: code,
          createTime: Date.now()
        }
      })
      // 创建者自动成为成员（owner）
      await db.collection('teamMembers').add({
        data: {
          teamId: res._id,
          openid: OPENID,
          nickname: user.nickname,
          role: 'owner',
          joinTime: Date.now()
        }
      })
      return { success: true, teamId: res._id }
    }

    // ========== 我加入的团队列表 ==========
    if (action === 'listMyTeams') {
      const memberRes = await db.collection('teamMembers').where({ openid: OPENID }).get()
      const teamIds = memberRes.data.map(m => m.teamId)
      if (teamIds.length === 0) return { success: true, list: [] }

      const memberMap = {}
      memberRes.data.forEach(m => { memberMap[m.teamId] = m })

      const teamRes = await db.collection('teams').where({ _id: _.in(teamIds) }).get()
      const teams = await Promise.all(teamRes.data.map(async t => {
        const my = memberMap[t._id] || {}
        const c = await db.collection('teamMembers').where({ teamId: t._id }).count()
        return {
          _id: t._id,
          name: t.name,
          desc: t.desc || '',
          ownerOpenid: t.ownerOpenid,
          inviteCode: t.inviteCode,
          createTime: t.createTime,
          myRole: my.role || 'member',
          memberCount: c.total
        }
      }))
      return { success: true, list: teams }
    }

    // ========== 团队详情（成员列表） ==========
    if (action === 'get') {
      const my = await db.collection('teamMembers').where({ teamId, openid: OPENID }).get()
      if (my.data.length === 0) return { success: false, error: '你不是该团队成员' }

      const teamRes = await db.collection('teams').doc(teamId).get().catch(() => null)
      if (!teamRes || !teamRes.data) return { success: false, error: '团队不存在或已解散' }

      const memberRes = await db.collection('teamMembers').where({ teamId }).get()
      const team = teamRes.data
      return {
        success: true,
        team: {
          _id: team._id,
          name: team.name,
          desc: team.desc || '',
          ownerOpenid: team.ownerOpenid,
          inviteCode: team.inviteCode,
          createTime: team.createTime
        },
        myRole: my.data[0].role,
        members: memberRes.data
      }
    }

    // ========== 邀请码加入 ==========
    if (action === 'joinByCode') {
      if (!inviteCode) return { success: false, error: '请输入邀请码' }
      const code = String(inviteCode).trim().toUpperCase()
      const teamRes = await db.collection('teams').where({ inviteCode: code }).get()
      if (teamRes.data.length === 0) return { success: false, error: '邀请码无效，请确认后重试' }
      const team = teamRes.data[0]

      const exist = await db.collection('teamMembers')
        .where({ teamId: team._id, openid: OPENID }).count()
      if (exist.total > 0) return { success: false, error: '你已在该团队中' }

      const user = await getUser(OPENID)
      await db.collection('teamMembers').add({
        data: {
          teamId: team._id,
          openid: OPENID,
          nickname: user.nickname,
          role: 'member',
          joinTime: Date.now()
        }
      })
      return { success: true, teamId: team._id, teamName: team.name }
    }

    // ========== 退出团队 ==========
    if (action === 'leave') {
      const my = await db.collection('teamMembers').where({ teamId, openid: OPENID }).get()
      if (my.data.length === 0) return { success: false, error: '你不在该团队中' }
      if (my.data[0].role === 'owner') return { success: false, error: '创建者不能退出，可解散团队' }
      await db.collection('teamMembers').doc(my.data[0]._id).remove()
      return { success: true }
    }

    // ========== 移除成员（仅 owner） ==========
    if (action === 'removeMember') {
      const teamRes = await db.collection('teams').doc(teamId).get().catch(() => null)
      if (!teamRes || !teamRes.data) return { success: false, error: '团队不存在' }
      if (teamRes.data.ownerOpenid !== OPENID) return { success: false, error: '仅创建者可移除成员' }

      const target = await db.collection('teamMembers')
        .where({ teamId, openid: memberOpenid }).get()
      if (target.data.length === 0) return { success: false, error: '该成员不在团队中' }
      if (target.data[0].role === 'owner') return { success: false, error: '不能移除创建者' }
      await db.collection('teamMembers').doc(target.data[0]._id).remove()
      return { success: true }
    }

    // ========== 解散团队（仅 owner，级联删除） ==========
    if (action === 'deleteTeam') {
      const teamRes = await db.collection('teams').doc(teamId).get().catch(() => null)
      if (!teamRes || !teamRes.data) return { success: false, error: '团队不存在' }
      if (teamRes.data.ownerOpenid !== OPENID) return { success: false, error: '仅创建者可解散团队' }

      await db.collection('teams').doc(teamId).remove()

      // 删除成员关系
      const members = await db.collection('teamMembers').where({ teamId }).get()
      await Promise.all(members.data.map(m => db.collection('teamMembers').doc(m._id).remove()))

      // 删除团队菜谱
      const recipes = await db.collection('recipes').where({ scope: 'team', teamId }).get()
      await Promise.all(recipes.data.map(r => db.collection('recipes').doc(r._id).remove()))

      return { success: true }
    }

    // ========== 重置邀请码（仅 owner） ==========
    if (action === 'regenerateCode') {
      const teamRes = await db.collection('teams').doc(teamId).get().catch(() => null)
      if (!teamRes || !teamRes.data) return { success: false, error: '团队不存在' }
      if (teamRes.data.ownerOpenid !== OPENID) return { success: false, error: '仅创建者可重置邀请码' }
      const newCode = await genUniqueCode()
      await db.collection('teams').doc(teamId).update({ data: { inviteCode: newCode } })
      return { success: true, inviteCode: newCode }
    }

    return { success: false, error: '未知操作' }
  } catch (err) {
    console.error('team 云函数错误', err)
    return { success: false, error: err.errMsg || String(err) }
  }
}
