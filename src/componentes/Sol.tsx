// El solecito con carita: su símbolo. En la fase 3 será el botón de ajustes;
// por ahora solo se ve. Los rayos van un poco chuecos a propósito, como dibujados a mano.

const RAYOS: [angulo: number, largo: number][] = [
  [-82, 10], [-55, 11], [-25, 9], [8, 11], [35, 9], [62, 10],
  [95, 11], [122, 9], [150, 11], [180, 10], [208, 9], [238, 11],
]

export function Sol({ tamano = 34 }: { tamano?: number }) {
  return (
    <svg className="sol" width={tamano} height={tamano} viewBox="0 0 100 100" aria-hidden="true">
      <g stroke="var(--sol)" strokeWidth="6.5" strokeLinecap="round">
        {RAYOS.map(([angulo, largo]) => {
          const r = (angulo * Math.PI) / 180
          const desde = 37
          return (
            <line
              key={angulo}
              x1={50 + desde * Math.cos(r)}
              y1={50 + desde * Math.sin(r)}
              x2={50 + (desde + largo) * Math.cos(r)}
              y2={50 + (desde + largo) * Math.sin(r)}
            />
          )
        })}
      </g>
      <circle cx="50" cy="50" r="27" fill="var(--sol)" />
      <g transform="rotate(-8 50 50)">
        <circle cx="38" cy="54" r="4.6" fill="var(--rosa)" />
        <circle cx="64" cy="54" r="4.6" fill="var(--rosa)" />
        <circle cx="42" cy="45" r="3.1" fill="var(--vino)" />
        <circle cx="59" cy="45" r="3.1" fill="var(--vino)" />
        <path d="M41 55 Q50.5 64 60 55" fill="none" stroke="var(--vino)" strokeWidth="3.6" strokeLinecap="round" />
      </g>
    </svg>
  )
}
