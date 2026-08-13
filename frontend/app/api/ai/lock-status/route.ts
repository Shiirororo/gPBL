import { proxyAI } from "@/features/ai/server"

export async function GET() {
  return proxyAI("lock-status/")
}
