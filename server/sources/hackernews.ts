import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  const data: any = await myFetch("https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30")
  const news: NewsItem[] = []
  for (const hit of data?.hits || []) {
    if (hit.objectID && hit.title) {
      news.push({
        id: hit.objectID,
        title: hit.title,
        url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
        extra: {
          info: hit.points ? `${hit.points} points` : undefined,
        },
      })
    }
  }
  return news
})
