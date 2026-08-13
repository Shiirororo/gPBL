export interface ChallengeScopedConversation {
  challenge_id: number;
}

export function isConversationForChallenge(
  conversation: ChallengeScopedConversation,
  challengeId: number | undefined,
): boolean {
  return challengeId !== undefined && conversation.challenge_id === challengeId;
}
