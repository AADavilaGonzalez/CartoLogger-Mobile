let activeMapId: number | null = null;

export function setActiveMapId(id: number): void {
  activeMapId = id;
}

export function getActiveMapId(): number | null {
  return activeMapId;
}
