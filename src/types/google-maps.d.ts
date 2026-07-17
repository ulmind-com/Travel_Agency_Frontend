/**
 * Minimal ambient declaration for the Google Maps JS API loaded at runtime via
 * a <script> tag (see useGoogleMaps). We intentionally avoid the full
 * @types/google.maps dependency; the Operations Map uses a thin, loosely-typed
 * surface of the API.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const google: any;

interface Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  google?: any;
  __gmapsPromise?: Promise<void>;
}
