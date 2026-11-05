// Remove personal identifiers before any text is sent to an external AI model.
// Aadhaar (12 digits, optionally grouped 4-4-4), Indian mobile numbers, emails.

export function maskPII(text: string): string {
  return text
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[AADHAAR]")
    .replace(/(\+?91[\s-]?)?\b[6-9]\d{9}\b/g, "[PHONE]")
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[EMAIL]");
}

export function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `XXXXXX${d.slice(6)}` : "";
}

export function detectLanguage(text: string): "hi" | "en" | "mixed" {
  const deva = (text.match(/[ऀ-ॿ]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  if (deva === 0) return "en";
  if (latin === 0 || deva / (deva + latin) > 0.8) return "hi";
  return "mixed";
}
