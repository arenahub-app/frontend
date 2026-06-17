'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Copy, Trash2, Plus, Loader2, CreditCard } from 'lucide-react'
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
  buildInviteLink,
  isInviteValid,
  type GroupRole,
  type Member,
} from '@/lib/api/groups'
import { updateGroupSchema, type UpdateGroupInput } from '@/lib/validations/groups'
import type { ApiError } from '@/lib/api/errors'

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
      ? {
          name: group.name,
          description: group.description ?? '',
          pixKey: group.pixKey ?? '',
          matchFee: group.matchFee != null ? String(group.matchFee) : '',
        }
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
    const matchFeeRaw = data.matchFee
    let matchFee: number | null | undefined = undefined
    if (matchFeeRaw === '' || matchFeeRaw === undefined) {
      matchFee = null
    } else {
      const parsed = parseFloat(matchFeeRaw)
      if (isNaN(parsed) || parsed <= 0) {
        toast.error('Valor da diária deve ser maior que zero.')
        return
      }
      matchFee = parsed
    }
    updateGroup.mutate({ ...data, matchFee }, {
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
        const order: Record<GroupRole, number> = { OWNER: 0, ADMIN: 1, PLAYER: 2, REFEREE: 3 }
        return order[a.role] - order[b.role]
      })
    : []

  return (
    <div className="min-h-screen bg-arena-bg px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">

        {/* Cabeçalho */}
        <div className="mb-8">
          <Link
            href={`/groups/${id}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-arena-muted hover:text-arena-text"
          >
            <ArrowLeft className="size-4" />
            Voltar ao grupo
          </Link>
          <h1 className="font-display text-hero text-arena-text uppercase">Configurações</h1>
          <p className="mt-1 text-caption text-arena-muted">{group.name}</p>
        </div>

        {/* Layout de duas colunas no desktop */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Coluna esquerda: Formulário do grupo + Danger Zone */}
          <div className="flex flex-col gap-6 lg:col-span-1">

            {/* Seção: Informações do grupo */}
            <section className="rounded-card border border-arena-border bg-arena-surface p-5">
              <h2 className="font-display text-title text-arena-text mb-4">Informações</h2>
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
                  <Textarea id="description" placeholder="Descreva seu grupo..." {...register('description')} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pixKey">Chave Pix</Label>
                  <Input id="pixKey" placeholder="email@pix.com ou CPF" {...register('pixKey')} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="matchFee">Valor da diária (R$)</Label>
                  <Input
                    id="matchFee"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex: 25,00 (vazio = sem cobrança)"
                    {...register('matchFee')}
                  />
                  {errors.matchFee?.message && (
                    <p className="text-xs text-arena-danger">{errors.matchFee.message as string}</p>
                  )}
                  <p className="text-xs text-arena-muted">
                    Deixe vazio para desabilitar a cobrança automática.
                  </p>
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

            {/* Seção: Pagamentos (OWNER e ADMIN) */}
            <section className="rounded-card border border-arena-border bg-arena-surface p-5">
              <h2 className="font-display text-title text-arena-text mb-2">Pagamentos</h2>
              <p className="text-caption text-arena-muted mb-4">
                Revise comprovantes, aprove ou recuse pagamentos dos membros.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                render={<Link href={`/groups/${id}/admin/payments`} />}
              >
                <CreditCard className="size-4" />
                Fila de pagamentos
              </Button>
            </section>

            {/* Seção: Danger Zone (apenas OWNER) */}
            {isOwner && (
              <section className="rounded-card border border-arena-danger/30 bg-arena-surface p-5">
                <h2 className="font-display text-title text-arena-danger mb-2">Danger Zone</h2>
                <p className="text-caption text-arena-muted mb-4">
                  Desativar o grupo bloqueia novas partidas. O histórico e os dados são preservados.
                </p>
                {confirmDeactivate ? (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => setConfirmDeactivate(false)}>
                      Cancelar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex-1"
                      loading={deactivateGroup.isPending}
                      onClick={handleDeactivateGroup}
                    >
                      Confirmar
                    </Button>
                  </div>
                ) : (
                  <Button variant="danger" size="sm" className="w-full" onClick={() => setConfirmDeactivate(true)}>
                    Desativar grupo
                  </Button>
                )}
              </section>
            )}
          </div>

          {/* Coluna direita: Membros + Convites */}
          <div className="flex flex-col gap-6 lg:col-span-2">

            {/* Seção: Membros */}
            <section className="rounded-card border border-arena-border bg-arena-surface overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-arena-border">
                <h2 className="font-display text-title text-arena-text">Membros</h2>
                <span className="text-caption text-arena-muted">{sortedMembers.length} no total</span>
              </div>

              {loadingMembers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-arena-accent" />
                </div>
              ) : (
                <div className="divide-y divide-arena-border">
                  {sortedMembers.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      isOwner={isOwner}
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
            <section className="rounded-card border border-arena-border bg-arena-surface overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-arena-border">
                <h2 className="font-display text-title text-arena-text">Convites</h2>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateInvite}
                  loading={generateInvite.isPending}
                >
                  <Plus className="size-4" />
                  Novo convite
                </Button>
              </div>

              <div className="p-5">
                {loadingInvites ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="size-4 animate-spin text-arena-accent" />
                  </div>
                ) : activeInvites.length === 0 ? (
                  <p className="text-caption text-arena-muted">
                    Nenhum convite ativo. Gere um para compartilhar com novos membros.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {activeInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center gap-3 rounded-lg border border-arena-border bg-arena-raised p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono text-arena-text truncate">
                            {buildInviteLink(invite.token)}
                          </p>
                          <p className="text-xs text-arena-muted mt-0.5">
                            {invite.usageCount}/{invite.maxUsages} usos · expira {formatDate(invite.expiresAt)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(invite.token)}
                        >
                          <Copy className="size-4" />
                          Copiar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeactivateInvite(invite.id)}
                          aria-label="Desativar convite"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}

interface MemberRowProps {
  member: Member
  isOwner: boolean
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
    <div className="px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-arena-text truncate">
            {member.userName ?? `ID: ${member.userId.slice(0, 12)}…`}
          </p>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <Badge variant={ROLE_BADGE_VARIANT[member.role]}>{ROLE_LABELS[member.role]}</Badge>
            <span className="text-sm text-arena-accent font-medium">
              ★ {Number(member.skill).toFixed(1)}
            </span>
          </div>
        </div>

        {!isEditing && !isConfirming && (
          <div className="flex items-center gap-2 shrink-0">
            {isOwner && member.role !== 'OWNER' && (
              <Button variant="ghost" size="sm" onClick={onEditRole}>
                Alterar papel
              </Button>
            )}
            {canRemove && (
              <Button variant="danger" size="sm" onClick={onConfirmRemove}>
                Remover
              </Button>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="mt-3 flex items-center gap-2">
          <Select
            className="h-9 text-sm"
            defaultValue={member.role}
            onChange={(e) => onRoleChange(e.target.value as GroupRole)}
          >
            {ROLES_BY_OWNER.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </Select>
          <Button variant="ghost" size="sm" onClick={onEditRole}>Cancelar</Button>
        </div>
      )}

      {isConfirming && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-arena-danger/5 border border-arena-danger/20 p-3">
          <p className="flex-1 text-sm text-arena-danger">Confirmar remoção deste membro?</p>
          <Button variant="ghost" size="sm" onClick={onCancelRemove}>Cancelar</Button>
          <Button variant="danger" size="sm" loading={isRemoving} onClick={onRemove}>
            Remover
          </Button>
        </div>
      )}
    </div>
  )
}
