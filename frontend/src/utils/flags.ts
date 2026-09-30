export type EnvVar = { key: string; value: string };
export type FlagPair = { key: string; value: string };

const emptyFlags = (): FlagPair[] => [{ key: "", value: "" }];

export const parseFlags = (flags: string[] | undefined | null): FlagPair[] => {
  if (!flags || flags.length === 0) return emptyFlags();
  const pairs: FlagPair[] = [];
  let i = 0;
  while (i < flags.length) {
    const token = flags[i];
    const next = i + 1 < flags.length ? flags[i + 1] : undefined;
    if (token.startsWith("--")) {
      if (next !== undefined && !next.startsWith("--")) {
        pairs.push({ key: token, value: next });
        i += 2;
      } else {
        pairs.push({ key: token, value: "" });
        i += 1;
      }
    } else {
      pairs.push({ key: token, value: "" });
      i += 1;
    }
  }
  return pairs.length > 0 ? pairs : emptyFlags();
};

export const serializeFlags = (pairs: FlagPair[]): string[] => {
  const out: string[] = [];
  for (const p of pairs) {
    const k = p.key.trim();
    if (!k) continue;
    out.push(k);
    const v = p.value.trim();
    if (v) out.push(v);
  }
  return out;
};

export const envPairsToObj = (pairs: EnvVar[]): Record<string, string> => {
  const obj: Record<string, string> = {};
  for (const p of pairs) {
    const k = p.key.trim();
    if (k) obj[k] = p.value;
  }
  return obj;
};

export const envObjToPairs = (obj: Record<string, string> | undefined | null): EnvVar[] => {
  const pairs = Object.entries(obj || {}).map(([key, value]) => ({ key, value: String(value) }));
  return pairs.length > 0 ? pairs : [{ key: "", value: "" }];
};

export const canonicalEnvText = (val: unknown): string => {
  if (val === null || val === undefined) return "(null)";
  if (typeof val !== "object" || Array.isArray(val)) return String(val);
  const entries = Object.entries(val as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return JSON.stringify(Object.fromEntries(entries));
};

export const envTextToPairs = (txt: string): EnvVar[] => {
  try {
    const parsed = JSON.parse(txt) as Record<string, string>;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return envObjToPairs(parsed);
  } catch {
    /* fall through */
  }
  return [{ key: "", value: "" }];
};

export const flagsText = (pairs: FlagPair[]): string => JSON.stringify(serializeFlags(pairs));

const normalizeFlagTokens = (raw: unknown): string[] => {
  const flat: string[] = [];
  for (const t of Array.isArray(raw) ? (raw.filter((x) => typeof x === "string") as string[]) : []) {
    const s = t.trim();
    if (!s) continue;
    if (s.startsWith("--") && /\s/.test(s)) {
      const idx = s.search(/\s/);
      const val = s.slice(idx).trim();
      flat.push(s.slice(0, idx));
      if (val) flat.push(val);
    } else {
      flat.push(s);
    }
  }
  return flat;
};

export const flagsValText = (val: unknown): string => {
  if (val === null || val === undefined) return "(null)";
  if (!Array.isArray(val)) return String(val);
  return JSON.stringify(normalizeFlagTokens(val));
};

export const flagsTextToPairs = (txt: string): FlagPair[] => {
  try {
    const parsed = JSON.parse(txt) as unknown;
    if (Array.isArray(parsed)) return parseFlags(normalizeFlagTokens(parsed));
  } catch {
    /* fall through */
  }
  return [{ key: "", value: "" }];
};
