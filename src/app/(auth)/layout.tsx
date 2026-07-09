export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--surface-0)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] text-lg font-bold text-black">
            C
          </div>
          <h1 className="text-lg font-semibold text-[var(--text-0)]">Calisthenics CRM</h1>
          <p className="text-sm text-[var(--text-2)]">Coach smarter. Grow faster.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
