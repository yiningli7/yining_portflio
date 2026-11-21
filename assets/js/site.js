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
