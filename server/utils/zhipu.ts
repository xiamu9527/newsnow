import process from "node:process"

const ZHIPU_BASE_URL = process.env.ZHIPU_BASE_URL || "https://open.bigmodel.cn/api/paas/v4"
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || ""
const ZHIPU_MODEL = process.env.ZHIPU_MODEL || "glm-4-flash"

export interface ZhipuMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface ZhipuResponse {
  id: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function chatCompletion(messages: ZhipuMessage[]): Promise<string> {
  if (!ZHIPU_API_KEY) {
    throw new Error("ZHIPU_API_KEY is not set")
  }

  const url = `${ZHIPU_BASE_URL}/chat/completions`

  const response: ZhipuResponse = await myFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ZHIPU_API_KEY}`,
    },
    body: JSON.stringify({
      model: ZHIPU_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
    timeout: 60000,
  })

  const content = response.choices?.[0]?.message?.content
  if (!content) {
    throw new Error("Empty response from Zhipu API")
  }

  logger.info(`Zhipu API call: ${response.usage.total_tokens} tokens`)
  return content
}
