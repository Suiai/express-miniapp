// components/todo-item/todo-item.js
Component({
  properties: {
    todo: {
      type: Object,
      value: {}
    }
  },

  data: {
    priorityText: '',
    priorityClass: '',
    timeText: '',
    overdue: false
  },

  lifetimes: {
    attached() {
      this.updateDisplay()
    }
  },

  observers: {
    'todo': function () {
      this.updateDisplay()
    }
  },

  methods: {
    updateDisplay() {
      const todo = this.data.todo
      if (!todo) return

      const priorityMap = {
        high: { text: '高优先级', class: 'priority-high' },
        medium: { text: '中优先级', class: 'priority-medium' },
        low: { text: '低优先级', class: 'priority-low' }
      }

      const info = priorityMap[todo.priority] || priorityMap.medium
      const util = require('../../utils/util.js')

      this.setData({
        priorityText: info.text,
        priorityClass: info.class,
        timeText: util.timeAgo(todo.createdAt),
        overdue: util.isOverdue(todo.dueDate) && !todo.completed
      })
    },

    onToggle() {
      this.triggerEvent('toggle', { id: this.data.todo.id })
    },

    onTap() {
      this.triggerEvent('tap', { id: this.data.todo.id })
    },

    onEdit() {
      this.triggerEvent('edit', { id: this.data.todo.id })
    },

    onDelete() {
      this.triggerEvent('delete', { id: this.data.todo.id })
    }
  }
})
