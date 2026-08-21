// cloudfunctions/initDB/index.js
// 云函数：一键初始化数据库
// 1. 自动创建全部集合：users / recipes / teams / teamMembers / orders
// 2. 迁移旧版点餐数据（foods 集合中带 _openid 的用户菜品 → recipes 个人菜谱）
// 部署后在云开发控制台 → 云函数 → initDB → 「测试」运行一次即可

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 需要创建的集合
const COLLECTIONS = ['users', 'recipes', 'teams', 'teamMembers', 'orders']

exports.main = async () => {
  const results = {}

  // 1. 创建集合（已存在则跳过）
  for (const name of COLLECTIONS) {
    try {
      await db.createCollection(name)
      results[name] = 'created'
    } catch (e) {
      results[name] = 'exists'
    }
  }

  // 2. 迁移旧版 foods 数据 → recipes（仅迁移有 _openid 的用户数据）
  //    云函数管理员写入的示例菜无归属，跳过
  let migrated = 0
  try {
    const foodsRes = await db.collection('foods').get()
    for (const f of foodsRes.data) {
      if (!f._openid) continue

      // 已迁移过则跳过（按 名称+创建者 判断）
      const exist = await db.collection('recipes')
        .where({ name: f.name, ownerOpenid: f._openid })
        .count()
      if (exist.total > 0) continue

      await db.collection('recipes').add({
        data: {
          name: f.name,
          description: f.description || '',
          price: f.price || '',
          image: f.image || '',
          scope: 'personal',
          teamId: '',
          ownerOpenid: f._openid,
          createTime: f.createTime || Date.now(),
          updateTime: Date.now()
        }
      })
      migrated++
    }
  } catch (e) {
    // foods 集合不存在则跳过迁移
    console.log('旧数据迁移跳过:', e.errMsg || e)
  }

  return {
    success: true,
    results,
    migrated
  }
}
