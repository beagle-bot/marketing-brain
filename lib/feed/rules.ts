import type { Industry, MarketingItem } from "@/lib/feed/types";

const nativeIndustryMap: Record<string, Industry> = {
  "网站与软件": "互联网",
  "电商零售": "互联网",
  "游戏": "互联网",
  "电子产品": "硬件",
  "家电": "硬件",
  "药品诊疗": "医药",
  "营养保健品": "医药",
  "车": "汽车",
  "金融保险": "金融",
  "服饰与箱包": "快时尚"
};

const industryKeywords: Array<[Industry, string[]]> = [
  ["茶饮", ["瑞幸", "luckin", "喜茶", "奈雪", "霸王茶姬", "蜜雪冰城", "古茗", "茶百道", "茶饮", "果茶", "奶茶"]],
  ["医药", ["医药", "医疗", "药房", "制药", "健康", "诊疗", "疾病", "保健品"]],
  ["汽车", ["汽车", "车展", "车型", "新车", "比亚迪", "小米汽车", "蔚来", "理想汽车", "宝马", "奥迪", "奔驰"]],
  ["金融", ["金融", "银行", "保险", "支付", "信用卡", "理财", "基金", "证券", "支付宝"]],
  ["快时尚", ["快时尚", "zara", "h&m", "uniqlo", "优衣库", "服饰", "服装", "穿搭", "女装", "男装", "鞋服"]],
  ["硬件", ["手机", "电脑", "芯片", "智能硬件", "数码", "家电", "小米", "华为", "vivo", "oppo", "大疆"]],
  ["互联网", ["互联网", "app", "平台", "电商", "小红书", "抖音", "微博", "b站", "哔哩哔哩", "美团", "京东", "天猫"]]
];

const noiseTerms = ["招聘频道", "职位描述", "简历发送", "点击报名", "门票购买"];
const caseTerms = ["案例", "复盘", "联名", "campaign", "传播", "营销", "社媒", "广告", "创意", "宣发"];
const pressReleaseTerms = ["荣获", "喜报", "获奖", "战略合作", "圆满举行"];

function textFor(item: MarketingItem) {
  return `${item.title} ${item.summary} ${item.author ?? ""} ${item.nativeCategory ?? ""}`.toLowerCase();
}

export function classifyIndustry(item: MarketingItem): Industry {
  if (item.nativeCategory && nativeIndustryMap[item.nativeCategory]) return nativeIndustryMap[item.nativeCategory];
  const text = textFor(item);
  for (const [industry, keywords] of industryKeywords) {
    if (keywords.some((keyword) => text.includes(keyword.toLowerCase()))) return industry;
  }
  return "其他";
}

export function isNoise(item: MarketingItem) {
  const text = textFor(item);
  if (noiseTerms.some((term) => text.includes(term))) return true;
  return item.title.trim().length < 6 && item.summary.trim().length < 24;
}

function ageScore(publishedAt: string | undefined, now: Date) {
  if (!publishedAt) return 0;
  const published = new Date(publishedAt).getTime();
  if (Number.isNaN(published)) return 0;
  const days = Math.max(0, (now.getTime() - published) / 86_400_000);
  return Math.max(0, 30 - Math.floor(days * 2));
}

export function scoreItem(item: MarketingItem, now = new Date()): MarketingItem {
  const text = textFor(item);
  const matchedCaseTerms = caseTerms.filter((term) => text.includes(term)).length;
  const matchedPressTerms = pressReleaseTerms.filter((term) => text.includes(term)).length;
  const completeness = [item.summary.length >= 40, Boolean(item.author), Boolean(item.publishedAt), Boolean(item.nativeCategory)].filter(Boolean).length;
  const score = Math.max(0, ageScore(item.publishedAt, now) + matchedCaseTerms * 8 + completeness * 5 - matchedPressTerms * 14);
  const reasons = [
    matchedCaseTerms ? `命中 ${matchedCaseTerms} 个案例信号` : "",
    completeness >= 3 ? "信息完整" : "",
    ageScore(item.publishedAt, now) >= 24 ? "近期发布" : ""
  ].filter(Boolean);

  return {
    ...item,
    industry: classifyIndustry(item),
    contentTags: Array.from(new Set([...item.contentTags, ...caseTerms.filter((term) => text.includes(term))])).slice(0, 5),
    score,
    selectionReason: reasons.join("·") || "最新候选"
  };
}
