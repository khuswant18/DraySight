let _solari: any = null;

export async function getSolariClient(): Promise<any> {
  if (!_solari) {
    const apiKey = process.env.SOLARI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "SOLARI_API_KEY is not set. Please add it to your environment variables."
      );
    }
    const { Solari } = await import("@solarisdk/browser");
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
