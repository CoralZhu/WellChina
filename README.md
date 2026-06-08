# 栖康 WellChina

> 连接全球老年人与中国康养医疗机构的双边服务平台  
> Eastern Wisdom · Modern Medicine · Global Care

## 快速开始

```bash
npm install
npm --prefix apps/mobile install
npm run web       # 启动 Expo Web
npm run web:clear # 清缓存启动 Expo Web
```

如果直接启动移动端目录，也可以运行：

```bash
cd apps/mobile
npx expo start --web --clear
```

不要在仓库根目录直接运行 `npx expo start --web`。根目录是 monorepo 工作区，不是 Expo Router 应用入口；真实应用入口在 `apps/mobile/app`。

## 技术栈

| 层 | 技术 |
|---|---|
| 移动端 | React Native + Expo SDK 51 |
| 网页端 | Next.js 14 |
| UI | NativeWind (Tailwind for RN) |
| 后端 | Supabase (PostgreSQL + Auth + Storage) |
| AI | Claude API |
| 翻译 | DeepL API |
| 支付 | Stripe + 微信支付 |

## 文档

- [PRD v0.1](./docs/PRD-v0.1.md)
- [技术架构](./docs/TechPlan-v1.0.md)
- [Sprint 计划](./SPRINT_PLAN.md)
- [团队分工](./TEAM_ROLES.md)

## 环境变量

复制 `.env.example` 为 `.env.local` 并填写各项 Key。
