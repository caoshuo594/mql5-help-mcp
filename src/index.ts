#!/usr/bin/env node

/**
 * MQL5 Help MCP Server
 * 文档/电子书一体化检索，基础迁移/错误提示
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 文档根目录（多资料库）：MQL5_HELP（官方）、两本电子书（可选）
const ROOT_CANDIDATES = [
  { key: "MQL5_HELP", abs: path.resolve(__dirname, "..", "MQL5_HELP") },
  { key: "MQL5_Algo_Book", abs: path.resolve(__dirname, "..", "MQL5_Algo_Book") },
  { key: "Neural_Networks_Book", abs: path.resolve(__dirname, "..", "Neural_Networks_Book") },
];

// 简单的HTML标签清理
function stripHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// 文档索引缓存
type DocEntry = { absPath: string; relPath: string; repo: string };
let docIndex: Map<string, DocEntry> | null = null; // key -> entry（key为检索键）
let nameIndex: Map<string, DocEntry> | null = null; // 文件名（无扩展）-> entry

// MQL4→MQL5 常见迁移映射/别名（用于智能搜索提示）
const MIGRATION_HINTS: Record<string, { replacement: string; hint: string; targetKeys: string[] }> = {
  "resultcode": {
    replacement: "ResultRetcode",
    hint: "CTrade 结果方法在 MQL5 中改为 ResultRetcode()",
    targetKeys: ["ctrade", "trade"],
  },
  "symbol()": {
    replacement: "_Symbol",
    hint: "预定义变量由 Symbol() 迁移为 _Symbol",
    targetKeys: ["_symbol", "symbol"],
  },
  "period()": {
    replacement: "_Period",
    hint: "预定义变量由 Period() 迁移为 _Period",
    targetKeys: ["_period", "period"],
  },
  "ima": {
    replacement: "IndicatorCreate",
    hint: "iMA 在 MQL5 中通常通过 IndicatorCreate 构建",
    targetKeys: ["indicatorcreate", "icustom"],
  },
};

// 递归读取目录下的文件
async function walkDir(rootAbs: string, repoKey: string, baseRel = ""): Promise<DocEntry[]> {
  const entries: DocEntry[] = [];
  let dirents;
  try {
    dirents = await fs.readdir(path.join(rootAbs, baseRel), { withFileTypes: true });
  } catch {
    return entries; // 目录不存在则跳过
  }

  for (const d of dirents) {
    const relPath = path.join(baseRel, d.name);
    const absPath = path.join(rootAbs, relPath);
    if (d.isDirectory()) {
      const sub = await walkDir(rootAbs, repoKey, relPath);
      entries.push(...sub);
    } else if (/\.(htm|html|md)$/i.test(d.name)) {
      entries.push({ absPath, relPath, repo: repoKey });
    }
  }
  return entries;
}

// 构建文档索引（多根目录、递归）
async function buildIndex(): Promise<Map<string, DocEntry>> {
  if (docIndex) return docIndex;

  docIndex = new Map();
  nameIndex = new Map();

  // 构建有效根目录列表
  const roots: { key: string; abs: string }[] = [];
  for (const c of ROOT_CANDIDATES) {
    try { await fs.access(c.abs); roots.push({ key: c.key, abs: c.abs }); } catch {}
  }

  // 遍历并索引
  for (const r of roots) {
    const files = await walkDir(r.abs, r.key);
    for (const f of files) {
      const base = path.basename(f.relPath).toLowerCase();
      const noExt = base.replace(/\.(htm|html|md)$/i, "");

      // 主键：文件名（无扩展）
      docIndex.set(noExt, f);
      if (!nameIndex.has(noExt)) nameIndex.set(noExt, f);

      // 类名变体（去掉开头 C）
      if (noExt.startsWith("c") && noExt.length > 2) {
        docIndex.set(noExt.substring(1), f);
      }

      // ONNX 相关关键词
      if (noExt.includes("onnx")) {
        docIndex.set("onnx", f);
        docIndex.set("onnx_guide", f);
        docIndex.set("ml", f);
        docIndex.set("ai", f);
      }

      // 电子书目录粗粒度前缀
      if (f.repo === "MQL5_Algo_Book") docIndex.set(`algo_${noExt}`, f);
      if (f.repo === "Neural_Networks_Book") docIndex.set(`nn_${noExt}`, f);
    }
  }

  console.error(`📚 索引已建立: ${docIndex.size} 个键，${nameIndex.size} 个文件名索引`);
  return docIndex;
}

// 搜索文档（含错误文本与迁移提示）
async function searchDocs(query: string, limit: number = 10): Promise<string> {
  const index = await buildIndex();
  const queryLower = query.toLowerCase();

  // 智能错误识别（undeclared identifier ...）
  const smartHints: string[] = [];
  const undeclaredMatch = queryLower.match(/undeclared\s+identifier\s+'?"?([a-z_][a-z0-9_]*)'?"?/i) ||
                          queryLower.match(/undeclared\s+identifier\s+([a-z_][a-z0-9_]*)/i);
  if (undeclaredMatch && undeclaredMatch[1]) {
    const missing = undeclaredMatch[1].toLowerCase();
    if (MIGRATION_HINTS[missing]) {
      const h = MIGRATION_HINTS[missing];
      smartHints.push(`🩺 诊断：未声明标识符 '${missing}' → 可能应改为 '${h.replacement}'（${h.hint}）`);
    }
  }

  // 迁移建议（直接包含左侧关键词时）
  for (const [k, v] of Object.entries(MIGRATION_HINTS)) {
    if (queryLower.includes(k)) smartHints.push(`🔁 迁移建议：'${k}' → '${v.replacement}'（${v.hint}）`);
  }

  // 精确匹配
  const exact = index.get(queryLower);

  // 模糊匹配 + 迁移目标扩展
  const expansionKeys = new Set<string>();
  for (const [k, v] of Object.entries(MIGRATION_HINTS)) {
    if (queryLower.includes(k)) v.targetKeys.forEach((t) => expansionKeys.add(t));
  }
  if (undeclaredMatch && undeclaredMatch[1]) {
    const m = undeclaredMatch[1].toLowerCase();
    if (MIGRATION_HINTS[m]) MIGRATION_HINTS[m].targetKeys.forEach((t) => expansionKeys.add(t));
  }

  const results: Array<{ entry: DocEntry; key: string; score: number }> = [];
  for (const [key, entry] of index.entries()) {
    let matched = false;
    let score = 0;
    if (key === queryLower) { matched = true; score = 1.0; }
    else if (key.includes(queryLower)) { matched = true; score = queryLower.length / Math.max(2, key.length); }
    else if (expansionKeys.has(key)) { matched = true; score = 0.95; }
    if (matched) results.push({ entry, key, score });
  }
  results.sort((a, b) => b.score - a.score);

  let out = `🔍 搜索: "${query}"\n\n`;
  if (smartHints.length) out += smartHints.map((s) => `• ${s}`).join("\n") + "\n\n";
  if (exact) out += `✅ 精确匹配: ${exact.relPath}  (来源: ${exact.repo})\n\n`;

  if (results.length > 0) {
    out += `📋 相关文档 (${Math.min(results.length, limit)} / ${results.length})：\n`;
    results.slice(0, limit).forEach((m, i) => {
      out += `  ${i + 1}. ${m.entry.relPath}  (${m.entry.repo})\n`;
    });
  } else if (!exact) {
    out += `❌ 未找到匹配文档\n`;
    out += `💡 提示: 使用英文关键字，如 OrderSend, CopyBuffer；或尝试更短关键词`;
  }

  return out;
}

// 读取文档内容（多目录）
async function getDoc(filename: string): Promise<string> {
  const index = await buildIndex();
  const raw = filename.trim();
  const lower = raw.toLowerCase();

  // 1) 优先按 key（无扩展）
  let entry = index.get(lower.replace(/\.(htm|html|md)$/i, ""));

  // 2) 按文件名（无扩展）
  if (!entry && nameIndex) {
    const nameKey = path.basename(lower).replace(/\.(htm|html|md)$/i, "");
    entry = nameIndex.get(nameKey) || undefined;
  }

  if (!entry) {
    const search = await searchDocs(filename, 5);
    return `❌ 未找到文件: ${filename}\n\n${search}`;
  }

  try {
    const content = await fs.readFile(entry.absPath, "utf-8");
    const isMd = /\.(md)$/i.test(entry.absPath);

    if (isMd) {
      const truncated = content.length > 15000 ? content.substring(0, 15000) + "\n\n... (内容过长，已截断)" : content;
      return `📄 ${entry.relPath} (${entry.repo})\n${"=".repeat(60)}\n\n${truncated}\n\n${"=".repeat(60)}`;
    }

    const text = stripHtml(content);
    const truncated = text.length > 10000 ? text.substring(0, 10000) + "..." : text;
    return `📄 ${entry.relPath} (${entry.repo})\n${"=".repeat(60)}\n\n${truncated}\n\n${"=".repeat(60)}`;
  } catch (error) {
    return `❌ 读取失败: ${error}`;
  }
}

// 浏览分类（仍以官方主题分类为主）
function browseCategories(category?: string): string {
  const categories: Record<string, string[]> = {
    trading: ["ordersend", "ordercheck", "ctrade", "positionselect"],
    indicators: ["icustom", "copybuffer", "indicatorcreate", "setindexbuffer"],
    math: ["mathabs", "mathsin", "mathcos", "mathrandom", "mathpow"],
    array: ["arrayresize", "arraycopy", "arraysort", "arrayinitialize"],
    string: ["stringfind", "stringsplit", "stringreplace", "stringformat"],
    datetime: ["timecurrent", "timelocal", "timetostruct", "timegmt"],
    files: ["fileopen", "fileclose", "filewrite", "fileread"],
    chart: ["chartopen", "chartredraw", "chartid", "chartsetinteger"],
    objects: ["objectcreate", "objectdelete", "objectsetinteger"],
    onnx: ["onnxcreate", "onnxrun", "onnxrelease", "MQL5_ONNX_Integration_Guide"],
  };

  if (!category) {
    let result = "📚 MQL5 文档分类\n" + "=".repeat(60) + "\n\n";
    for (const [cat, docs] of Object.entries(categories)) {
      result += `📁 ${cat}: ${docs.length} 个文档\n`;
    }
    result += "\n💡 使用 category 参数查看具体分类";
    return result;
  }

  const docs = categories[category.toLowerCase()];
  if (!docs) {
    return `❌ 未知分类: ${category}\n\n可用: ${Object.keys(categories).join(", ")}`;
  }

  let result = `📁 ${category.toUpperCase()}\n${"=".repeat(60)}\n\n`;
  docs.forEach((doc) => {
    result += `  • ${doc}.htm\n`;
  });
  return result;
}

// 创建MCP服务器
const server = new Server(
  {
    name: "mql5-help-mcp",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 注册工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search",
        description: "搜索MQL5文档（函数名、类名、关键字）。支持官方文档与两本电子书，内置基础迁移与错误诊断提示。",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "搜索关键词或错误文本，如: OrderSend, CopyBuffer, OnTick, iMA, 'error 256: undeclared identifier ResultCode'",
            },
            limit: {
              type: "number",
              description: "返回结果数量",
              default: 10,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get",
        description: "获取指定文档的详细内容",
        inputSchema: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "文档名（可不带扩展），如: ordersend 或 ctrade 或 1_1_edit_compile_run.htm",
            },
          },
          required: ["filename"],
        },
      },
      {
        name: "browse",
        description: "浏览文档分类目录（官方/电子书常见主题）",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "分类名（可选）: trading, indicators, math, array, string, datetime, files, chart, objects, onnx",
            },
          },
        },
      },
    ],
  };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "search": {
        const { query, limit = 10 } = args as { query: string; limit?: number };
        const result = await searchDocs(query, limit);
        return { content: [{ type: "text", text: result }] };
      }

      case "get": {
        const { filename } = args as { filename: string };
        const result = await getDoc(filename);
        return { content: [{ type: "text", text: result }] };
      }

      case "browse": {
        const { category } = args as { category?: string };
        const result = browseCategories(category);
        return { content: [{ type: "text", text: result }] };
      }

      default:
        throw new Error(`未知工具: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `❌ 错误: ${message}` }],
      isError: true,
    };
  }
});

// 启动服务器
async function main() {
  console.error("🚀 MQL5 Help MCP Server 启动中...");

  const rootsInfo: string[] = [];
  for (const c of ROOT_CANDIDATES) {
    try { await fs.access(c.abs); rootsInfo.push(`${c.key}:${c.abs}`); } catch {}
  }
  console.error(`📂 文档目录: ${rootsInfo.join(" | ") || "(无可用目录)"}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("✅ 服务器就绪，等待连接...");
}

main().catch((error) => {
  console.error("❌ 启动失败:", error);
  process.exit(1);
});
