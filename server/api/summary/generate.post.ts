import { generateSummaries } from "#/summary/generate"

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const columns = query.columns ? (query.columns as string).split(",") : undefined
    const force = query.force !== undefined && query.force !== "false"

    const results = await generateSummaries({ columns, force })

    return {
      success: true,
      results,
    }
  } catch (e: any) {
    logger.error(e)
    throw createError({
      statusCode: 500,
      message: e instanceof Error ? e.message : "Internal Server Error",
    })
  }
})
