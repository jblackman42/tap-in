let store: string[] = [];

export function getCustomPrompts(): string[] {
  return store;
}

export function setCustomPrompts(prompts: string[]): void {
  store = [...prompts];
}

export function clearCustomPrompts(): void {
  store = [];
}
