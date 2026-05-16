import { registerSW } from "virtual:pwa-register";

const UPDATE_READY_EVENT = "eurovision-ranker-update-ready";

let applyServiceWorkerUpdate: ((reloadPage?: boolean) => Promise<void>) | null = null;

export function registerServiceWorker(): void {
  applyServiceWorkerUpdate = registerSW({
    immediate: true,
    onNeedRefresh() {
      window.dispatchEvent(new Event(UPDATE_READY_EVENT));
    }
  });
}

export function subscribeToServiceWorkerUpdates(onUpdateReady: () => void): () => void {
  window.addEventListener(UPDATE_READY_EVENT, onUpdateReady);
  return () => window.removeEventListener(UPDATE_READY_EVENT, onUpdateReady);
}

export async function reloadForServiceWorkerUpdate(): Promise<void> {
  await applyServiceWorkerUpdate?.(true);
}
