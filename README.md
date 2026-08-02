# marketing brain

一个独立的、移动端优先的中国营销案例筛选工具。它每天从 SocialBeta、梅花网和数英中选出最多 30 条内容，不调用任何大模型，也不产生 token 成本。

```text
SocialBeta 12 条 + 梅花网 10 条 + 数英 8 条
                         ↓
           规则过滤、评分、去重、行业标签
                         ↓
                 Feed → 收藏 → Markdown
```

## 产品结构

- `Feed`：浏览当日 30 条，右滑或点击按钮收藏，左滑略过。
- `收藏`：收藏时必须手动选择行业，同时保存星级、个人备注和完整条目快照，可按行业筛选、编辑、删除和导出 Markdown。
- `我`：记录关注行业和营销偏好，数据只保存在当前浏览器。
- 没有词云、Graph 或 LLM 功能。

## 信源与规则

- 数英：读取公开 RSS `https://www.digitaling.com/rss`，排除招聘频道。
- SocialBeta：读取公开案例研究页及分页，按 URL 去重。
- 梅花网：读取作品页公开的结构化数据，优先沿用原生行业分类。
- 每个来源独立超时和报错；单源失败时由其他来源补位。
- 标题或 URL 重复、近期已经出现、招聘、售票和信息量过低的内容不会再次入选。
- 新鲜度、案例关键词和字段完整度加分；纯获奖或商务通稿降分。
- Feed 参考标签只使用站点原生分类与关键词规则，不调用 AI。统一词表为：快时尚、美妆、汽车、医药、智能硬件、金融、互联网、茶饮、其他。
- Feed 标签只作参考；收藏记录的行业以用户手动选择为准，二者不会相互覆盖。

规则位于 `lib/feed/rules.ts`，配额和去重位于 `lib/feed/select.ts`。

## 本地运行

```bash
corepack enable
pnpm install
pnpm dev
```

未配置 Supabase 时，`/api/items` 会返回内置的 30 条示例批次，方便完整体验 Feed 和收藏。

## 验证

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm exec tsx scripts/smoke-sources.ts
```

最后一条命令会实时请求三个公开信源，只输出解析数量、行业覆盖和最终配额，不打印完整正文。

## Supabase 配置

1. 新建一个 Supabase 项目。
2. 在 SQL Editor 执行 [`docs/database.sql`](docs/database.sql)。
3. 复制 `.env.example` 为 `.env.local` 并填写：

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

`SUPABASE_SERVICE_ROLE_KEY` 只能配置在服务端环境，不能改成 `NEXT_PUBLIC_` 变量。`CRON_SECRET` 建议使用至少 16 位随机字符串。

如果需要手动执行一次刷新：

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://YOUR_DOMAIN/api/cron/refresh
```

刷新结果至少需要 20 条才会写入；不足时继续保留上一批成功数据。

## Vercel 部署

1. 将本目录作为独立 Git 仓库推送到 GitHub。
2. 在 Vercel 创建新项目，根目录选择此项目。
3. 配置 `.env.example` 中的四个环境变量。
4. 部署后，`vercel.json` 会注册 `0 0 * * *`，即北京时间每天 08:00 的定时任务。

Vercel Hobby 只保证在设定小时内执行，因此免费方案可能在北京时间 08:00–08:59 之间完成更新。Pro 方案可获得分钟级调度精度。

## 数据边界

- 服务端只抓取三个站点公开页面，不需要登录 Cookie。
- 每日 Feed 批次保存在 Supabase。
- 用户收藏、手动行业、备注、略过记录和个人偏好保存在浏览器 localStorage，key 使用 `marketing-brain-v1-*`，不会读取或覆盖原 Brain 数据。
- 旧版收藏如果没有手动行业，升级后统一归入“其他”，可以在收藏页重新编辑。
- 收藏保存条目完整快照，未来 Feed 更新或源站内容下线后仍能查看标题、摘要、手动行业和个人备注。
