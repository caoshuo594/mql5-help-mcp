/**
 * 智能查询引擎 - 完全本地化，零API成本
 * 基于规则匹配和启发式算法
 */

import * as fs from "fs/promises";
import { getErrorDb, ErrorSearchResult } from "./error-db.js";

// ========== 类型定义 ==========

interface DocEntry {
  absPath: string;
  relPath: string;
  repo: string;
}

interface QueryAnalysis {
  type: "error" | "function" | "class" | "migration" | "howto" | "concept";
  keywords: string[];
  context?: string;
  originalQuery: string;
}

interface ExtractedInfo {
  syntax?: string;
  parameters?: string;
  returns?: string;
  example?: string;
  notes?: string[];
  description?: string;
  seeAlso?: string[];
}

interface SmartQueryResult {
  type: "quick" | "detailed";
  answer: string;
  code?: string;
  syntax?: string;
  parameters?: string;
  returns?: string;
  example?: string;
  notes?: string[];
  reference: string;
  relatedDocs?: string[];
  estimatedTokens: number;
}

// ========== 查询分析器 ==========

class QueryAnalyzer {
  // 错误模式匹配 - 提取错误代码和消息
  private static ERROR_PATTERNS = [
    /error[:\s]+([A-Z]\d+)[:\s]+([^'"]+)/i,        // "error: E512: undeclared identifier"
    /\b([A-Z]\d{3,4})\b[:\s]+([^'"]+)/i,           // "E512: undeclared identifier"
    /undeclared\s+identifier\s+'?([a-z_][a-z0-9_]*)'?/i,  // 未声明标识符
    /'([a-z_][a-z0-9_]*)'\s*-\s*undeclared/i,      // 'symbol' - undeclared
  ];

  // 提取错误代码(如 E512, E308)
  static extractErrorCode(query: string): string | null {
    const match = query.match(/\b([A-Z]\d{3,4})\b/);
    return match ? match[1] : null;
  }

  // 函数模式匹配
  private static FUNCTION_PATTERNS = [
    /^([A-Z][a-zA-Z0-9_]+)(?:\(\))?$/,  // OrderSend, OrderSend()
    /how\s+to\s+use\s+([A-Z][a-zA-Z0-9_]+)/i,
  ];

  // 类模式匹配
  private static CLASS_PATTERNS = [
    /^C?([A-Z][a-zA-Z0-9_]+)\s+class/i,
    /^C([A-Z][a-zA-Z0-9_]+)$/,  // CTrade → Trade class
  ];

  // "如何"问题模式
  private static HOWTO_PATTERNS = [
    /(?:how|如何|怎么|怎样)\s+(?:to|do|实现|做|用)/i,
    /(?:what|什么)\s+(?:is|are)/i,
  ];

  static analyze(query: string): QueryAnalysis {
    const queryLower = query.toLowerCase().trim();

    // 1. 错误诊断
    for (const pattern of this.ERROR_PATTERNS) {
      const match = query.match(pattern);
      if (match) {
        const identifier = match[1] || match[2];
        return {
          type: "error",
          keywords: [identifier.toLowerCase()],
          context: "error_diagnosis",
          originalQuery: query,
        };
      }
    }

    // 2. 函数查询
    for (const pattern of this.FUNCTION_PATTERNS) {
      const match = query.match(pattern);
      if (match) {
        return {
          type: "function",
          keywords: [match[1].toLowerCase()],
          originalQuery: query,
        };
      }
    }

    // 3. 类查询
    for (const pattern of this.CLASS_PATTERNS) {
      const match = query.match(pattern);
      if (match) {
        return {
          type: "class",
          keywords: [match[1].toLowerCase(), `c${match[1].toLowerCase()}`],
          originalQuery: query,
        };
      }
    }

    // 4. "如何"问题
    for (const pattern of this.HOWTO_PATTERNS) {
      if (pattern.test(query)) {
        return {
          type: "howto",
          keywords: this.extractKeywords(query),
          originalQuery: query,
        };
      }
    }

    // 5. 概念查询（默认）
    return {
      type: "concept",
      keywords: this.extractKeywords(query),
      originalQuery: query,
    };
  }

  // 提取关键词
  private static extractKeywords(query: string): string[] {
    // 移除常见停用词
    const stopWords = new Set([
      "how", "to", "use", "the", "a", "an", "is", "are", "in", "on", "at",
      "如何", "怎么", "使用", "的", "了", "吗", "呢",
    ]);

    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));
  }
}

// ========== 信息提取器 ==========

class InfoExtractor {
  // HTML清理
  static stripHtml(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // 提取函数签名
  static extractSyntax(html: string): string | undefined {
    const patterns = [
      // C++ 风格函数签名
      /((?:bool|int|long|double|string|void|ulong|uint|ushort|datetime|color)\s+[A-Z][a-zA-Z0-9_]*\s*\([^)]*\))/i,
      // MQL5 类方法
      /((?:virtual\s+)?(?:bool|int|double|string|void)\s+[A-Z][a-zA-Z0-9_]*\s*\([^)]*\))/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return match[1].replace(/\s+/g, " ").trim().substring(0, 200);
      }
    }
    return undefined;
  }

  // 提取参数说明
  static extractParameters(text: string): string | undefined {
    const patterns = [
      /Parameters?[:\s]*\n([^\n]+(?:\n(?!\n)[^\n]+)*)/i,
      /参数[:\s]*\n([^\n]+(?:\n(?!\n)[^\n]+)*)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim().substring(0, 400);
      }
    }
    return undefined;
  }

  // 提取返回值
  static extractReturns(text: string): string | undefined {
    const patterns = [
      /Return(?:s|ed)?\s+value[:\s]*\n?([^\n]+)/i,
      /Returns?[:\s]*\n?([^\n]+)/i,
      /返回值?[:\s]*\n?([^\n]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim().substring(0, 200);
      }
    }
    return undefined;
  }

  // 提取示例代码
  static extractExample(html: string): string | undefined {
    const patterns = [
      /<pre[^>]*>([\s\S]*?)<\/pre>/i,
      /<code[^>]*>([\s\S]*?)<\/code>/i,
      /Example[:\s]*\n?([\s\S]{0,500})/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        let code = match[1].replace(/<[^>]+>/g, "").trim();
        // 限制长度
        if (code.length > 500) {
          code = code.substring(0, 500) + "\n// ...";
        }
        return code;
      }
    }
    return undefined;
  }

  // 提取注意事项
  static extractNotes(text: string): string[] {
    const patterns = [
      /Note[:\s]+([^\n]+)/gi,
      /注意[:\s]+([^\n]+)/gi,
      /Important[:\s]+([^\n]+)/gi,
      /Warning[:\s]+([^\n]+)/gi,
    ];

    const notes: string[] = [];
    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const note = match[1].trim();
        if (note && note.length > 10) {
          notes.push(note.substring(0, 150));
        }
      }
    }
    return notes.slice(0, 3); // 最多3条
  }

  // 提取简短描述
  static extractDescription(text: string): string | undefined {
    // 取前两段文本
    const paragraphs = text.split(/\n\n+/);
    if (paragraphs.length > 0) {
      const desc = paragraphs.slice(0, 2).join(" ");
      return desc.substring(0, 300);
    }
    return undefined;
  }

  // 综合提取
  static async extract(docPath: string): Promise<ExtractedInfo> {
    try {
      const html = await fs.readFile(docPath, "utf-8");
      const text = this.stripHtml(html);

      return {
        syntax: this.extractSyntax(html),
        parameters: this.extractParameters(text),
        returns: this.extractReturns(text),
        example: this.extractExample(html),
        notes: this.extractNotes(text),
        description: this.extractDescription(text),
      };
    } catch (error) {
      return {};
    }
  }
}

// ========== 答案格式化器 ==========

class ResponseFormatter {
  // 快速模式 (~500 tokens)
  static formatQuick(
    extracted: ExtractedInfo,
    analysis: QueryAnalysis,
    docName: string
  ): SmartQueryResult {
    let answer = "";

    // 根据查询类型定制答案
    if (analysis.type === "error") {
      answer = `❌ 错误诊断\n\n`;
      if (extracted.description) {
        answer += `${extracted.description.substring(0, 150)}\n`;
      }
      answer += `\n💡 解决方案：\n`;
      if (extracted.syntax) {
        answer += `使用: ${extracted.syntax}\n`;
      }
    } else if (analysis.type === "function" || analysis.type === "class") {
      answer = extracted.syntax || extracted.description?.substring(0, 100) || "函数/类说明";
    } else {
      answer = extracted.description?.substring(0, 200) || "查询结果";
    }

    return {
      type: "quick",
      answer,
      code: extracted.example?.substring(0, 200),
      reference: docName,
      estimatedTokens: 500,
    };
  }

  // 详细模式 (~1500 tokens)
  static formatDetailed(
    extracted: ExtractedInfo,
    analysis: QueryAnalysis,
    docName: string,
    relatedDocs: string[]
  ): SmartQueryResult {
    return {
      type: "detailed",
      answer: extracted.description || "详细说明",
      syntax: extracted.syntax,
      parameters: extracted.parameters,
      returns: extracted.returns,
      example: extracted.example,
      notes: extracted.notes,
      reference: docName,
      relatedDocs: relatedDocs.slice(0, 3),
      estimatedTokens: 1500,
    };
  }
}

// ========== 主查询引擎 ==========

export class SmartQueryEngine {
  private docIndex: Map<string, DocEntry>;

  constructor(docIndex: Map<string, DocEntry>) {
    this.docIndex = docIndex;
  }

  // 内部搜索 (不返回给AI)
  private internalSearch(keywords: string[], limit: number = 3): DocEntry[] {
    const results: Array<{ entry: DocEntry; score: number }> = [];

    for (const [key, entry] of this.docIndex.entries()) {
      let score = 0;

      for (const keyword of keywords) {
        if (key === keyword) {
          score += 100; // 精确匹配
        } else if (key.includes(keyword)) {
          score += 50; // 部分匹配
        } else if (keyword.includes(key)) {
          score += 25; // 反向部分匹配
        }
      }

      if (score > 0) {
        results.push({ entry, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit).map((r) => r.entry);
  }

  // 从错误数据库搜索错误解决方案
  private searchErrorDatabase(query: string, errorCode: string | null): ErrorSearchResult[] {
    const errorDb = getErrorDb();
    
    if (errorCode) {
      // 有错误代码,精确查询
      return errorDb.searchError(errorCode);
    } else {
      // 无错误代码,模糊搜索
      return errorDb.searchSimilarErrors(query);
    }
  }

  // 智能查询主函数
  async query(query: string, mode: "quick" | "detailed" = "quick"): Promise<SmartQueryResult> {
    // 1. 分析查询
    const analysis = QueryAnalyzer.analyze(query);

    // 2. 如果是错误查询,优先从错误数据库搜索
    if (analysis.type === "error") {
      const errorCode = QueryAnalyzer.extractErrorCode(query);
      const dbResults = this.searchErrorDatabase(query, errorCode);

      if (dbResults.length > 0) {
        // 找到历史错误记录,直接返回
        const topError = dbResults[0];
        const answer = `🔍 **从错误数据库找到解决方案** (出现${topError.occurrence_count}次)\n\n` +
          `**错误:** ${topError.error_code} - ${topError.error_message}\n\n` +
          (topError.solution ? `**解决方案:**\n${topError.solution}\n\n` : '') +
          (topError.related_docs ? `**相关文档:**\n${topError.related_docs}\n\n` : '') +
          `💡 提示: 如果此解决方案无效,请使用 smart_query 从文档中查询更多信息`;

        return {
          type: mode,
          answer,
          reference: "错误数据库",
          relatedDocs: topError.related_docs ? JSON.parse(topError.related_docs) : [],
          estimatedTokens: answer.length / 4,
        };
      }
      // 未找到,继续从文档搜索
    }

    // 3. 从文档内部搜索
    const candidates = this.internalSearch(analysis.keywords, mode === "quick" ? 1 : 3);

    if (candidates.length === 0) {
      return {
        type: mode,
        answer: `❌ 未找到相关文档，关键词: ${analysis.keywords.join(", ")}`,
        reference: "无",
        estimatedTokens: 100,
      };
    }

    // 4. 提取信息
    const primaryDoc = candidates[0];
    const extracted = await InfoExtractor.extract(primaryDoc.absPath);

    // 5. 格式化返回
    if (mode === "quick") {
      return ResponseFormatter.formatQuick(extracted, analysis, primaryDoc.relPath);
    } else {
      const relatedDocs = candidates.slice(1).map((c) => c.relPath);
      return ResponseFormatter.formatDetailed(extracted, analysis, primaryDoc.relPath, relatedDocs);
    }
  }
}
