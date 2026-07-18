/**
 * Minimal ambient declarations for the map engines loaded at runtime via
 * <script> tags (see useOpsMap). We intentionally avoid the full
 * @types/google.maps / @types/leaflet dependencies; the Operations Map uses a
 * thin, loosely-typed surface of each API.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const google: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const L: any;

interface Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  google?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  L?: any;
  __gmapsPromise?: Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __leafletPromise?: Promise<any>;
  /** Google invokes this global when a key is invalid/unauthorized/over-quota. */
  gm_authFailure?: () => void;
  /** Bridge so the active useOpsMap instance can react to late auth failures. */
  __opsMapOnGoogleAuthFail?: (() => void) | null;
}
