# 待办清单小程序 - 发布指南

## 一、项目结构

```
微信小程序/
├── app.js                          # 小程序入口
├── app.json                        # 全局配置
├── app.wxss                        # 全局样式
├── sitemap.json                    # 搜索索引配置
├── project.config.json             # 项目配置
├── README.md                       # 项目说明
├── pages/
│   ├── index/                      # 首页 - 待办列表
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   ├── edit/                       # 新增/编辑页
│   │   ├── edit.js
│   │   ├── edit.json
│   │   ├── edit.wxml
│   │   └── edit.wxss
│   └── detail/                     # 详情页
│       ├── detail.js
│       ├── detail.json
│       ├── detail.wxml
│       └── detail.wxss
├── components/
│   └── todo-item/                  # 待办项组件
│       ├── todo-item.js
│       ├── todo-item.json
│       ├── todo-item.wxml
│       └── todo-item.wxss
└── utils/
    └── util.js                     # 工具函数
```

## 二、功能清单

- [x] 待办列表展示（首页）
- [x] 新增待办事项
- [x] 编辑待办事项
- [x] 查看待办详情
- [x] 标记完成/取消完成
- [x] 删除待办事项（带确认弹窗）
- [x] 优先级设置（高/中/低）
- [x] 截止日期设置
- [x] 筛选（全部/待完成/已完成）
- [x] 统计信息（总数/待完成/已完成）
- [x] 清除已完成任务
- [x] 下拉刷新
- [x] 本地存储持久化
- [x] 过期提醒

## 三、发布步骤

### 第 1 步：配置 AppID

1. 打开 `project.config.json`
2. 将 `"appid": "touristappid"` 替换为你的真实 AppID
   ```
   "appid": "你的AppID"
   ```

### 第 2 步：导入项目到微信开发者工具

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开微信开发者工具，使用微信扫码登录
3. 点击「+」号导入项目
4. 项目目录选择：`C:\Users\DELL\WorkBuddy\微信小程序`
5. AppID 填写你的小程序 AppID
6. 点击「导入」

### 第 3 步：本地调试

1. 在模拟器中预览功能，确保一切正常
2. 点击「真机调试」扫码在手机上测试
3. 检查以下功能：
   - 添加/编辑/删除待办
   - 切换完成状态
   - 筛选和清除已完成
   - 数据持久化（关闭重开后数据仍在）

### 第 4 步：上传代码

1. 点击开发者工具顶部的「上传」按钮
2. 填写版本号（如 `1.0.0`）
3. 填写项目备注（如「首次发布」）
4. 点击「确定」完成上传

### 第 5 步：提交审核

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入「管理 → 版本管理」
3. 在「开发版本」中找到刚上传的版本
4. 点击「提交审核」
5. 填写审核信息：
   - 服务类目：选择「工具 → 效率」
   - 功能页面：首页
   - 其他信息按实际情况填写
6. 提交后等待微信团队审核（通常 1-7 天）

### 第 6 步：发布上线

1. 审核通过后，在「版本管理」中找到已通过的版本
2. 点击「发布」
3. 小程序正式上线，用户可以搜索使用

## 四、常见问题

### Q: 上传时提示「AppID 不合法」？
A: 请确保 `project.config.json` 中的 `appid` 已替换为真实的小程序 AppID，不是 `touristappid`。

### Q: 审核被拒绝？
A: 常见原因：服务类目不匹配、功能不完整、页面空白。请根据审核反馈修改后重新提交。

### Q: 本地预览正常但上传报错？
A: 检查是否使用了未开放的能力或 API，确保代码中没有调试用的 `console.log` 以外的非法调用。

### Q: 数据存储在哪里？
A: 使用微信小程序的 `wx.setStorageSync` / `wx.getStorageSync`，数据存储在用户本地，清除小程序缓存会丢失。
