import { proxyAI, readJSON } from "@/features/ai/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params
  return proxyAI(`conversations/${conversationId}/messages/`, {
    method: "POST",
    body: await readJSON(request),
  })
}
