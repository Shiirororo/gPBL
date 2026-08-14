"use client"

import { useContext } from "react"

import { AssessmentContext } from "@/providers/AssessmentProvider"

export function useAssessmentCheck() {
  const context = useContext(AssessmentContext)

  if (!context) {
    throw new Error("useAssessmentCheck must be used inside AssessmentProvider.")
  }

  return context
}
