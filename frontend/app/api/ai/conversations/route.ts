import { proxyAI, readJSON } from "@/features/ai/server"

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.toString()
  return proxyAI(`conversations/${query ? `?${query}` : ""}`)
}

export async function POST(request: Request) {
  return proxyAI("conversations/", { method: "POST", body: await readJSON(request) })
}
