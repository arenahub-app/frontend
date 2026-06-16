'use client'

import Link from 'next/link'
import { Plus, Loader2, Users } from 'lucide-react'
import { Avatar, Badge, Button } from '@/components/ui'
import { useGroups } from '@/lib/hooks/use-groups'
import { SPORT_LABELS, ROLE_LABELS, ROLE_BADGE_VARIANT } from '@/lib/api/groups'

export default function GroupsPage() {
  const { data: groups, isLoading, isError } = useGroups()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arena-bg">
        <Loader2 className="size-8 animate-spin text-arena-accent" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-arena-bg">
        <p className="text-body text-arena-muted">Erro ao carregar grupos.</p>
        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-arena-bg px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-hero text-arena-text uppercase">Meus Grupos</h1>
          <Button variant="primary" size="sm" render={<Link href="/groups/new" />}>
            <Plus className="size-4" />
            Criar grupo
          </Button>
        </div>

        {groups && groups.length === 0 ? (
          <div className="mt-24 flex flex-col items-center gap-4 text-center">
            <Users className="size-16 text-arena-muted" />
            <p className="text-body text-arena-muted">Nenhum grupo ainda.</p>
            <p className="text-caption text-arena-muted">
              Crie seu grupo ou peça um link de convite a um amigo.
            </p>
            <Button variant="primary" size="md" render={<Link href="/groups/new" />}>
              Criar grupo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups?.map((group) => (
              <Link key={group.id} href={`/groups/${group.id}`} className="block">
                <div className="flex h-full cursor-pointer flex-col gap-3 rounded-card border border-arena-border bg-arena-surface p-5 transition-transform active:scale-[0.98] hover:border-arena-accent/40">
                  <div className="flex items-center gap-3">
                    <Avatar name={group.name} src={group.photoUrl ?? undefined} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-title text-arena-text truncate">{group.name}</p>
                      <p className="text-caption text-arena-muted">
                        {group.memberCount} {group.memberCount === 1 ? 'membro' : 'membros'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <Badge variant="neutral">{SPORT_LABELS[group.sport]}</Badge>
                    <Badge variant={ROLE_BADGE_VARIANT[group.myRole]}>
                      {ROLE_LABELS[group.myRole]}
                    </Badge>
                    {group.status === 'INACTIVE' && (
                      <Badge variant="danger">Inativo</Badge>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
