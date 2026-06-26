export const CHARGE_INSPECTOR_CSV_TEXT_MAX_LENGTH = 250_000;
export const CHARGE_INSPECTOR_CSV_REQUEST_MAX_LENGTH =
  CHARGE_INSPECTOR_CSV_TEXT_MAX_LENGTH + 2_000;

export class ChargeInspectorCsvRequestError extends Error {}

export function parseChargeInspectorCsvRequestBody(value: unknown): string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ChargeInspectorCsvRequestError(
      "Charge Inspector CSV request must be an object.",
    );
  }

  const csvText = (value as Record<string, unknown>).csvText;
  if (typeof csvText !== "string") {
    throw new ChargeInspectorCsvRequestError(
      "csvText must be submitted as text.",
    );
  }

  if (csvText.trim().length === 0) {
    throw new ChargeInspectorCsvRequestError("csvText must not be blank.");
  }

  if (csvText.length > CHARGE_INSPECTOR_CSV_TEXT_MAX_LENGTH) {
    throw new ChargeInspectorCsvRequestError(
      "csvText must be 250,000 characters or fewer.",
    );
  }

  return csvText;
}

export function chargeInspectorCsvRequestBodyExceedsLimit(
  contentLength: string | null,
): boolean {
  if (contentLength === null) {
    return false;
  }

  const length = Number(contentLength);
  if (!Number.isFinite(length) || length < 0) {
    return false;
  }

  return length > CHARGE_INSPECTOR_CSV_REQUEST_MAX_LENGTH;
}
