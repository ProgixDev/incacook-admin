export interface DispatchRadiusStep {
  afterSeconds: number;
  radiusMeters: number | null;
}

export interface DispatchRadiusInputRow {
  delay: string;
  radius: string;
}

export interface ParsedDispatchRadius {
  steps: DispatchRadiusStep[] | null;
  error: string | null;
}

function parseDelay(value: string): number | null {
  const match = /^(\d+):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (!Number.isSafeInteger(minutes) || seconds > 59) return null;
  const total = minutes * 60 + seconds;
  return Number.isSafeInteger(total) ? total : null;
}

function invalid(error: string): ParsedDispatchRadius {
  return { steps: null, error };
}

export function parseDispatchRadiusSteps(
  rows: DispatchRadiusInputRow[],
  noDriverTimeoutSeconds: number,
): ParsedDispatchRadius {
  if (rows.length < 1 || rows.length > 8) {
    return invalid("Le programme doit contenir entre 1 et 8 étapes.");
  }

  const steps: DispatchRadiusStep[] = [];
  let previousDelay = -1;
  let previousRadius = 0;

  for (const [index, row] of rows.entries()) {
    const delay = parseDelay(row.delay);
    if (delay === null) {
      return invalid(`L’étape ${index + 1} doit utiliser le format minutes:secondes (secondes de 00 à 59).`);
    }
    if ((index === 0 && delay !== 0) || delay <= previousDelay) {
      return invalid("Le premier délai doit être 00:00, puis les délais doivent être strictement croissants.");
    }
    if (index === rows.length - 1 && delay >= noDriverTimeoutSeconds) {
      return invalid("Le dernier délai doit être inférieur au délai sans livreur.");
    }

    const radiusText = row.radius.trim().replace(",", ".");
    if (radiusText === "") {
      if (index !== rows.length - 1) {
        return invalid("Seule la dernière étape peut être illimitée.");
      }
      steps.push({ afterSeconds: delay, radiusMeters: null });
    } else {
      if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(radiusText)) {
        return invalid("Chaque rayon doit être un nombre décimal en km.");
      }
      const radiusKm = Number(radiusText);
      if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 200) {
        return invalid("Chaque rayon doit être un nombre supérieur à 0 et inférieur ou égal à 200 km.");
      }
      const radiusMeters = Math.round(radiusKm * 1000);
      if (radiusMeters < 1) {
        return invalid("Chaque rayon doit représenter au moins un mètre.");
      }
      if (radiusMeters <= previousRadius) {
        return invalid("Les rayons doivent être strictement croissants.");
      }
      steps.push({ afterSeconds: delay, radiusMeters });
      previousRadius = radiusMeters;
    }
    previousDelay = delay;
  }

  return { steps, error: null };
}
