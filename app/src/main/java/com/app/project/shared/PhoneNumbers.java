package com.app.project.shared;

// Padroniza telefones para serem guardados só com dígitos (DDD + número).
// Assim "(75) 99812-4410", "75 99812 4410" e "+55 75 99812-4410" viram o mesmo "75998124410",
// e a busca por telefone e a detecção de cliente repetido passam a funcionar.
// A formatação "(75) 99812-4410" fica a cargo do frontend.
public final class PhoneNumbers {

    private static final String COUNTRY_CODE = "55";

    private PhoneNumbers() {
    }

    // Retorna só os dígitos, sem o +55. Texto vazio (ou só pontuação) vira null (telefone não informado).
    // Lança IllegalArgumentException se não tiver DDD + 8 ou 9 dígitos.
    public static String normalize(String phone) {
        if (phone == null) {
            return null;
        }

        String digits = phone.replaceAll("\\D", "");

        if (digits.isEmpty()) {
            return null;
        }

        // +55 75 99812-4410 → 75998124410 (12 ou 13 dígitos começando com 55).
        if ((digits.length() == 12 || digits.length() == 13) && digits.startsWith(COUNTRY_CODE)) {
            digits = digits.substring(COUNTRY_CODE.length());
        }

        // 0 75 99812-4410 (prefixo de interurbano) → 75998124410.
        if ((digits.length() == 11 || digits.length() == 12) && digits.startsWith("0")) {
            digits = digits.substring(1);
        }

        if (digits.length() != 10 && digits.length() != 11) {
            throw new IllegalArgumentException("Telefone inválido. Informe o DDD e o número, ex.: (75) 99812-4410.");
        }

        return digits;
    }

    // Versão tolerante, para buscas e para limpar dados antigos: se não der para padronizar,
    // devolve só os dígitos (ou null) em vez de lançar erro.
    public static String normalizeLenient(String phone) {
        try {
            return normalize(phone);
        } catch (IllegalArgumentException e) {
            String digits = phone.replaceAll("\\D", "");
            return digits.isEmpty() ? null : digits;
        }
    }
}
