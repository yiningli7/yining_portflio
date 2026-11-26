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
 * 轮播（data-carousel）：当前项居中放大，两侧缩小排开，循环播放。
 * - slide 少于 8 张时复制一份，保证两侧始终有图，且换位跳转发生在屏幕外。
 * - 自动播放；悬停、键盘聚焦或页面隐藏时暂停；系统开启「减少动态效果」时不自动播放。
 * - 支持左右按钮、圆点、点击两侧图片、键盘左右键和触屏滑动。
 */
function initCarousel(root) {
  const track = root.querySelector(".kv-carousel-track");
  const originals = [...track.children];
  const count = originals.length;
  if (count < 2) return;

  const slides = [...originals];
  while (slides.length < 8) {
    originals.forEach((slide) => {
      const clone = slide.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.inert = true;
      clone.querySelectorAll("img").forEach((img) => (img.alt = ""));
      track.append(clone);
      slides.push(clone);
    });
  }
  const total = slides.length;

  const controls = root.querySelector(".kv-carousel-controls");
  const dotsWrap = root.querySelector("[data-carousel-dots]");
  const dots = originals.map((slide, index) => {
    const dot = el("button", { type: "button", "aria-label": `第 ${index + 1} 张` });
    dot.addEventListener("click", () => goTo(nearest(index)));
    dotsWrap?.append(dot);
    return dot;
  });
  if (controls) controls.hidden = false;
  root.classList.add("is-ready");

  let active = Number(root.dataset.carouselStart) || 0;
  let lastOffsets = [];

  // 与当前项的有向距离，归一化到 (-total/2, total/2]
  const offsetOf = (index) => {
    let offset = (index - active) % total;
    if (offset < 0) offset += total;
    if (offset > total / 2) offset -= total;
    return offset;
  };

  // 跳到逻辑序号 logical 时，选择离当前项最近的那一份
  function nearest(logical) {
    let best = logical;
    for (let index = logical; index < total; index += count) {
      if (Math.abs(offsetOf(index)) < Math.abs(offsetOf(best))) best = index;
    }
    return best;
  }

  function toPx(value) {
    const number = parseFloat(value);
    if (value.endsWith("vw")) return (number * window.innerWidth) / 100;
    if (value.endsWith("rem")) return number * 16;
    return number;
  }

  function layout() {
    const style = getComputedStyle(root);
    const width = slides[0].offsetWidth;
    const scale = parseFloat(style.getPropertyValue("--slide-scale")) || 0.75;
    const gap = toPx(style.getPropertyValue("--slide-gap").trim());
    const small = width * scale;

    slides.forEach((slide, index) => {
      const offset = offsetOf(index);
      const distance = Math.abs(offset);
      const x = distance === 0 ? 0 : Math.sign(offset) * (width / 2 + gap + small / 2 + (distance - 1) * (small + gap));
      // 从一端换到另一端时不做动画（发生在屏幕外）
      const wrapped = lastOffsets.length && Math.abs(offset - lastOffsets[index]) > 2;
      slide.classList.toggle("no-transition", Boolean(wrapped));
      slide.style.transform = `translateX(${x}px) scale(${distance === 0 ? 1 : scale})`;
      slide.classList.toggle("is-active", distance === 0);
      slide.style.zIndex = String(10 - distance);
      lastOffsets[index] = offset;
    });

    dots.forEach((dot, index) => dot.setAttribute("aria-current", String(index === active % count)));
  }

  function goTo(index) {
    active = ((index % total) + total) % total;
    layout();
  }

  const next = () => goTo(active + 1);
  const prev = () => goTo(active - 1);

  root.querySelector("[data-carousel-next]")?.addEventListener("click", next);
  root.querySelector("[data-carousel-prev]")?.addEventListener("click", prev);
  let swiped = false;
  slides.forEach((slide, index) =>
    slide.addEventListener("click", () => {
      if (swiped) return (swiped = false);
      goTo(index);
    })
  );

  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") next();
    if (event.key === "ArrowLeft") prev();
  });

  let startX = null;
  track.addEventListener("pointerdown", (event) => (startX = event.clientX));
  track.addEventListener("pointerup", (event) => {
    if (startX === null) return;
    const delta = event.clientX - startX;
    startX = null;
    swiped = Math.abs(delta) > 40;
    if (swiped) delta < 0 ? next() : prev();
  });

  // 自动播放
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let timer = null;
  let hovering = false;
  let focused = false;
  const stop = () => {
    clearInterval(timer);
    timer = null;
  };
  const start = () => {
    stop();
    if (reduceMotion || hovering || focused || document.hidden) return;
    timer = setInterval(next, 3500);
  };
  root.addEventListener("mouseenter", () => ((hovering = true), stop()));
  root.addEventListener("mouseleave", () => ((hovering = false), start()));
  root.addEventListener("focusin", () => ((focused = true), stop()));
  root.addEventListener("focusout", () => ((focused = false), start()));
  document.addEventListener("visibilitychange", start);
  window.addEventListener("resize", layout);

  layout();
  start();
}

document.querySelectorAll("[data-carousel]").forEach((root) => initCarousel(root));

/*
 * 滚动渐显：.reveal 元素进入视口时淡入上移，.reveal-line 的时间轴竖线向下延伸。
 * 只在支持 IntersectionObserver 且未开启「减少动态效果」时启用；否则内容直接显示。
 */
const revealTargets = document.querySelectorAll(".reveal, .reveal-line");
if (
  revealTargets.length &&
  "IntersectionObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  document.documentElement.classList.add("js-reveal");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
  );
  revealTargets.forEach((target) => revealObserver.observe(target));
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

// 项目页网格卡片：缩略图 + 标题 + 简介；没有 cover 时显示纯色占位
function projectCard(project) {
  const thumb = project.cover
    ? el("img", { class: "project-card-thumb", src: siteBase + project.cover, alt: "", loading: "lazy" })
    : el("div", { class: "project-card-thumb project-card-thumb--empty", "aria-hidden": "true" });
  const link = el("a", { href: siteBase + project.url }, [
    thumb,
    el("span", { class: "project-card-title", text: project.title }),
    el("span", { class: "project-card-summary", text: project.summary })
  ]);
  return el("li", { class: "project-card" }, [link]);
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
    const grid = slot.hasAttribute("data-project-grid");
    slot.replaceChildren(...portfolio.projects.map(grid ? projectCard : projectItem));
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
