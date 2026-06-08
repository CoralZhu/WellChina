# WellChina MVP Scope v1

目标：将 WellChina 从“多页面前端原型”收缩为 20 天内可完成、可演示、可继续接真实后端的 AI healthcare workflow MVP。

本阶段不继续铺页面，也不优先接 Stripe。核心验证问题是：海外用户能否用自己的语言理解机构、完成就医准备、生成 booking，并在行程与就诊总结中感到“有人带着我走完整个流程”。

## 1. 本阶段保留功能

### 1.1 语言选择

- 保留中 / 英 / 俄三语言。
- 保留首次进入的语言选择页。
- 本阶段目标：语言选择后影响主要流程文案。
- 当前代码位置：
  - `apps/mobile/app/language.tsx`
  - `apps/mobile/i18n/zh.json`
  - `apps/mobile/i18n/en.json`
  - `apps/mobile/i18n/ru.json`
  - `apps/mobile/store/appStore.ts`

### 1.2 首页 / 搜索

- 保留首页作为入口，不继续扩展复杂推荐。
- 保留搜索页的机构检索、类型筛选、症状关键词筛选。
- 首页重点收缩为：
  - 搜索入口
  - AI 就医准备入口
  - 推荐机构入口
  - 行程入口
- 当前代码位置：
  - `apps/mobile/app/(tabs)/home.tsx`
  - `apps/mobile/app/(tabs)/search.tsx`
  - `apps/mobile/components/home/InstitutionCard.tsx`
  - `apps/mobile/data/mock.ts`

### 1.3 机构详情

- 保留机构详情页，作为信任建立页面。
- 保留模块：
  - 机构介绍
  - 医生团队
  - 服务套餐
  - 来华须知
  - 联系 / 分享入口
- 服务套餐继续作为 booking 的入口。
- 当前代码位置：
  - `apps/mobile/app/institution/[id].tsx`

### 1.4 AI 就医准备

- 保留并升级当前 `chat` 页面。
- 本阶段 AI 不做泛聊，收缩为“就医准备工作流”：
  - 询问用户症状、目标城市、语言、预计出发时间
  - 生成就医准备清单
  - 生成需要提交给机构的摘要
  - 生成来华前 checklist
- 20 天内可以先用规则 + 模板实现，预留 Claude Edge Function 接口。
- 当前代码位置：
  - `apps/mobile/app/chat.tsx`
  - `apps/mobile/data/mock.ts`

### 1.5 创建 Booking

- 保留 booking 创建流程，但不接 Stripe。
- 本阶段 booking 是“预约请求 / care request”，不是已支付订单。
- 创建 booking 需要最小字段：
  - institutionId
  - serviceId
  - selectedPackage
  - preferredLanguage
  - symptomsSummary
  - travelWindow
  - contactName
  - contactMethod
  - status: `pending_review`
- 20 天内目标：从前端状态或 Supabase 写入一条 booking，并能在行程页读取。
- 当前代码位置：
  - `apps/mobile/app/booking/[serviceId].tsx`
  - `supabase/migrations/20260501000000_init.sql`

### 1.6 行程页

- 保留行程页，但从 mock trip 收缩为 booking 状态页。
- 行程页展示：
  - booking 状态
  - 机构与服务
  - 下一步事项
  - 准备材料 checklist
  - 就诊当天安排
- 当前代码位置：
  - `apps/mobile/app/(tabs)/trip.tsx`
  - `apps/mobile/data/mock.ts`

### 1.7 就诊总结

- 新增为核心 MVP 终点，不做复杂健康档案。
- 就诊总结包含：
  - 医生建议摘要
  - 用药 / 康复注意事项
  - 复诊建议
  - 用户可分享给家人的双语摘要
- 20 天内可以用静态模板 + booking 数据生成。
- 后续可接 Whisper / Claude 做真实转录和总结。

## 2. 延后功能

以下功能保留产品方向，但不进入本阶段 20 天 MVP。

- Stripe / 微信支付 / Yandex Pay / 银联支付
- 真实支付状态、退款、发票
- Mapbox 中国地图页
- 复杂目的地地图 marker 和地理定位
- 真实 AI 流式对话
- DeepL 实时翻译
- Whisper 就诊录音转文字
- Google Vision 药盒 OCR
- 远程随访视频预约
- 评价系统写入和审核
- 推荐码 / 邀请奖励
- VIP / 复购折扣
- 完整健康档案上传与文件管理
- 推送通知
- B 端机构后台
- Web/Next.js 落地页
- 多机构算法推荐
- 多端同步和离线缓存

## 3. 明确不做功能

以下功能在当前 MVP 中明确不做，避免范围失控。

- 不做真实医疗诊断。
- 不做处方建议。
- 不做急救医疗判断。
- 不做在线支付。
- 不做复杂账号体系。
- 不做医生端实时聊天。
- 不做医院 HIS / EMR 系统集成。
- 不做保险理赔自动化。
- 不做真实地图导航。
- 不做航班、酒店、签证供应商接入。
- 不做 App Store / Google Play 上架准备。
- 不做完整 Next.js Web 站点。

## 4. 最终核心用户 Flow

本阶段唯一核心 flow：

```text
语言选择
  ↓
首页 / 搜索
  ↓
机构详情
  ↓
AI 就医准备
  ↓
创建 booking
  ↓
行程页
  ↓
就诊总结
```

### Flow 说明

1. 用户选择语言：中文 / 英文 / 俄文。
2. 用户在首页或搜索页找到机构。
3. 用户进入机构详情，查看机构介绍、医生、套餐和来华须知。
4. 用户进入 AI 就医准备，回答少量问题并生成准备清单。
5. 用户提交 booking 请求，不支付，只进入 `pending_review` 状态。
6. 行程页展示 booking 状态、下一步准备事项和模拟行程。
7. 就诊完成后生成总结，用户可以查看双语就诊摘要。

### MVP 成功标准

- 用户不注册也能完成上述 flow。
- 用户能清楚知道下一步要做什么。
- booking 数据能被创建并在行程页被读取。
- AI 就医准备输出能直接服务 booking。
- 就诊总结能让用户或家属理解治疗结果和后续安排。

## 5. 20 天开发里程碑

### Day 1-3：范围收缩与数据模型

- 冻结 MVP scope。
- 梳理当前页面，移除核心 flow 外的干扰入口或弱化入口。
- 定义 `CarePreparation`、`BookingRequest`、`VisitSummary` 类型。
- 调整 Supabase migration 或新增 migration，补齐 MVP 所需字段。
- 明确 mock 模式和 Supabase 模式的切换边界。

交付物：
- `MVP_SCOPE_v1.md`
- MVP 数据模型说明
- 核心 flow route map

### Day 4-6：AI 就医准备工作流

- 将 `chat` 收缩为结构化就医准备。
- 实现症状、旅行时间、语言、既往病史、目标机构的输入。
- 输出：
  - 用户摘要
  - 机构接收摘要
  - 来华准备 checklist
- 先用本地规则和模板，预留 Edge Function 调用接口。

交付物：
- AI 就医准备页可用
- 准备结果可传给 booking

### Day 7-10：Booking Request

- 将 booking 页从“支付订单”改为“预约请求”。
- 移除支付优先级，保留套餐和价格展示。
- 新增联系人和出行窗口。
- 创建 booking request。
- mock 模式下写入 Zustand；Supabase 模式下写入 `bookings`。

交付物：
- 用户能提交 booking request
- booking 状态为 `pending_review`

### Day 11-13：行程页真实化

- 行程页从 `MOCK_TRIP` 改为读取当前 booking。
- 展示：
  - booking 状态
  - 机构 / 服务 / 日期
  - 准备 checklist
  - 下一步说明
- 没有 booking 时展示明确空状态和返回搜索入口。

交付物：
- booking 创建后能在行程页看到对应内容

### Day 14-16：就诊总结

- 新增就诊总结页面或行程页内总结模块。
- 用 booking + AI 准备信息生成 mock 总结。
- 支持中英或中俄双语摘要。
- 包含用药、康复、复诊、家属可读摘要。

交付物：
- 完整 flow 终点可演示

### Day 17-18：Supabase 最小接线

- 接入 Supabase client。
- 实现最小 booking 写入和读取。
- 不做完整 Auth；可先使用 guest/session id。
- 验证 RLS 或临时 MVP policy。

交付物：
- 至少 booking 数据不再只存在本地内存

### Day 19：端到端 QA

- 按核心 flow 做完整手工测试。
- 修复阻断问题：
  - 空白页
  - 路由断裂
  - 状态丢失
  - 文案缺失
  - 语言切换异常

交付物：
- MVP QA checklist
- 已知问题清单

### Day 20：Demo 打磨

- 准备 3 分钟演示脚本。
- 准备一条 Anna / Robert 用户样例。
- 打磨核心页面文案和状态提示。
- 输出下一阶段 backlog。

交付物：
- 可演示 MVP
- Demo script
- v2 backlog

