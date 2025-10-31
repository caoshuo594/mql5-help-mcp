#!/usr/bin/env node

/**
 * MQL5 Help MCP Server
 * 极简、高速的MQL5文档查询服务
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

// 文档根目录（MQL5_HELP 文件夹）
const DOC_ROOT = path.resolve(__dirname, "..", "MQL5_HELP");

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
let docIndex: Map<string, string> | null = null;

// 构建文档索引
async function buildIndex(): Promise<Map<string, string>> {
  if (docIndex) return docIndex;

  docIndex = new Map();
  const files = await fs.readdir(DOC_ROOT);

  for (const file of files) {
    // 索引 .htm 文件
    if (file.endsWith(".htm")) {
      const key = file.replace(".htm", "").toLowerCase();
      docIndex.set(key, file);
      
      // 类名变体（去掉开头的C）
      if (key.startsWith("c") && key.length > 2) {
        docIndex.set(key.substring(1), file);
      }
    }
    
    // 索引 .md 文件（如 ONNX 集成指南）
    if (file.endsWith(".md")) {
      const key = file.replace(".md", "").toLowerCase();
      docIndex.set(key, file);
      
      // 添加关键词索引
      if (key.includes("onnx")) {
        docIndex.set("onnx", file);
        docIndex.set("onnx_guide", file);
        docIndex.set("ml", file); // Machine Learning
        docIndex.set("ai", file);
      }
    }
  }

  console.error(`📚 索引已建立: ${docIndex.size} 个文档`);
  return docIndex;
}

// 搜索文档
async function searchDocs(query: string, limit: number = 10): Promise<string> {
  const index = await buildIndex();
  const queryLower = query.toLowerCase();

  // 精确匹配
  const exactMatch = index.get(queryLower);

  // 模糊匹配
  const fuzzyMatches: Array<{ file: string; score: number }> = [];
  for (const [key, file] of index.entries()) {
    if (key.includes(queryLower)) {
      const score = queryLower.length / key.length;
      fuzzyMatches.push({ file, score });
    }
  }
  fuzzyMatches.sort((a, b) => b.score - a.score);

  let result = `🔍 搜索: "${query}"\n\n`;

  if (exactMatch) {
    result += `✅ 精确匹配: ${exactMatch}\n\n`;
  }

  if (fuzzyMatches.length > 0) {
    result += `📋 相关文档 (${fuzzyMatches.length} 个):\n`;
    fuzzyMatches.slice(0, limit).forEach((m, i) => {
      result += `  ${i + 1}. ${m.file}\n`;
    });
  } else if (!exactMatch) {
    result += `❌ 未找到匹配文档\n`;
    result += `💡 提示: 使用英文关键字，如 OrderSend, CopyBuffer 等`;
  }

  return result;
}

// 读取文档内容
async function getDoc(filename: string): Promise<string> {
  // 自动添加扩展名
  if (!filename.endsWith(".htm") && !filename.endsWith(".md")) {
    // 先尝试 .htm，如果不存在则尝试 .md
    const htmPath = path.join(DOC_ROOT, filename + ".htm");
    const mdPath = path.join(DOC_ROOT, filename + ".md");
    
    try {
      await fs.access(htmPath);
      filename += ".htm";
    } catch {
      try {
        await fs.access(mdPath);
        filename += ".md";
      } catch {
        const search = await searchDocs(filename, 3);
        return `❌ 文件不存在: ${filename}\n\n${search}`;
      }
    }
  }

  const filePath = path.join(DOC_ROOT, filename);

  try {
    await fs.access(filePath);
  } catch {
    const search = await searchDocs(filename.replace(/\.(htm|md)$/, ""), 3);
    return `❌ 文件不存在: ${filename}\n\n${search}`;
  }

  try {
    const content = await fs.readFile(filePath, "utf-8");
    
    // 如果是 Markdown 文件，直接返回内容
    if (filename.endsWith(".md")) {
      const truncated = content.length > 15000 ? content.substring(0, 15000) + "\n\n... (内容过长，已截断)" : content;
      return `📄 ${filename}\n${"=".repeat(60)}\n\n${truncated}\n\n${"=".repeat(60)}`;
    }
    
    // HTML 文件，提取文本
    const text = stripHtml(content);
    const truncated = text.length > 10000 ? text.substring(0, 10000) + "..." : text;

    return `📄 ${filename}\n${"=".repeat(60)}\n\n${truncated}\n\n${"=".repeat(60)}`;
  } catch (error) {
    return `❌ 读取失败: ${error}`;
  }
}

// 浏览分类
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
    version: "1.0.0",
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
        description: "搜索MQL5文档（函数名、类名、关键字）。支持搜索标准API文档和ONNX机器学习集成指南。",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "搜索关键词，如: OrderSend, CopyBuffer, OnTick, ONNX, ML, AI",
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
              description: "文档文件名，如: ordersend.htm 或 ordersend",
            },
          },
          required: ["filename"],
        },
      },
      {
        name: "browse",
        description: "浏览文档分类目录",
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
  console.error(`📂 文档目录: ${DOC_ROOT}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("✅ 服务器就绪，等待连接...");
}

main().catch((error) => {
  console.error("❌ 启动失败:", error);
  process.exit(1);
});
