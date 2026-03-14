export function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
    >
      {message}
    </div>
  )
}
