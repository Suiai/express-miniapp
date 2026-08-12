// cloudfunctions/initFoods/index.js
// 云函数：初始化示例菜品数据（幂等，已有数据则跳过）
// 部署后在云开发控制台"云函数"中测试运行一次即可

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async () => {
  try {
    // 第一步：确保 foods 集合存在（已存在时会报错，忽略即可）
    try {
      await db.createCollection('foods')
      console.log('集合 foods 创建成功')
    } catch (e) {
      console.log('集合已存在或创建失败（可忽略）:', e.errMsg || e)
    }

    // 第二步：检查是否已有数据
    const countRes = await db.collection('foods').count()
    if (countRes.total > 0) {
      return {
        success: true,
        message: `已有 ${countRes.total} 条菜品数据，跳过初始化`,
        count: countRes.total
      }
    }

    const sampleFoods = [
      {
        name: '宫保鸡丁',
        description: '经典川菜，鸡丁嫩滑，花生酥脆，微辣鲜香',
        price: '28',
        image: '',
        createTime: Date.now()
      },
      {
        name: '番茄炒蛋',
        description: '家常下饭菜，酸甜可口，蛋香浓郁',
        price: '18',
        image: '',
        createTime: Date.now() - 1000
      },
      {
        name: '红烧肉',
        description: '肥而不腻，入口即化，酱香四溢',
        price: '38',
        image: '',
        createTime: Date.now() - 2000
      },
      {
        name: '清蒸鲈鱼',
        description: '鲜嫩爽滑，营养丰富，清淡鲜美',
        price: '45',
        image: '',
        createTime: Date.now() - 3000
      },
      {
        name: '麻婆豆腐',
        description: '麻辣鲜香，豆腐嫩滑，下饭神器',
        price: '22',
        image: '',
        createTime: Date.now() - 4000
      }
    ]

    // 逐条插入（云函数端支持单次批量写入）
    for (const food of sampleFoods) {
      await db.collection('foods').add({ data: food })
    }

    return {
      success: true,
      message: `初始化成功，共添加 ${sampleFoods.length} 道示例菜品`,
      count: sampleFoods.length
    }
  } catch (err) {
    console.error('初始化失败', err)
    return { success: false, error: err.errMsg || String(err) }
  }
}
