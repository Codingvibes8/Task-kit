export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function actionError(
  error: string,
  fieldErrors?: Record<string, string[]>,
): { ok: false; error: string; fieldErrors?: Record<string, string[]> } {
  return { ok: false, error, fieldErrors };
}

export function actionOk<T>(data: T): { ok: true; data: T } {
  return { ok: true, data };
}
