/**
 * Extracts a party code from a scanned QR string. Host QR codes use
 * `${origin}/join/${code}`; plain codes are also accepted.
 */
function tryParseAsUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    try {
      if (/^https?:\/\//i.test(raw)) return null;
      return new URL(`https://${raw}`);
    } catch {
      return null;
    }
  }
}

export function parseJoinCodeFromScan(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const u = tryParseAsUrl(trimmed);
  if (u) {
    const fromPath = extractCodeFromJoinPath(u.pathname);
    if (fromPath) return fromPath;
  }

  const pathOnly = trimmed.includes("/")
    ? trimmed.replace(/^[^/]*\/\/[^/]+/, "").split("?")[0] ?? ""
    : "";
  if (pathOnly) {
    const fromPath = extractCodeFromJoinPath(pathOnly);
    if (fromPath) return fromPath;
  }

  const slashMatch = trimmed.match(/\/join\/([A-Za-z0-9]+)/i);
  if (slashMatch) {
    const code = slashMatch[1].toUpperCase();
    if (isValidPartyCodeLength(code)) return code;
  }

  const compact = trimmed.toUpperCase().replace(/\s/g, "");
  if (isValidPartyCodeLength(compact)) return compact;

  return null;
}

function extractCodeFromJoinPath(pathname: string): string | null {
  const m = pathname.match(/\/join\/([A-Za-z0-9]+)/i);
  if (!m) return null;
  const code = m[1].toUpperCase();
  return isValidPartyCodeLength(code) ? code : null;
}

function isValidPartyCodeLength(code: string): boolean {
  return /^[A-Z0-9]{4,6}$/.test(code);
}
