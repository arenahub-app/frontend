import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CreateGroupForm } from '@/components/groups/create-group-form'

export default function NewGroupPage() {
  return (
    <div className="min-h-screen bg-arena-bg px-4 py-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/groups" className="text-arena-muted hover:text-arena-text">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="font-display text-hero text-arena-text uppercase">Novo Grupo</h1>
        </div>
        <CreateGroupForm />
      </div>
    </div>
  )
}
