// cloudfunctions/sendOrderNotify/index.js
// 云函数：发送点餐订阅消息通知
// 使用前：
// 1. 在微信公众平台配置订阅消息模板（功能 → 订阅消息 → 添加模板）
// 2. 将模板ID填入下方 TEMPLATE_ID（与 app.js 中保持一致）
// 3. 根据模板的实际字段名修改 data 中的 key（thing1/thing2/time3 等）

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 订阅消息模板ID（与 app.js 中 subscribeTemplateId 保持一致）
const TEMPLATE_ID = 'C95Rasr4Ky0Gmu-FJRaBzYFHYC25Av_glLmegPTzGcc'

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { name, description, price, time } = event

  // 校验模板ID是否已配置
  if (!TEMPLATE_ID || TEMPLATE_ID === 'TEMPLATE_ID_REPLACE_ME') {
    return {
      success: false,
      error: '模板ID未配置，请在 cloudfunctions/sendOrderNotify/index.js 中填写'
    }
  }

  // 模板字段限制：thing 类型最多 20 字，amount 最多 8 字
  const safeDesc = (description || '').substring(0, 20)
  const safeName = (name || '').substring(0, 20)

  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser: OPENID,
      templateId: TEMPLATE_ID,
      page: 'pages/index/index',
      // 测试阶段用 developer，正式发布后改为 formal
      miniprogramState: 'developer',
      data: {
        // 以下 key 为示例，请根据实际模板的关键词名称修改
        thing1: { value: safeName },      // 菜品名称
        thing2: { value: safeDesc },      // 菜品描述
        time3: { value: time }            // 下单时间
      }
    })

    console.log('订阅消息发送成功', result)
    return { success: true, result }
  } catch (err) {
    console.error('订阅消息发送失败', err)
    return { success: false, error: err.errMsg || String(err) }
  }
}
