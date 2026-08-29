export enum MatchPhase {
  REGULAR = 'regular',
  QUARTERFINAL = 'quarterfinal',
  SEMIFINAL = 'semifinal',
  FINAL = 'final',
}

export const PLAYOFF_PHASES: MatchPhase[] = [
  MatchPhase.QUARTERFINAL,
  MatchPhase.SEMIFINAL,
  MatchPhase.FINAL,
];

export function isPlayoffPhase(phase: string | null | undefined): boolean {
  return (
    phase === MatchPhase.QUARTERFINAL ||
    phase === MatchPhase.SEMIFINAL ||
    phase === MatchPhase.FINAL
  );
}
