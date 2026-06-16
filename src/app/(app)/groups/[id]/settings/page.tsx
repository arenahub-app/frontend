'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Copy, Trash2, Plus, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Badge, Button, Input, Label } from '@/components/ui'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  useGroup,
  useGroupMembers,
  useGroupInvites,
  useUpdateGroup,
  useDeactivateGroup,
  useUpdateMember,
  useRemoveMember,
  useGenerateInvite,
  useDeactivateInvite,
} from '@/lib/hooks/use-groups'
import {
  ROLE_LABELS,
  ROLE_BADGE_VARIANT,
  SPORT_LABELS,
  buildInviteLink,
  isInviteValid,
  type Sport,
  type GroupRole,
  type Member,
} from '@/lib/api/groups'
import { updateGroupSchema, type UpdateGroupInput } from '@/lib/validations/groups'
import type { ApiError } from '@/lib/api/errors'

const SPORTS = Object.entries(SPORT_LABELS) as [Sport, string][]
const ROLES_BY_OWNER: GroupRole[] = ['ADMIN', 'PLAYER', 'REFEREE']

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(iso))
}

export default function GroupSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: group, isLoading: loadingGroup } = useGroup(id)
  const { data: members, isLoading: loadingMembers } = useGroupMembers(id)
  const { data: invites, isLoading: loadingInvites } = useGroupInvites(id)

  const updateGroup = useUpdateGroup(id)
  const deactivateGroup = useDeactivateGroup(id)
  const updateMember = useUpdateMember(id)
  const removeMember = useRemoveMember(id)
  const generateInvite = useGenerateInvite(id)
  const deactivateInvite = useDeactivateInvite(id)

  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [editingRole, setEditingRole] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateGroupInput>({
    resolver: zodResolver(updateGroupSchema),
    values: group
      ? { name: group.name, description: group.description ?? '', pixKey: group.pixKey ?? '' }
      : undefined,
  })

  if (loadingGroup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arena-bg">
        <Loader2 className="size-8 animate-spin text-arena-accent" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-arena-bg">
        <p className="text-body text-arena-muted">Grupo não encontrado ou acesso negado.</p>
        <Button variant="ghost" size="sm" onClick={() => router.push('/groups')}>
          Voltar
        </Button>
      </div>
    )
  }

  const isOwner = group.myRole === 'OWNER'
  const canManage = isOwner || group.myRole === 'ADMIN'

  if (!canManage) {
    router.replace(`/groups/${id}`)
    return null
  }

  function apiErr(error: unknown): string | undefined {
    return (error as ApiError).response?.data?.detail
  }

  function onSaveGroup(data: UpdateGroupInput) {
    updateGroup.mutate(data, {
      onSuccess: () => toast.success('Grupo atualizado!'),
      onError: (error) => toast.error(apiErr(error) ?? 'Erro ao salvar alterações.'),
    })
  }

  function handleRemoveMember(memberId: string) {
    removeMember.mutate(memberId, {
      onSuccess: () => {
        toast.success('Membro removido.')
        setConfirmRemove(null)
      },
      onError: (error) => {
        toast.error(apiErr(error) ?? 'Erro ao remover membro.')
        setConfirmRemove(null)
      },
    })
  }

  function handleRoleChange(memberId: string, role: GroupRole) {
    updateMember.mutate(
      { memberId, data: { role } },
      {
        onSuccess: () => {
          toast.success('Papel atualizado.')
          setEditingRole(null)
        },
        onError: (error) => toast.error(apiErr(error) ?? 'Erro ao atualizar papel.'),
      },
    )
  }

  function handleDeactivateGroup() {
    deactivateGroup.mutate(undefined, {
      onSuccess: () => {
        toast.success('Grupo desativado.')
        router.push('/groups')
      },
      onError: (error) => {
        toast.error(apiErr(error) ?? 'Erro ao desativar grupo.')
        setConfirmDeactivate(false)
      },
    })
  }

  function handleGenerateInvite() {
    generateInvite.mutate(undefined, {
      onSuccess: () => toast.success('Novo convite gerado.'),
      onError: (error) => toast.error(apiErr(error) ?? 'Erro ao gerar convite.'),
    })
  }

  function handleDeactivateInvite(inviteId: string) {
    deactivateInvite.mutate(inviteId, {
      onSuccess: () => toast.success('Convite desativado.'),
      onError: (error) => toast.error(apiErr(error) ?? 'Erro ao desativar convite.'),
    })
  }

  async function handleCopyLink(token: string) {
    await navigator.clipboard.writeText(buildInviteLink(token))
    toast.success('Link copiado!')
  }

  const activeInvites = invites?.filter(isInviteValid) ?? []
  const sortedMembers = members
    ? [...members].sort((a, b) => {
        const roleOrder: Record<GroupRole, number> = { OWNER: 0, ADMIN: 1, PLAYER: 2, REFEREE: 3 }
        return roleOrder[a.role] - roleOrder[b.role]
      })
    : []

  return (
    <div className="min-h-screen bg-arena-bg px-4 py-6">
      <div className="mx-auto max-w-lg flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link href={`/groups/${id}`} className="text-arena-muted hover:text-arena-text">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="font-display text-hero text-arena-text uppercase">Configurações</h1>
        </div>

        {/* Seção: Grupo */}
        <section className="rounded-card border border-arena-border bg-arena-surface p-4 flex flex-col gap-4">
          <h2 className="font-display text-title text-arena-text">Grupo</h2>
          <form onSubmit={handleSubmit(onSaveGroup)} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...register('name')} />
              {errors.name && (
                <p className="text-xs text-arena-danger">{errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" {...register('description')} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pixKey">Chave Pix</Label>
              <Input id="pixKey" placeholder="email@pix.com ou CPF" {...register('pixKey')} />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={updateGroup.isPending}
            >
              Salvar alterações
            </Button>
          </form>
        </section>

        {/* Seção: Membros */}
        <section className="rounded-card border border-arena-border bg-arena-surface overflow-hidden">
          <div className="p-4 border-b border-arena-border">
            <h2 className="font-display text-title text-arena-text">Membros</h2>
          </div>
          {loadingMembers ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-arena-accent" />
            </div>
          ) : (
            <div>
              {sortedMembers.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isOwner={isOwner}
                  isAdmin={group.myRole === 'ADMIN'}
                  editingRole={editingRole}
                  confirmRemove={confirmRemove}
                  onEditRole={() => setEditingRole(editingRole === member.id ? null : member.id)}
                  onRoleChange={(role) => handleRoleChange(member.id, role)}
                  onConfirmRemove={() => setConfirmRemove(member.id)}
                  onCancelRemove={() => setConfirmRemove(null)}
                  onRemove={() => handleRemoveMember(member.id)}
                  isRemoving={removeMember.isPending}
                />
              ))}
            </div>
          )}
        </section>

        {/* Seção: Convites */}
        <section className="rounded-card border border-arena-border bg-arena-surface p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-title text-arena-text">Convites</h2>
            <Button
              variant="ghost"
              size="xs"
              onClick={handleGenerateInvite}
              loading={generateInvite.isPending}
            >
              <Plus className="size-3.5" />
              Novo
            </Button>
          </div>

          {loadingInvites ? (
            <div className="flex justify-center py-4">
              <Loader2 className="size-4 animate-spin text-arena-accent" />
            </div>
          ) : activeInvites.length === 0 ? (
            <p className="text-caption text-arena-muted">Nenhum convite ativo.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {activeInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center gap-2 rounded-lg border border-arena-border bg-arena-raised p-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-arena-text truncate">
                      {buildInviteLink(invite.token)}
                    </p>
                    <p className="text-xs text-arena-muted">
                      {invite.usageCount}/{invite.maxUsages} usos · expira {formatDate(invite.expiresAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleCopyLink(invite.token)}
                    aria-label="Copiar link"
                  >
                    <Copy className="size-3.5" />
                  </Button>
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => handleDeactivateInvite(invite.id)}
                    aria-label="Desativar convite"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Seção: Danger Zone */}
        {isOwner && (
          <section className="rounded-card border border-arena-danger/30 bg-arena-surface p-4 flex flex-col gap-3">
            <h2 className="font-display text-title text-arena-danger">Danger Zone</h2>
            <p className="text-caption text-arena-muted">
              Desativar o grupo remove o acesso a novas partidas. O histórico é preservado.
            </p>
            {confirmDeactivate ? (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => setConfirmDeactivate(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  loading={deactivateGroup.isPending}
                  onClick={handleDeactivateGroup}
                >
                  Confirmar desativação
                </Button>
              </div>
            ) : (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmDeactivate(true)}
              >
                Desativar grupo
              </Button>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

interface MemberRowProps {
  member: Member
  isOwner: boolean
  isAdmin: boolean
  editingRole: string | null
  confirmRemove: string | null
  onEditRole: () => void
  onRoleChange: (role: GroupRole) => void
  onConfirmRemove: () => void
  onCancelRemove: () => void
  onRemove: () => void
  isRemoving: boolean
}

function MemberRow({
  member,
  isOwner,
  editingRole,
  confirmRemove,
  onEditRole,
  onRoleChange,
  onConfirmRemove,
  onCancelRemove,
  onRemove,
  isRemoving,
}: MemberRowProps) {
  const canRemove =
    (isOwner && member.role !== 'OWNER') ||
    (!isOwner && member.role !== 'OWNER' && member.role !== 'ADMIN')
  const isEditing = editingRole === member.id
  const isConfirming = confirmRemove === member.id

  return (
    <div className="px-4 py-3 border-b border-arena-border last:border-b-0">
      <div className="flex items-center gap-2 mb-1">
        <Badge variant={ROLE_BADGE_VARIANT[member.role]}>{ROLE_LABELS[member.role]}</Badge>
        <span className="text-caption text-arena-accent font-medium">
          ★ {Number(member.skill).toFixed(1)}
        </span>
        <span className="text-xs text-arena-muted font-mono flex-1 truncate">
          {member.userId.slice(0, 12)}…
        </span>
      </div>

      {isOwner && isEditing && (
        <div className="mt-2 flex gap-2">
          <Select
            className="h-8 text-xs"
            defaultValue={member.role}
            onChange={(e) => onRoleChange(e.target.value as GroupRole)}
          >
            {ROLES_BY_OWNER.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </Select>
          <Button variant="ghost" size="xs" onClick={onEditRole}>
            Cancelar
          </Button>
        </div>
      )}

      {isConfirming ? (
        <div className="mt-2 flex gap-2">
          <Button variant="ghost" size="xs" onClick={onCancelRemove}>
            Cancelar
          </Button>
          <Button variant="danger" size="xs" loading={isRemoving} onClick={onRemove}>
            Confirmar remoção
          </Button>
        </div>
      ) : (
        <div className="mt-1 flex gap-2">
          {isOwner && member.role !== 'OWNER' && (
            <Button variant="ghost" size="xs" onClick={onEditRole}>
              Alterar papel
            </Button>
          )}
          {canRemove && (
            <Button variant="danger" size="xs" onClick={onConfirmRemove}>
              Remover
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
