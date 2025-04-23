// Type definitions for Service Worker
interface ServiceWorkerGlobalScope {
  self: ServiceWorkerGlobalScope;
  caches: CacheStorage;
  clients: Clients;
  registration: ServiceWorkerRegistration;
  addEventListener(
    event: string,
    listener: EventListenerOrEventListenerObject,
  ): void;
  skipWaiting(): Promise<void>;
  fetch(request: Request | string): Promise<Response>;
}

interface Clients {
  claim(): Promise<void>;
  get(id: string): Promise<Client>;
  matchAll(options?: ClientMatchOptions): Promise<Client[]>;
  openWindow(url: string): Promise<WindowClient>;
}

interface ClientMatchOptions {
  includeUncontrolled?: boolean;
  type?: "window" | "worker" | "sharedworker" | "all";
}

interface Client {
  id: string;
  type: "window" | "worker" | "sharedworker";
  url: string;
}

interface WindowClient extends Client {
  focused: boolean;
  visibilityState: "hidden" | "visible" | "prerender" | "unloaded";
  focus(): Promise<WindowClient>;
  navigate(url: string): Promise<WindowClient>;
}

interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<any>): void;
}

interface FetchEvent extends ExtendableEvent {
  clientId: string;
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
}

interface InstallEvent extends ExtendableEvent {
  activeWorker: ServiceWorker;
}

type ActivateEvent = ExtendableEvent

declare let self: ServiceWorkerGlobalScope;
