import { Solari } from "@solarisdk/browser";

let _solari: Solari | null = null;

export function getSolariClient(): Solari {
  if (!_solari) {
    const apiKey = process.env.SOLARI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "SOLARI_API_KEY is not set. Add it to .env.local or environment."
      );
    }
    _solari = new Solari({ apiKey });
  }
  return _solari;
}

export async function closeSolariClient(): Promise<void> {
  if (_solari) {
    await _solari.close();
    _solari = null;
  }
}
