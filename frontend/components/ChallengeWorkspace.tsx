"use client"

import { useEffect } from "react"

import ChatBoxDrawer from "@/components/ChatBoxDrawer"
import CodingEditor from "@/components/CodingEditor"
import CodingProblemBox from "@/components/CodingProblem"
import CodingResult from "@/components/CodingResult"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { getChallenge } from "@/features/challenges/api"
import { useChallengeWorkspace } from "@/hooks/useChallengeWorkspace"
import { AIConversationProvider } from "@/providers/AIConversationProvider"

export default function ChallengeWorkspace({ challengeId }: { challengeId: number }) {
  const { setChallenge, setError, setLoading } = useChallengeWorkspace()

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    void getChallenge(challengeId, controller.signal)
      .then(setChallenge)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Unable to load challenge.")
        }
      })

    return () => controller.abort()
  }, [challengeId, setChallenge, setError, setLoading])

  return (
    <AIConversationProvider>
      <div className="relative h-[calc(100vh-3rem)] bg-zinc-100 p-2 dark:bg-zinc-900">
        <ChatBoxDrawer />
        <ResizablePanelGroup orientation="horizontal" className="h-full rounded-xl">
          <ResizablePanel defaultSize="42%" minSize="28%" maxSize="60%">
            <div className="h-full overflow-y-auto rounded-l-xl">
              <CodingProblemBox />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="58%" minSize="40%">
            <ResizablePanelGroup orientation="vertical" className="h-full">
              <ResizablePanel defaultSize="65%" minSize="30%">
                <div className="h-full overflow-hidden">
                  <CodingEditor className="rounded-none ring-0" />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="35%" minSize="20%">
                <div className="h-full overflow-hidden">
                  <CodingResult className="rounded-none ring-0" />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </AIConversationProvider>
  )
}
