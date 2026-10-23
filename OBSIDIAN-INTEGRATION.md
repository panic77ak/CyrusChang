# 网站 AI 的 Obsidian 资料

网站只使用 `panic77ak/obsidian-notes` 中经过授权的 `ai/public/` Markdown。每篇笔记必须同时通过 `ai/_system/manifest.json` 的目录规则，以及笔记头部的 `ai_access: public`、有效的 `source_type` 和 `owner`、包含 `website` 与 `qa` 的 `use_for`。默认拒绝；`ai/context/`、`ai/reference/` 和 `ai/private/` 不进入公开回答。外部文章也不能被表述成常宸的原创观点。

当前发布使用固定快照，不会在访客提问时连接整个 Obsidian 仓库。服务器最多检索三篇相关的授权笔记，来源链接由 `/api/note?id=...` 提供。该接口重新检查授权，只返回转义后的公开正文；不会跟随笔记里的内部链接。

## 更新公开笔记

1. 在私有仓库中修改并确认目录及每篇笔记的标记。
2. 使用具备该仓库只读权限的 `OBSIDIAN_GITHUB_TOKEN` 运行 `node scripts/sync-obsidian.mjs`，刷新本地忽略提交的 `.local/obsidian-public.json`。脚本固定一个 Git 修订，只扫描 `ai/public/`；同步失败时保留旧快照。
3. 审核新快照，再更新 Vercel 项目 `cyrus-chang` 的 `OBSIDIAN_PUBLIC_SNAPSHOT` 环境变量，并重新部署。生产和预览环境分别配置；更新 GitHub 仓库本身不会自动更新网站 AI 的资料。

部署时 `scripts/build-site.mjs` 会再次检查快照，并只把批准的内容放进服务端函数。快照和 `DEEPSEEK_API_KEY` 都不得进入 Git、静态资源或浏览器代码。API 密钥仅放在 Vercel 的隐藏服务端环境变量中。若需紧急撤回公开笔记，先更新快照和线上环境变量并重新部署，再验证该笔记的 `/api/note` 链接已返回 404。
