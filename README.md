# 轻期

微信生态内极简生理期记录小程序，基于 PRD V1.0 MVP 实现。

## 功能概览

- **首页**：日历视图、状态卡片、Smart Banner、记一笔快捷记录
- **记录**：经期历史列表，支持新增与删除
- **统计**：近 6 个月周期/经期长度折线图，智能平均值
- **我的**：周期设置、提醒设置、预测原理、隐私政策、模式切换、主题配色、数据清除

## 技术规范

- 微信小程序原生框架（WXML + WXSS + JS）
- `lazyCodeLoading: "requiredComponents"` 按需注入（官方推荐）
- `style: "v2"` 新版样式规范
- WebView 渲染引擎，兼容 Android / iOS 全版本客户端
- `rpx` 响应式单位 + `env(safe-area-inset-bottom)` 适配 iOS 刘海屏
- 自定义 TabBar，统一底部导航体验
- 数据纯本地化（`wx.setStorageSync`），无需登录
- 提醒功能通过 `wx.addPhoneCalendar` 写入系统日历（基础库 2.15.0+）

## 本地开发

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 用开发者工具打开本项目目录
3. 在 `project.config.json` 中填入你的 AppID（或使用测试号）
4. 编译预览即可

## 日历提醒

- 在「我的 → 提醒设置」中开启经期/排卵提醒
- 每次记录「经期开始」时，会根据最新预测自动向**手机系统日历**添加事件
- 经期提醒默认提前 2 天通知，可在提醒设置中改为 1 天
- 需在真机上授权「添加到日历」权限；系统日历的删除需在日历 App 中手动操作

## 项目结构

```
├── app.js / app.json / app.wxss   # 应用入口
├── custom-tab-bar/                # 自定义底部导航
├── components/                    # 公共组件
│   ├── calendar/                  # 日历
│   ├── status-card/               # 状态卡片
│   ├── record-sheet/              # 记一笔半屏弹窗
│   ├── smart-banner/              # 智能提示横幅
│   ├── prediction-sheet/          # 预测原理半屏弹窗
│   └── line-chart/                # 折线图
├── pages/                         # 页面
│   ├── index/                     # 首页
│   ├── records/                   # 记录
│   ├── stats/                     # 统计
│   ├── mine/                      # 我的
│   ├── settings/                  # 周期设置
│   ├── prediction/                # 预测原理
│   ├── privacy/                   # 隐私政策
│   └── reminder/                  # 提醒设置
└── utils/                         # 工具
    ├── cycle.js                   # 周期预测算法
    ├── calendar-reminder.js       # 系统日历提醒
    ├── data-transfer.js           # 导入导出
    ├── date.js                    # 日期工具
    └── storage.js                 # 本地存储
```

## 核心算法

- 默认经期 5 天、周期 28 天
- 排卵日 = 下次预测经期开始日 − 14 天
- 易孕期 = 排卵日前 5 天 + 后 4 天
- 连续记录 3 个月以上启用加权平均法
- 超过 45 天未记录则暂停预测

## 隐私说明

所有核心数据仅保存在用户设备本地，不上传云端，不用于广告分析。首次启动需同意隐私政策后方可使用。
