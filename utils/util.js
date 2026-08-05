// utils/util.js - 工具函数

/**
 * 生成唯一 ID
 */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

/**
 * 格式化日期时间
 * @param {number|string|Date} date - 日期
 * @param {string} fmt - 格式 (yyyy-MM-dd HH:mm:ss)
 */
function formatDate(date, fmt = 'yyyy-MM-dd HH:mm') {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const opt = {
    'y+': d.getFullYear(),
    'M+': d.getMonth() + 1,
    'd+': d.getDate(),
    'H+': d.getHours(),
    'm+': d.getMinutes(),
    's+': d.getSeconds()
  }

  let result = fmt
  for (const k in opt) {
    const val = opt[k]
    const reg = new RegExp(k)
    result = result.replace(reg, function (match) {
      return val.toString().padStart(match.length, '0')
    })
  }
  return result
}

/**
 * 获取相对时间描述
 * @param {number} timestamp - 时间戳
 */
function timeAgo(timestamp) {
  if (!timestamp) return ''
  const now = Date.now()
  const diff = now - timestamp
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return Math.floor(diff / minute) + '分钟前'
  if (diff < day) return Math.floor(diff / hour) + '小时前'
  if (diff < 7 * day) return Math.floor(diff / day) + '天前'
  return formatDate(timestamp, 'yyyy-MM-dd')
}

/**
 * 检查是否过期
 * @param {string} dueDate - 截止日期字符串
 */
function isOverdue(dueDate) {
  if (!dueDate) return false
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}

/**
 * 优先级文本映射
 */
const priorityMap = {
  high: { text: '高', color: '#FF4D4F' },
  medium: { text: '中', color: '#FAAD14' },
  low: { text: '低', color: '#52C41A' }
}

function getPriorityInfo(priority) {
  return priorityMap[priority] || priorityMap.medium
}

/**
 * 本地存储 - 待办事项 CRUD
 */
const storage = {
  getAll() {
    return wx.getStorageSync('todos') || []
  },

  save(todos) {
    wx.setStorageSync('todos', todos)
  },

  getById(id) {
    const todos = this.getAll()
    return todos.find(t => t.id === id)
  },

  add(todo) {
    const todos = this.getAll()
    const newTodo = {
      id: genId(),
      title: todo.title || '',
      desc: todo.desc || '',
      priority: todo.priority || 'medium',
      dueDate: todo.dueDate || '',
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    todos.unshift(newTodo)
    this.save(todos)
    return newTodo
  },

  update(id, data) {
    const todos = this.getAll()
    const index = todos.findIndex(t => t.id === id)
    if (index === -1) return null
    todos[index] = {
      ...todos[index],
      ...data,
      updatedAt: Date.now()
    }
    this.save(todos)
    return todos[index]
  },

  toggle(id) {
    const todos = this.getAll()
    const index = todos.findIndex(t => t.id === id)
    if (index === -1) return null
    todos[index].completed = !todos[index].completed
    todos[index].updatedAt = Date.now()
    this.save(todos)
    return todos[index]
  },

  remove(id) {
    const todos = this.getAll()
    const filtered = todos.filter(t => t.id !== id)
    this.save(filtered)
    return filtered
  },

  clearCompleted() {
    const todos = this.getAll()
    const filtered = todos.filter(t => !t.completed)
    this.save(filtered)
    return filtered
  }
}

module.exports = {
  genId,
  formatDate,
  timeAgo,
  isOverdue,
  getPriorityInfo,
  storage
}
