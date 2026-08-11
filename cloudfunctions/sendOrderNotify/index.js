// cloudfunctions/sendOrderNotify/index.js
// 云函数：发送点餐订阅消息通知
// 部署前请确保已在微信公众平台配置订阅消息模板

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { templateId, name, description, price, time } = event

  // 模板字段需与微信公众平台中配置的模板一致
  // 以下为示例字段，请根据实际模板内容修改 data 中的 key
  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser: OPENID,
      templateId: templateId,
      page: 'pages/index/index',
      miniprogramState: 'formal',
      data: {
        // 模板字段示例：菜品名称、菜品描述、下单时间
        // 请根据实际模板的关键词类型（thing/amount/time等）调整
        thing1: { value: name },
        thing2: { value: description.substring(0, 20) },
        time3: { value: time }
      }
    })

    console.log('订阅消息发送成功', result)
    return { success: true, result }
  } catch (err) {
    console.error('订阅消息发送失败', err)
    return { success: false, error: err.errMsg || String(err) }
  }
}
