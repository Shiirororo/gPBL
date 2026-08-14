export function canCloseAssessment(status: string | undefined): boolean {
  return status === 'COMPLETED'
}
