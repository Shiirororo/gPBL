export default function MainLoading() {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center" role="status" aria-live="polite">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
