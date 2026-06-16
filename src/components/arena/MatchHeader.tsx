import { MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MatchHeaderProps {
  groupName: string
  scheduledAt: string
  location: { name: string; address?: string }
  maxPlayers: number
  confirmedCount: number
  matchStatus: "SCHEDULED" | "COMPLETED" | "CANCELLED"
  presenceListStatus: "OPEN" | "CLOSED"
  userPresenceStatus?: "CONFIRMED" | "DECLINED" | null
  onAction?: () => void
  className?: string
}

function formatMatchDate(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }),
    time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  }
}

function getActionConfig(
  matchStatus: MatchHeaderProps["matchStatus"],
  presenceListStatus: MatchHeaderProps["presenceListStatus"],
  userPresenceStatus: MatchHeaderProps["userPresenceStatus"],
): { label: string; variant: "primary" | "danger" | "ghost"; disabled: boolean } {
  if (matchStatus === "CANCELLED") return { label: "Partida cancelada", variant: "ghost", disabled: true }
  if (matchStatus === "COMPLETED") return { label: "Partida encerrada", variant: "ghost", disabled: true }
  if (presenceListStatus === "CLOSED") return { label: "Lista encerrada", variant: "ghost", disabled: true }
  if (userPresenceStatus === "CONFIRMED") return { label: "Cancelar presença", variant: "danger", disabled: false }
  return { label: "Confirmar presença", variant: "primary", disabled: false }
}

export function MatchHeader({
  groupName,
  scheduledAt,
  location,
  maxPlayers,
  confirmedCount,
  matchStatus,
  presenceListStatus,
  userPresenceStatus = null,
  onAction,
  className,
}: MatchHeaderProps) {
  const { date, time } = formatMatchDate(scheduledAt)
  const progressPct = Math.min(100, Math.round((confirmedCount / maxPlayers) * 100))
  const action = getActionConfig(matchStatus, presenceListStatus, userPresenceStatus)

  return (
    <div className={cn("bg-arena-surface rounded-card border border-arena-border p-4 flex flex-col gap-4", className)}>
      {/* Nome do grupo */}
      <div>
        <p className="text-label text-arena-muted">Grupo</p>
        <h1 className="font-display text-hero text-arena-text uppercase">{groupName}</h1>
      </div>

      {/* Data, hora e local */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-caption text-arena-muted">
          <Clock className="size-3.5 shrink-0" />
          <span>
            {date} · {time}
          </span>
        </div>
        <div className="flex items-center gap-2 text-caption text-arena-muted">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {location.name}
            {location.address && (
              <span className="text-arena-muted/60"> · {location.address}</span>
            )}
          </span>
        </div>
      </div>

      {/* Barra de presença */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-label text-arena-muted">Confirmados</span>
          <span className="text-body font-medium text-arena-text">
            {confirmedCount}
            <span className="text-arena-muted font-normal"> / {maxPlayers}</span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-arena-raised overflow-hidden">
          <div
            className="h-full rounded-full bg-arena-accent transition-all duration-500"
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuenow={confirmedCount}
            aria-valuemax={maxPlayers}
          />
        </div>
      </div>

      {/* Botão de ação */}
      <Button
        variant={action.variant}
        size="md"
        disabled={action.disabled}
        className="w-full"
        onClick={onAction}
      >
        {action.label}
      </Button>
    </div>
  )
}
