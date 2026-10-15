export function FaltaConfigPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-6">
      <h1 className="font-display text-[23px] font-bold tracking-tight">Falta conectar Supabase</h1>
      <p>
        Copiá <code className="rounded bg-linea px-1.5">.env.example</code> como{' '}
        <code className="rounded bg-linea px-1.5">.env.local</code>, completá la URL y la anon key de tu proyecto y
        reiniciá <code className="rounded bg-linea px-1.5">npm run dev</code>.
      </p>
    </div>
  )
}
