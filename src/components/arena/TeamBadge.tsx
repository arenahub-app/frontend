import { Divider } from "@/components/ui/divider"
import { cn } from "@/lib/utils"

const TEAM_COLORS = [
  "#f97316", // laranja
  "#06b6d4", // ciano
  "#22c55e", // verde
  "#8b5cf6", // roxo
  "#ef4444", // vermelho
  "#eab308", // amarelo
]

export function getTeamColor(index: number): string {
  return TEAM_COLORS[index % TEAM_COLORS.length]
}

interface TeamPlayer {
  name: string
  photoUrl?: string
}

interface TeamBadgeProps {
  name: string
  color?: string
  averageSkill: number
  players: TeamPlayer[]
  className?: string
}

export function TeamBadge({
  name,
  color = TEAM_COLORS[0],
  averageSkill,
  players,
  className,
}: TeamBadgeProps) {
  const playerNames = players.map((p) => p.name.split(" ")[0]).join(" · ")

  return (
    <div
      className={cn(
        "rounded-card bg-arena-surface border border-arena-border overflow-hidden",
        className
      )}
    >
      {/* Header do time */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="size-3 rounded-full shrink-0"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <span className="font-display text-title text-arena-text uppercase tracking-wide">
            {name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-caption text-arena-muted">
            {players.length} jog.
          </span>
          <span className="text-label text-arena-accent">★ {averageSkill.toFixed(1)}</span>
        </div>
      </div>

      <Divider />

      {/* Lista de jogadores */}
      <p className="px-4 py-3 text-caption text-arena-muted leading-relaxed">
        {playerNames || "Sem jogadores"}
      </p>
    </div>
  )
}
