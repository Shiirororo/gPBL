import { proxyAI, readJSON } from "@/features/ai/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params
  return proxyAI(`conversations/${conversationId}/draft/`, {
    method: "PATCH",
    body: await readJSON(request),
  })
}
