export class BackendUnavailableError extends Error {
  constructor() {
    super("The backend service is currently unavailable.")
    this.name = "BackendUnavailableError"
  }
}
