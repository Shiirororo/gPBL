import { proxyAI } from "@/features/ai/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params
  return proxyAI(`conversations/${conversationId}/`)
}
