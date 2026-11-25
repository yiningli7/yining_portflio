/*
 * 全站项目数据：项目列表、项目页的 tag 区、tag 聚合页都从这里生成。
 *
 * 新增项目：在 projects 里加一条，tags 填下面 TAGS 里已有的 slug。
 * 新增 tag：先在 TAGS 里登记（slug 用小写英文加连字符，label 是页面上显示的名字），
 *           再在项目里引用，保证全站写法一致。
 * 所有路径都相对网站根目录书写，不要以 / 开头。
 */
window.PORTFOLIO = {
  tags: {
    "branding": { label: "Branding" },
    "ip-design": { label: "IP Design" },
    "campaign-design": { label: "Campaign Design" },
    "key-visual": { label: "Key Visual" }
  },

  projects: [
    {
      slug: "lark-player-ip",
      title: "Lark Player IP",
      summary: "面向南美市场的音乐播放器品牌 IP 形象升级。",
      url: "projects/lark-player-ip.html",
      cover: "assets/images/projects/lark-player-ip/a2c5b.png",
      year: 2026,
      tags: ["branding", "ip-design"]
    },
    {
      slug: "lenovo-campus-2027",
      title: "联想 2027 校园招聘视觉设计",
      summary: "以「联想你的未来」为主题的 2027 校招主视觉设计。",
      url: "projects/lenovo-campus-2027.html",
      cover: "assets/images/projects/lenovo-campus-2027/f91d2.png",
      year: 2026,
      tags: ["campaign-design", "key-visual"]
    }
  ]
};
