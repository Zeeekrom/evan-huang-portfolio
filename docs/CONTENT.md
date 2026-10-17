# 内容层说明

> **用途**：这份文档说明网站的内容存在哪里、怎么流动、加一条内容会自动影响到什么。
> 目标读者是准备往里加内容的人（Evan），以及后续接手的 Claude / Codex 会话。
>
> 架构与交互的说明在 [ARCHITECTURE.md](ARCHITECTURE.md)，这份只谈内容。
>
> **要在代码之外写内容，看 [CONTENT-SLOTS.md](CONTENT-SLOTS.md)** —— 那份列出每一个可写字段的路径、格式与它出现在界面的哪里，自动生成，`npm run content:map` 刷新。

---

## 0. 一句话

**全站只有一个内容源：根目录的 `content/*.json`。** 其余一切——经典首页、36 张画布幻灯、语义 DOM、⌘K 搜索、sitemap、AI 向导的知识库与导览路线——全部由它派生。

**加内容 = 改一个 JSON 文件。** 不需要碰任何代码。见 [`content/README.md`](../content/README.md)。

`src/data/content.ts` 现在是一层**带类型的加载器**：它声明每个集合必须长什么样，并把 JSON 断言成那个类型。缺中文、bullet 写成裸字符串、项目没有 slug——全部在 `npm run build` 时失败，到不了页面上。

---

## 1. 数据流

```
                    content/*.json
                    （唯一手写的内容源）
                             │
                    src/data/content.ts
                    （类型断言层）
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   经典首页组件         src/slides/slides.ts    SEO / 元数据
   Hero / About        （幻灯生成器）           sitemap.ts
   Projects / Skills          │                 robots.ts
   Experience 等              │                 opengraph-image.tsx
                              │
                    slides[]（当前 36 张）
                    menu[]（22 项）
                    anchors[]（22 个）
                              │
        ┌──────────┬──────────┼──────────┬──────────────┐
        │          │          │          │              │
   SemanticDeck  Canvas   SearchPalette Toolbar      lib/tour.ts
   语义 DOM      PixiJS    ⌘K 索引      菜单面板      导览路线
   （SEO/无JS）  画布                                     │
                                                          │
                              ┌───────────────────────────┘
                              │
                    每站指令内嵌该幻灯正文
                    （随 response.create 下发）

                    scripts/gen-presenter.mjs
                    读 out/ 的导出 HTML → api/presenter.json
                    （AI 向导的会话知识库，17.9K 字符）
```

**两条通往 AI 的路径，来源不同，都要注意：**

| 路径 | 来源 | 何时更新 |
|---|---|---|
| 会话知识库（对话模式用） | `presenter.json`，由 `gen-presenter.mjs` 从**构建产物** `out/` 提取 | 必须手动跑脚本 + 重新部署函数应用 |
| 导览每站指令（导览模式用） | 客户端 `slides.ts` 直接取正文 | 随静态站部署自动更新 |

> ⚠️ 加完内容如果只部署静态站，**导览会说新内容，但对话模式还停留在旧知识**。见 §6。

---

## 2. `content.ts` 的结构

### 2.1 命名约定

| 类型 | 含义 | 例子 |
|---|---|---|
| `Localized` = `{ en: string; zh: string }` | **散文**。会翻译的东西 | 描述、要点、角色名 |
| `string` | **专名 / 日期 / 技术名 / URL**。不翻译 | `"Tencent"`、`"Jul 2026 – Present"`、`"ROS 2"` |

这个区分是刻意的：把 `"PyTorch"` 做成双语字段没有意义，而且会让人误以为需要填中文。

### 2.2 各导出项

| 导出 | 类型 | 当前条数 | 说明 |
|---|---|---|---|
| `site` | object | — | `url` `name` `nameZh` `legalName` `location`（双语）`email` `linkedin` `github` `resumeFile` |
| `nav` | `{id, label}[]` | 7 | 经典首页的导航锚点 |
| `hero` | object | — | 首屏问候语、角色、标语、两个 CTA、求职状态 |
| `about` | `{heading, paragraphs, facts}` | 4 段 | **`paragraphs` 是 `who-am-i` 幻灯的正文**；后两段还复用为 `current-focus` |
| `skillGroups` | `SkillGroup[]` | 6 | 每组一个标题 + 一串技术名 |
| `projects` | `Project[]` | 8 | 见下 |
| `internships` | `ExperienceItem[]` | 4 | 公司实习 |
| `startups` | `ExperienceItem[]` | 2 | 创业/自营，与 internships 同结构 |
| `publications` | `PublicationItem[]` | 2 | 论文 |
| `education` | `EducationItem[]` | 4 | 学历 |
| `contact` | object | — | 联系区标题与副标题 |
| `footer` | object | — | 页脚 |

### 2.3 四个核心接口

```ts
interface Project {
  slug: string;          // 唯一，用来生成幻灯 id 与锚点，只能是 [a-z0-9-]
  title: string;         // ⚠️ 不是 Localized，见 §5.3
  period: string;        // "Jul 2026 – Present"
  description: Localized;
  bullets: Localized[];  // 每 2 条生成一张幻灯
  tags: string[];        // 技术栈
  link?: string;         // 仓库/演示链接，有则幻灯上出现按钮
  featured?: boolean;    // true = 该项目全部幻灯用暗色主题
}

interface ExperienceItem {
  org: string;           // 公司名，用来生成 id（自动 slug 化）
  role: Localized;
  period: string;
  location?: string;
  type?: Localized;      // 如「实习 / 兼职」
  bullets: Localized[];  // 每 2 条生成一张幻灯
}

interface PublicationItem {
  title: Localized;
  venue: string;         // "ACM, IECA 2026"
  date: string;
  note: Localized;       // 一段说明，成为该论文幻灯的正文
}

interface EducationItem {
  degree: Localized;
  school: string;
  period: string;
  detail?: string;       // "GPA 3.77/4.00 · Rank 1/206"
}
```

---

## 3. 一条内容会生成几张幻灯

生成规则在 `src/slides/slides.ts`，**全自动，无需手工排版**。

### 3.1 每个 `Project`

| 幻灯 | id | 内容来源 |
|---|---|---|
| 开篇 | `{slug}` | period + title + description + tags（技术栈），有 `link` 则加「打开仓库 ↗」 |
| 要点 ×N | `{slug}-highlight-1`、`-2`… | **每 2 条 bullet 一张** |

**张数 = 1 + ceil(bullets.length / 2)**
3 条 bullets → 3 张；4 条 → 3 张；5 条 → 4 张。

> 开篇原本是三张：`-cover`、`-intro`、`-details`。前两张标题和描述完全相同，`-cover` 唯一独有的内容是一个跳到紧邻下一张的链接；`-details` 第三次重复标题，只为展示一个已经是 `-intro` 眉题的 period。三张卡，一张卡的信息量。

### 3.2 每个 `ExperienceItem`

前缀：`internships` → `work-`，`startups` → `venture-`。

| 幻灯 | id |
|---|---|
| 工作内容 ×N | `{prefix}-{slug(org)}-work-1`… |

**张数 = ceil(bullets.length / 2)**（没有 bullets 时为 1 张，好让菜单和锚点有落点）

第一张带上单位信息：眉题是 role，标题是 org，正文是 `period · type · location`，锚点也在它身上。

> 原本前面还有 `-cover` 和 `-details` 两张。`-cover` 就是被反复抱怨的那种页面——公司名字放得很大，一个职位，一段日期，然后整张卡再没别的；`-details` 把同样的职位和同样的日期又列成一张表。两张都没说对方没说过的东西。

`slug(org)` 规则：转小写 → 非字母数字换成 `-` → 去首尾 `-` → **截断到 40 字符**。
⚠️ 两个公司名如果前 40 字符 slug 化后相同，id 会撞车。

### 3.3 每篇 `PublicationItem`

一篇 = 一张，id 是 `paper-1`、`paper-2`…（**按序号，不按内容**）。

### 3.4 固定幻灯

`intro`（首屏）、`main-menu`、`who-am-i`、`current-focus`、`capabilities`、`projects-index`、`experience-index`、`research-index`、`education`、`contact`。

索引页（`*-index`）的条目**自动**由对应数组生成，加一个项目就自动出现在 `projects-index` 上。

### 3.5 当前规模

```
8 projects + 4 internships + 2 startups + 2 publications + 4 education
        ↓
36 张幻灯 · 22 个菜单项（8 顶层 + 14 缩进）· 22 个锚点
```

---

## 4. 联动清单：加一条内容自动影响什么

在 `content.ts` 里加一个项目，**以下全部自动跟上，无需改动**：

| 自动更新 | 机制 |
|---|---|
| 经典首页的项目区 | `Projects.tsx` 直接读数组 |
| 画布上的 4–6 张新幻灯 | `slides.ts` 生成，`grid.ts` 按索引分配世界坐标 |
| `projects-index` 索引页新增一行 | 由数组 map 出来 |
| 左上菜单新增一条缩进项 | `menu` 由 projects map 出来 |
| ⌘K 搜索能搜到 | `SearchPalette` 索引全部幻灯正文 |
| ⌘K 面板的 Quick Access | 由 `menu` 的非缩进项派生 |
| sitemap 新增锚点 URL | `anchors` 由带 `anchor` 的幻灯派生 |
| 语义 DOM（SEO / 无 JS / 屏幕阅读器） | `SemanticDeck` 遍历同一个 `slides` |
| **AI 导览会讲到它** | 若是顶层章节则进路线；正文随轮下发 |

**不会自动更新的只有一样**：`presenter.json`（对话模式的知识库）。

不过 CI 现在会**盯着它**——内容改了却没重新生成 `presenter.json`，构建直接失败并告诉你跑哪条命令。它无法代你部署函数应用（仓库里没有那份凭据），但不会再让两边悄悄错开。见 §6。

---

## 5. 双语现状

### 5.1 更正一处早先的错误说法

我先前说过「内容只有约三成双语」。**那是错的**——当时数的是原始字符串字面量，把技术名、日期、URL 都算成了「未翻译」。

`npm run content` 实测（遍历所有内容数组的 `Localized` 字段）：

```
Localized 字段       73
有问题的             0        ← 无缺中文、无中英文相同
```

**散文部分双语覆盖是完整的。** 剩下的裸英文串全部是专名：学校名、公司名、会议名、GPA 字符串、项目标题。

### 5.2 所以双语开关卡在哪

**只卡在 UI，不卡在内容。** `locale` 目前写死在 [src/app/explore/page.tsx](../src/app/explore/page.tsx)：

```tsx
<ExploreShell locale="en" />
<SemanticDeck locale="en" />
```

整条链路（`t()` 解析、`Localized` 类型、组件 prop）都是通的，缺的只是一个能把它切成 `"zh"` 的开关，以及切换后的状态持久化。

### 5.3 唯一需要你拍板的双语问题

`Project.title` 是 `string` 而不是 `Localized`。所以中文模式下项目标题仍是英文：

- `"UTAS Motorsport — LiDAR Autonomy"`
- `"AI Town Multi-Agent Simulation"`

这些算专名还是算需要翻译的短语？**如果要中文标题，`Project.title` 得改成 `Localized`**，改动会波及 `projectSlides()`、`Projects.tsx`、`menu` 生成。不难，但要先定。

`ExperienceItem.org`（公司名）同理，不过公司名不翻译是更常见的做法。

---

## 6. 加完内容之后：怎么验证与部署

### 6.1 本地验证

```bash
npm run content       # 清点 + 体检（下面详述）
npm run content:map   # 重新生成 CONTENT-SLOTS.md 槽位清单
npm run build         # 类型检查 + 静态导出，内容写错这里就会挂
npm test              # 39 项，含导览路线的断言
```

`npm run content`（`scripts/check-content.mjs`）查的是**构建能通过、但依然是错的**那类问题：

| 判为「问题」（退出码 1） | 判为「提醒」 |
|---|---|
| 幻灯 id 重复 | 正文超过导览的 1200 字符上限 |
| project slug 重复或含非法字符 | 正文超过目录的 600 字符上限 |
| 两个公司名 slug 化后撞车 | 公司名 slug 已到 40 字符上限 |
| `Localized` 字段缺中文 / 中英文相同 | 导览站点内容偏薄（< 150 字符）|

当前输出：

```
内容条目   projects 8 · internships 4 · startups 2 · publications 2 · education 4 · skillGroups 6
生成结果   36 张幻灯 · 22 个菜单项（顶层 8）· 22 个锚点
双语       73 个 Localized 字段，0 个有问题
长度       0 张超导览上限，2 张超目录上限
导览站点   8 站，其中 2 站内容偏薄

提醒 (4)
  · who-am-i 正文 1085 字符，presenter.json 里会被截到 600
  · capabilities 正文 746 字符，presenter.json 里会被截到 600
  · 导览第 1 站 intro 只有 68 字符可讲
  · 导览第 8 站 contact 只有 98 字符可讲
```

**这四条现在就值得处理**，见 §10。

### 6.2 部署

| 改了什么 | 要做什么 |
|---|---|
| 只改 `content.ts` | `git push` → Actions 自动构建部署静态站 |
| **同时希望对话模式知道新内容** | 还要重新生成并部署 `presenter.json`，见下 |

```bash
npm run build                      # presenter.json 从 out/ 提取，必须先构建
node scripts/gen-presenter.mjs     # 写 api/presenter.json
# 然后重新部署函数应用（打包务必用 Python zipfile，见 spec §13.2）
```

⚠️ **`Compress-Archive` 打的包会让整个函数应用变砖**（反斜杠路径条目，Linux 端解不出目录）。规格书 §13.2 有完整说明。

---

## 7. 约束与陷阱

| # | 约束 |
|---|---|
| 1 | **`slug` 必须唯一且只含 `[a-z0-9-]`**。它同时是幻灯 id、锚点、`slide://` 路由目标 |
| 2 | 公司名 slug 化后**截断到 40 字符**，长名字有撞车风险 |
| 3 | `bullets` 每 2 条一张幻灯。要控制幻灯数就控制 bullet 数 |
| 4 | 论文 id 是 `paper-N` 按序号。**中间插入一篇会让后面所有论文的锚点位移**，已发出去的链接会失效 |
| 5 | 幻灯正文进 AI 导览指令时**截断到 1200 字符**（`lib/tour.ts` 的 `MAX_SOURCE_CHARS`）|
| 6 | `presenter.json` 里每张幻灯的正文**截断到 600 字符**（`gen-presenter.mjs` 的 `plain()`）|
| 7 | AI 被明确禁止说出幻灯上没有的事实。**内容写得薄，它就说得少**——这是刻意的，不是 bug |
| 8 | 网格坐标由**索引**决定。在中间插入内容会让后面所有幻灯的世界坐标位移；这不影响正确性（导航全按 id），但截图/录屏会对不上 |

---

## 8. 还没接的部分

| 项 | 状态 |
|---|---|
| **双语开关** | 链路已通，缺 UI 开关 + 持久化。见 §5.2 |
| **图片 / 视频** | `Slide` 类型里有 `image` / `images` / `video` / `youtubeUrl` 四个字段，画布布局也支持 `media: "right"` 槽位，但**生成器一次都没设置过**。要用得先决定素材放哪、怎么在 `content.ts` 里表达 |
| **行为故事 / STAR** | 目前没有对应的数据结构。若要加「我如何工作」这类内容，需要新增一个导出（例如 `stories: StoryItem[]`）并写对应的生成函数 |
| **个人语料库对接** | 未开始。语料库产出的东西最终要落成 `content.ts` 里的结构化条目 |
| **便利贴跨刷新恢复** | 留言已落库，但重载不会把别人的便利贴拉回画布 |

---

## 9. 校验脚本当前查出的四件事

### 9.1 ⚠️ `who-am-i` 有 45% 的内容 AI 在对话模式下看不到

`presenter.json` 里每张幻灯的正文被截断到 **600 字符**（`gen-presenter.mjs` 的 `plain()`）。而 `who-am-i` 的正文是 **1085 字符**。

**也就是说：关于你本人最重要的那一页，后 485 字符在对话模式下不存在。** 被截掉的正是第三、四段——UTAS Motorsport、ROS 2/CARLA、云基础设施、Azure。有人问「他现在在做什么」，对话模式答不上来。

`capabilities`（746 字符）同理，最后两组技能被截掉。

三个可选做法，要你定：

| 做法 | 代价 |
|---|---|
| 把 600 提到 2000 | `presenter.json` 从 17.9K 涨到约 40K，每次会话的输入 token 变多 |
| 只对锚点幻灯放宽，封面页仍 600 | 实现稍复杂，但精准 |
| 拆分 `who-am-i` 为两张幻灯 | 改的是内容结构，会多一张幻灯 |

我倾向第二个：真正长的只有那几张，为它们放宽最省。

### 9.2 导览第 1 站和第 8 站没什么可讲

`intro`（68 字符）是首屏，只有姓名和一句头衔；`contact`（98 字符）只有邮箱和一句招呼。

向导被禁止说幻灯上没有的东西，所以这两站它只能干巴巴念一句。**这是内容问题，不是代码问题**——要么给这两张加点内容，要么把它们从导览路线里去掉（改 `lib/tour.ts` 的 `MAX_STOPS` 逻辑）。

---

## 10. 给语料库对接的建议

你要往里灌内容时，**最省事的形式是直接给我结构化条目**，例如：

```ts
{
  slug: "some-project",
  title: "Project Name",
  period: "Mar 2025 – Jun 2025",
  description: {
    en: "One or two sentences on what it is and why it exists.",
    zh: "一两句话说明它是什么、为什么存在。",
  },
  bullets: [
    { en: "What you did, with a number in it if possible.", zh: "你做了什么，尽量带数字。" },
    { en: "…", zh: "…" },
  ],
  tags: ["Python", "FastAPI", "PostgreSQL"],
  link: "https://github.com/...",
  featured: false,
}
```

如果语料库产出的是散文，给我散文也行，我来拆成上面的结构——但**中文我不会代写**。措辞是你的，我代写的不会是你的声音。

需要留意的是 §7 的第 7 条：**AI 向导只会说幻灯上写着的东西**。所以内容写得越具体（数字、系统名、你实际做的决定），向导讲出来的东西就越有信息量；写得笼统，它就只能笼统。
