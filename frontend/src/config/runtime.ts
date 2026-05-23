/**
 * Runtime configuration resolver
 *
 * Priority: runtime env (window.__TELEMETRYFLOW_RUNTIME__) > build-time (import.meta.env) > fallback
 *
 * The runtime object is generated at container startup by docker-entrypoint-viz.sh
 * from Helm ConfigMap env vars, allowing per-deployment overrides without rebuilding
 * the Docker image.
 */

export function rt(key: string, fallback: string = ""): string {
  const runtime = (window as any).__TELEMETRYFLOW_RUNTIME__;
  if (runtime && runtime[key] != null && runtime[key] !== "")
    return runtime[key];
  const buildTime = (import.meta.env as any)[key];
  if (buildTime != null && buildTime !== "") return buildTime;
  return fallback;
}
