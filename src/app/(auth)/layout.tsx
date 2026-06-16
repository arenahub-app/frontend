export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-arena-bg px-4 py-8 gap-8">
      <div className="flex items-baseline">
        <span className="font-display text-3xl uppercase tracking-widest text-arena-accent">
          Arena
        </span>
        <span className="font-display text-3xl uppercase tracking-widest text-arena-text">
          Hub
        </span>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
