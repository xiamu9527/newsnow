import type { NewsItem, SourceID } from "@shared/types"
import type { HiddenColumnID } from "@shared/types"
import { metadata } from "@shared/metadata"
import { getCacheTable } from "#/database/cache"
import { getSummaryTable } from "#/database/summary"
import type { NewsItemBrief } from "#/database/summary"
import { chatCompletion } from "#/utils/zhipu"

const columnNames: Record<string, string> = {
  china: "国内",
  world: "国际",
  tech: "科技",
  finance: "财经",
}

function getPeriod(): string {
  const hour = new Date().getHours()
  if (hour < 8) return "morning"
  if (hour < 15) return "noon"
  return "evening"
}

function getDateStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

interface GenerateOptions {
  columns?: string[]
  force?: boolean
}

export async function generateSummaries(options: GenerateOptions = {}) {
  const cacheTable = await getCacheTable()
  const summaryTable = await getSummaryTable()
  if (!cacheTable || !summaryTable) {
    throw new Error("Database not available")
  }

  const columnsToProcess = options.columns || ["china", "world", "tech", "finance"]
  const date = getDateStr()
  const period = getPeriod()

  logger.info(`Generating summaries for ${date} ${period}, columns: ${columnsToProcess.join(", ")}`)

  const results: string[] = []

  for (const columnId of columnsToProcess) {
    try {
      const summaryId = `${columnId}_${date}_${period}`

      if (!options.force) {
        const existing = await summaryTable.get(summaryId)
        if (existing) {
          logger.info(`Summary ${summaryId} already exists, skipping`)
          results.push(`${columnId}: skipped (exists)`)
          continue
        }
      }

      const columnMeta = metadata[columnId as keyof typeof metadata]
      if (!columnMeta?.sources?.length) {
        logger.warn(`No sources for column: ${columnId}`)
        results.push(`${columnId}: no sources`)
        continue
      }

      const sourceIds = columnMeta.sources as SourceID[]
      const allItems: { source: string, item: NewsItem }[] = []

      for (const sourceId of sourceIds) {
        try {
          const cache = await cacheTable.get(sourceId)
          if (cache?.items?.length) {
            for (const item of cache.items) {
              allItems.push({ source: sourceId, item })
            }
          }
        } catch (e) {
          logger.warn(`Failed to get cache for ${sourceId}: ${e}`)
        }
      }

      if (allItems.length === 0) {
        logger.warn(`No news items for column: ${columnId}`)
        results.push(`${columnId}: no items`)
        continue
      }

      const uniqueItems = allItems.filter((item, index, self) =>
        index === self.findIndex(t => t.item.title === item.item.title),
      ).slice(0, 50)

      const titleList = uniqueItems
        .map((item, i) => `${i + 1}. [${sources[item.source]?.name || item.source}] ${item.item.title}`)
        .join("\n")

      const columnName = columnNames[columnId] || columnId

      const prompt = `你是一位专业的新闻编辑。请根据以下【${columnName}类】新闻标题，撰写一篇300字左右的中文新闻综述，概括今日该领域的热点动态。综述要客观、精炼、有条理。

然后提取3-5个关键标签（如人名、公司名、事件关键词），以及一个简洁的综述标题。

新闻标题列表：
${titleList}

请严格按以下JSON格式输出，不要输出其他内容：
{"title":"综述标题","summary":"综述正文","tags":["标签1","标签2","标签3"]}`

      const response = await chatCompletion([
        { role: "user", content: prompt },
      ])

      let parsed: { title: string, summary: string, tags: string[] }
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error("No JSON found in response")
        parsed = JSON.parse(jsonMatch[0])
      } catch (e) {
        logger.error(`Failed to parse LLM response for ${columnId}: ${e}`)
        results.push(`${columnId}: parse error`)
        continue
      }

      const newsItems: NewsItemBrief[] = uniqueItems.map(({ source, item }) => ({
        id: String(item.id),
        title: item.title,
        url: item.url,
        source,
        sourceName: sources[source]?.name || source,
      }))

      await summaryTable.set({
        id: summaryId,
        column_id: columnId,
        date,
        period,
        title: parsed.title,
        summary: parsed.summary,
        tags: JSON.stringify(parsed.tags),
        news_items: JSON.stringify(newsItems),
        news_count: newsItems.length,
      })

      logger.success(`Generated summary: ${summaryId}`)
      results.push(`${columnId}: success (${newsItems.length} items)`)
    } catch (e: any) {
      logger.error(`Failed to generate summary for ${columnId}: ${e.message}`)
      results.push(`${columnId}: error - ${e.message}`)
    }
  }

  return results
}
