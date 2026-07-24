declare module 'jeep-sqlite/loader' {
  export function applyPolyfills(): Promise<void>;
  export function defineCustomElements(win?: Window): Promise<void>;
}
