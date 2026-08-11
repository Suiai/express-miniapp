// utils/util.js

/**
 * 格式化时间
 * @param {Date} date
 * @returns {string} YYYY-MM-DD HH:mm
 */
function formatTime(date) {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  const h = date.getHours().toString().padStart(2, '0')
  const min = date.getMinutes().toString().padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

/**
 * 生成唯一ID
 * @returns {string}
 */
function genId() {
  return Date.now().toString() + Math.random().toString(36).substring(2, 8)
}

module.exports = {
  formatTime,
  genId
}
