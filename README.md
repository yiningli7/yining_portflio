# Yining Portfolio

一个使用原生 HTML、CSS 和 JavaScript 构建的静态作品集网站，可直接部署到 GitHub Pages。

## 目录结构

```text
.
├── index.html                  # Home
├── aboutme/index.html          # About Me
├── projects/
│   ├── index.html              # Projects 列表
│   └── project-template.html   # 单个项目页面模板
├── tags/index.html             # Tag 聚合页（tags/?tag=branding）
├── artifacts/index.html        # Artifacts
└── assets/
    ├── css/site.css            # 全站唯一 CSS
    ├── js/site.js              # 全站共用脚本
    └── images/projects/        # 项目图片（按项目分文件夹）
```

## 添加一个项目

1. 复制 `projects/project-template.html` 并按项目命名，例如 `projects/my-project.html`，`<body>` 上保留 `data-base="../"`。
2. 在 `assets/data/projects.js` 的 `projects` 里加一条数据（`slug`、`title`、`summary`、`url`、`year`、`tags`）。项目列表页和 tag 聚合页会自动出现这个项目，不需要改页面代码。
3. `tags` 只能填 `projects.js` 里 `tags` 字典已有的 slug；需要新 tag 时先在字典里登记显示名，保证全站写法一致。
4. 项目页里放 `<div data-project-tags="项目slug"></div>`，tag 会自动生成，点击进入 `tags/?tag=slug` 聚合页。版式可参考 `projects/lark-player-ip.html` 的 `case-*` 区块。
5. 将图片放在 `assets/images/projects/my-project/`，用 `../assets/images/projects/my-project/图片名` 引用。
6. 所有页面继续引用 `assets/css/site.css`，不要创建重复样式文件。
7. 修改 `site.css`、`site.js` 或 `projects.js` 后，把所有页面里的 `?v=数字` 加 1，避免浏览器用旧缓存导致页面错乱。

## 发布

GitHub Pages 从 `main` 分支根目录发布。推送到 `main` 后，网页会自动更新。
