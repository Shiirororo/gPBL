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
import { useChallengeQuery } from "@/features/challenges/queries"
import { useChallengeWorkspace } from "@/hooks/useChallengeWorkspace"
import { AIConversationProvider } from "@/providers/AIConversationProvider"
import { AILockStatus } from "@/components/AILockStatus"

export default function ChallengeWorkspace({ challengeId }: { challengeId: number }) {
  const {
    challenge,
    setChallenge,
    setChallengeError,
    setLoading,
  } = useChallengeWorkspace()
  const challengeQuery = useChallengeQuery(challengeId)

  useEffect(() => {
    if (challengeQuery.data && challenge?.challenge_id !== challengeId) {
      setChallenge(challengeQuery.data)
      return
    }

    setLoading(challengeQuery.isPending)
    setChallengeError(challengeQuery.error?.message ?? null)
  }, [
    challenge?.challenge_id,
    challengeId,
    challengeQuery.data,
    challengeQuery.error,
    challengeQuery.isPending,
    setChallenge,
    setChallengeError,
    setLoading,
  ])

  return (
    <AIConversationProvider>
      <div className="relative h-[calc(100vh-3rem)] bg-zinc-100 p-2 dark:bg-zinc-900">
        {/* AI Lock Status Banner */}
        <div className="mb-2">
          <AILockStatus challengeId={challengeId} />
        </div>
        
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
