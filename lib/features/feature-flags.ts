const flags: Record<string, boolean> = {
  sandbox: true,
  createMode: true,
  deployGuard: true,
  previewRuntime: true,
};

export function featureEnabled(key: string): boolean {
  return !!flags[key];
}

export function setFeature(key: string, value: boolean): void {
  flags[key] = value;
}

export function listFeatures(): Record<string, boolean> {
  return { ...flags };
}

export function enableCreateMode(): void {
  setFeature("createMode", true);
}

export function disableCreateMode(): void {
  setFeature("createMode", false);
}
