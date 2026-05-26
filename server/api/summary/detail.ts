import { getSummaryTable } from "#/database/summary"
import type { SummaryDetail, NewsItemBrief } from "#/database/summary"

const columnNames: Record<string, string> = {
  china: "国内",
  world: "国际",
  tech: "科技",
  finance: "财经",
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const id = query.id as string

    if (!id) {
      throw createError({ statusCode: 400, message: "Missing required param: id" })
    }

    const summaryTable = await getSummaryTable()
    if (!summaryTable) {
      throw createError({ statusCode: 500, message: "Database not available" })
    }

    const row = await summaryTable.get(id)
    if (!row) {
      throw createError({ statusCode: 404, message: "Summary not found" })
    }

    const detail: SummaryDetail = {
      id: row.id,
      columnId: row.column_id,
      columnName: columnNames[row.column_id] || row.column_id,
      date: row.date,
      period: row.period,
      title: row.title,
      summary: row.summary,
      tags: JSON.parse(row.tags),
      newsCount: row.news_count,
      updatedTime: row.updated,
      newsItems: JSON.parse(row.news_items) as NewsItemBrief[],
    }

    return detail
  } catch (e: any) {
    logger.error(e)
    throw createError({
      statusCode: e.statusCode || 500,
      message: e instanceof Error ? e.message : "Internal Server Error",
    })
  }
})
