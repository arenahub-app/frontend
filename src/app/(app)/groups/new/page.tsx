import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CreateGroupForm } from '@/components/groups/create-group-form'

export default function NewGroupPage() {
  return (
    <div className="min-h-screen bg-arena-bg px-4 py-8 md:px-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <Link
            href="/groups"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-arena-muted hover:text-arena-text"
          >
            <ArrowLeft className="size-4" />
            Meus grupos
          </Link>
          <h1 className="font-display text-hero text-arena-text uppercase">Novo Grupo</h1>
          <p className="mt-1 text-caption text-arena-muted">
            Preencha as informações para criar seu grupo.
          </p>
        </div>
        <div className="rounded-card border border-arena-border bg-arena-surface p-6">
          <CreateGroupForm />
        </div>
      </div>
    </div>
  )
}
