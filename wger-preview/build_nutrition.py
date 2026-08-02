# -*- coding: utf-8 -*-
"""
从 ~/wger-data/ingredients.json 精选高频中文基础食材，生成小程序分包数据。

策略（实测 3029 条中 2973 条带 brand，多为包装食品，不能靠 brand 空筛选）：
  1. 必须含中文名 + 有热量数据
  2. 常见食材关键词命中加权（鸡蛋/米饭/鸡肉/牛奶/苹果...）
  3. 名称越短越像基础食材（加权）
  4. 加工/饮料/品牌特征词降权
  5. 按得分降序取前 TARGET 条
输出：packageNutrition/utils/nutrition.js （CommonJS，<1MB）
"""
import json, os, re, sys

sys.stdout.reconfigure(encoding='utf-8')

SRC = os.path.expanduser("~/wger-data/ingredients.json")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "packageNutrition", "utils")
OUT = os.path.abspath(os.path.join(OUT_DIR, "nutrition.js"))
TARGET = 1000

COMMON = [
    "鸡蛋", "鸡胸", "鸡肉", "鸡腿", "牛肉", "猪肉", "羊肉", "瘦肉", "排骨",
    "鱼", "虾", "蟹", "虾仁", "三文鱼", "鳕鱼", "带鱼", "鱿鱼", "贝",
    "牛奶", "酸奶", "奶酪", "黄油", "奶油", "炼乳",
    "米饭", "大米", "粥", "面条", "面包", "馒头", "包子", "饺子", "馄饨", "饼", "吐司",
    "土豆", "马铃薯", "番茄", "西红柿", "白菜", "菠菜", "青菜", "黄瓜", "胡萝卜", "玉米",
    "茄子", "青椒", "洋葱", "西兰花", "生菜", "芹菜", "冬瓜", "南瓜", "藕", "蒜", "姜",
    "豆腐", "豆浆", "黄豆", "黑豆", "绿豆", "红豆", "毛豆",
    "花生", "核桃", "腰果", "杏仁", "芝麻", "瓜子", "板栗",
    "苹果", "香蕉", "橙子", "梨", "葡萄", "西瓜", "草莓", "蓝莓", "桃", "樱桃", "柠檬",
    "芒果", "木瓜", "荔枝", "柚子", "猕猴桃", "火龙果", "菠萝",
    "燕麦", "小米", "荞麦", "红薯", "紫薯", "山药", "薏米",
    "蘑菇", "香菇", "木耳", "海带", "紫菜", "银耳", "金针菇",
    "鸭", "鹅", "鹌鹑", "猪肝", "鸡肝",
    "红枣", "枸杞", "莲子", "百合", "桂圆",
]
EXCLUDE = [
    "饮料", "奶茶", "咖啡", "薯片", "饼干", "糖果", "巧克力", "罐头",
    "速食", "即食", "方便", "牌", "公司", "有限", "股份", "风味",
    "可乐", "雪碧", "果汁", "酒", "醋", "酱油", "调料", "酱", "蜜饯",
    "膨化", "果冻", "布丁", "派", "糕", "糖", "蜜",
]


def to_num(v):
    try:
        return round(float(v), 3)
    except (TypeError, ValueError):
        return None


def score(r):
    n = r.get("name") or ""
    s = 0
    for k in COMMON:
        if k in n:
            s += 10
    ln = len(n)
    if ln <= 4:
        s += 3
    elif ln <= 6:
        s += 1
    for e in EXCLUDE:
        if e in n:
            s -= 6
    if r.get("brand") and ln > 8:
        s -= 2
    return s


def main():
    data = json.load(open(SRC, encoding="utf-8"))
    cands = [r for r in data
             if r.get("has_chinese_name") and r.get("energy") is not None]
    cands.sort(key=score, reverse=True)
    if len(cands) > TARGET:
        cands = cands[:TARGET]

    out = []
    common_hit = 0
    for r in cands:
        name = r.get("name") or ""
        if any(k in name for k in COMMON):
            common_hit += 1
        brand = r.get("brand") or ""
        if brand in ("off", "OFF", None):
            brand = ""
        out.append({
            "id": r["id"],
            "name": name,
            "commonName": r.get("common_name") or "",
            "brand": brand,
            "energy": int(round(r["energy"])),
            "protein": to_num(r.get("protein")),
            "carbs": to_num(r.get("carbohydrates")),
            "fat": to_num(r.get("fat")),
            "fiber": to_num(r.get("fiber")),
            "sodium": to_num(r.get("sodium")),
            "isVegan": r.get("is_vegan"),
            "isVegetarian": r.get("is_vegetarian"),
        })

    os.makedirs(OUT_DIR, exist_ok=True)
    lines = ["// 自动生成，请勿手改。来源：wger / Open Food Facts (ODbL)",
             "// 精选约 %d 条高频中文基础食材，供 FitFlow 营养模块离线查询" % len(out),
             "const NUTRITION = ["]
    for it in out:
        lines.append("  " + json.dumps(it, ensure_ascii=False) + ",")
    lines.append("];")
    lines.append("")
    lines.append("function searchNutrition(q, limit) {")
    lines.append("  if (!q) return NUTRITION.slice(0, limit || 200);")
    lines.append("  var kw = String(q).trim().toLowerCase();")
    lines.append("  var res = NUTRITION.filter(function (x) {")
    lines.append("    return (x.name && x.name.toLowerCase().indexOf(kw) > -1) ||")
    lines.append("           (x.commonName && x.commonName.toLowerCase().indexOf(kw) > -1);")
    lines.append("  });")
    lines.append("  return limit ? res.slice(0, limit) : res;")
    lines.append("}")
    lines.append("")
    lines.append("function getById(id) {")
    lines.append("  return NUTRITION.find(function (x) { return x.id === id; }) || null;")
    lines.append("}")
    lines.append("")
    lines.append("module.exports = { NUTRITION: NUTRITION, searchNutrition: searchNutrition, getById: getById, count: NUTRITION.length };")
    open(OUT, "w", encoding="utf-8").write("\n".join(lines))

    size = os.path.getsize(OUT)
    print("精选条数     :", len(out))
    print("常见关键词命中:", common_hit, "(%.1f%%)" % (common_hit / len(out) * 100))
    print("输出文件     :", OUT)
    print("文件体积     : %.1f KB (%.2f MB)" % (size / 1024, size / 1024 / 1024))
    print("体积是否<1MB :", "是 ✓" if size < 1 * 1024 * 1024 else "否 ✗ 超包!")


if __name__ == "__main__":
    main()
