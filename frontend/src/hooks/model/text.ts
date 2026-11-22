/** "Fábio  Costa" → "fabio costa": para buscas que ignoram acento e maiúsculas. */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function onlyDigits(text: string): string {
  return text.replace(/\D/g, '');
}

/** Busca "por nome ou telefone": nome sem acento, ou sequência de dígitos dentro do telefone. */
export function matchesSearch(term: string, name: string, phone?: string | null): boolean {
  const query = normalizeText(term);
  if (!query) return true;
  if (normalizeText(name).includes(query)) return true;
  const digits = onlyDigits(term);
  return digits.length >= 2 && !!phone && onlyDigits(phone).includes(digits);
}
