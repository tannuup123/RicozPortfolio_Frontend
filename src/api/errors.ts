/**
 * Shared API error parser for RicozPortfolio frontend.
 *
 * Handles the implemented FastAPI error contract from the backend.
 * Parses both string details and 422 validation arrays.
 * Preserves HTTP status and error code.
 */

export interface ApiError extends Error {
  status: number
  code?: string
  fieldErrors?: Record<string, string>
}

export async function parseApiError(response: Response): Promise<ApiError> {
  // Initialize with a safe fallback so `message` is always a string,
  // even if body.detail is an empty array or the JSON parse fails.
  let message = `Request failed with status ${response.status}`
  let code: string | undefined
  let fieldErrors: Record<string, string> = {}

  // Read the response body once with a safe fallback
  try {
    const body = (await response.json()) as Record<string, unknown>

    // Support the implemented FastAPI contract:
    // - string {"detail": "..."}
    // - validation arrays {"detail": [{"loc": [...], "msg": "...", "type": "..."}]}
    // - Defensive fallback for any {"error": {"code": "...", "message": "..."}} envelope
    if (body.detail && typeof body.detail === 'string') {
      message = body.detail as string
    } else if (body.detail && Array.isArray(body.detail)) {
      // Parse 422 validation detail array
      // Build fieldErrors from each validation item's loc and msg
      const array = body.detail as Array<unknown>

      for (const item of array) {
        if (typeof item === 'object' && item !== null) {
          const typedItem = item as Record<string, unknown>
          if ('loc' in typedItem && 'msg' in typedItem) {
            const rawLoc = typedItem.loc
            const msg = typedItem.msg

            if (!Array.isArray(rawLoc) || typeof msg !== 'string') continue

            const loc = rawLoc as Array<unknown>

            // Skip the leading 'body' segment only when it is actually present.
            // A loc like ["query", "field"] must not have its first element dropped.
            const fieldPath = loc.length > 0 && loc[0] === 'body' ? loc.slice(1) : loc
            const fieldName = fieldPath.map(String).join('.') || '<root>'

            fieldErrors[fieldName] = msg

            // Use the first field message as the top-level message
            if (message === `Request failed with status ${response.status}`) {
              message = msg
            }
          }
        }
      }

      // If no valid field errors were parsed, use a generic validation message
      if (Object.keys(fieldErrors).length === 0 && array.length > 0) {
        message = 'Validation error'
      }
    } else if (
      body.error &&
      typeof body.error === 'object' &&
      'message' in (body.error as Record<string, unknown>)
    ) {
      // Defensive fallback for the {"error": {"code": "...", "message": "..."}} envelope
      // documented in architecture.md (not currently emitted by the FastAPI backend).
      const errorObj = body.error as Record<string, unknown>
      message = errorObj.message as string
      if (typeof errorObj.code === 'string' && errorObj.code) {
        code = errorObj.code
      }
    }
  } catch {
    // JSON parse failure — keep the initialized fallback message
  }

  const error = new Error(message) as ApiError
  error.status = response.status

  if (code) {
    error.code = code
  }

  // Add field errors if any were parsed
  if (Object.keys(fieldErrors).length > 0) {
    error.fieldErrors = fieldErrors
  }

  return error
}