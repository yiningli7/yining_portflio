// 全站共用的轻量脚本入口。
document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

// Figma 画板：按容器宽度等比缩放固定尺寸的设计稿。
const artboards = document.querySelectorAll("[data-artboard]");

function fitArtboards() {
  artboards.forEach((board) => {
    const width = Number(board.dataset.artboardWidth);
    const height = Number(board.dataset.artboardHeight);
    const stage = board.querySelector(".artboard-stage");
    if (!width || !height || !stage) return;
    const scale = board.clientWidth / width;
    stage.style.transform = `scale(${scale})`;
    board.style.height = `${height * scale}px`;
  });
}

if (artboards.length) {
  fitArtboards();
  window.addEventListener("resize", fitArtboards);
}

/*
 * 项目与 tag：数据来自 assets/data/projects.js（window.PORTFOLIO）。
 * 页面在 <body data-base="…"> 里写明到网站根目录的相对路径，例如项目页是 "../"。
 */
const portfolio = window.PORTFOLIO;
const siteBase = document.body.dataset.base || "";

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  });
  children.forEach((child) => node.append(child));
  return node;
}

function tagLabel(slug) {
  return portfolio.tags[slug]?.label ?? slug;
}

function tagHref(slug) {
  return `${siteBase}tags/?tag=${encodeURIComponent(slug)}`;
}

function tagList(slugs, current) {
  const list = el("ul", { class: "tag-list" });
  slugs.forEach((slug) => {
    const attrs = { class: "tag", href: tagHref(slug), text: tagLabel(slug) };
    if (slug === current) attrs["aria-current"] = "page";
    list.append(el("li", {}, [el("a", attrs)]));
  });
  return list;
}

function projectsWithTag(slug) {
  return portfolio.projects.filter((project) => project.tags.includes(slug));
}

function projectItem(project) {
  const link = el("a", { href: siteBase + project.url }, [
    el("span", { class: "project-item-title", text: project.title }),
    el("span", { class: "arrow", text: "→", "aria-hidden": "true" })
  ]);
  const meta = el("p", { class: "project-item-meta" }, [
    `${project.summary} `,
    el("span", { text: String(project.year) })
  ]);
  const item = el("li", { class: "project-item" }, [link, meta, tagList(project.tags)]);
  return item;
}

function renderProjectPageTags() {
  document.querySelectorAll("[data-project-tags]").forEach((slot) => {
    const project = portfolio.projects.find((p) => p.slug === slot.dataset.projectTags);
    if (!project) return;
    slot.replaceChildren(tagList(project.tags));
  });
}

function renderProjectLists() {
  document.querySelectorAll("[data-project-list]").forEach((slot) => {
    slot.replaceChildren(...portfolio.projects.map(projectItem));
  });
}

function renderTagPage() {
  const page = document.querySelector("[data-tag-page]");
  if (!page) return;

  const slug = new URLSearchParams(window.location.search).get("tag");
  const title = page.querySelector("[data-tag-title]");
  const lead = page.querySelector("[data-tag-lead]");
  const results = page.querySelector("[data-tag-results]");
  const allTags = page.querySelector("[data-tag-all]");
  const known = slug && portfolio.tags[slug];

  if (known) {
    const matches = projectsWithTag(slug);
    title.textContent = tagLabel(slug);
    lead.textContent = `共 ${matches.length} 个项目带有这个 tag。`;
    document.title = `${tagLabel(slug)} | Yining Portfolio`;
    results.replaceChildren(...matches.map(projectItem));
  } else {
    title.textContent = "全部 Tags";
    lead.textContent = slug ? `没有找到 “${slug}” 这个 tag，可以从下面的列表里选择。` : "选择一个 tag，查看相关项目。";
    results.replaceChildren();
  }

  // 所有 tag 及其项目数量，便于在 tag 之间切换
  const list = tagList(Object.keys(portfolio.tags), known ? slug : null);
  list.querySelectorAll("a").forEach((link, index) => {
    const count = projectsWithTag(Object.keys(portfolio.tags)[index]).length;
    link.append(el("span", { class: "tag-count", text: ` ${count}` }));
  });
  allTags.replaceChildren(list);
}

if (portfolio) {
  renderProjectPageTags();
  renderProjectLists();
  renderTagPage();
}
