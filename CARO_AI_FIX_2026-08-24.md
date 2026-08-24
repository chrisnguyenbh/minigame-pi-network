# Caro AI fix - 2026-08-24

- Fixed tactical threat detection to use fullTacticalScore for broken/compound patterns.
- Fixed references to patternFours/patternThrees that were previously read from classifyMove even though classifyMove does not return them.
- Added safestDefensiveMove(): simulates candidate O defenses and chooses the move that minimizes X's remaining tactical danger.
- Immediate win and immediate mandatory block still have highest priority.
- Reduced brute-force alpha-beta settings slightly so the stronger tactical layer gets time without excessive browser stalls.
