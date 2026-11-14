package com.app.project.shared;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public final class CsvWriter {
    public static final String CONTENT_TYPE = "text/csv; charset=UTF-8";

    private static final char SEPARATOR = ';';
    private static final String LINE_END = "\r\n";
    private static final char UTF8_BOM = '﻿';
    private static final int MONEY_SCALE = 2;
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final StringBuilder content = new StringBuilder().append(UTF8_BOM);

    public CsvWriter row(Object... values) {
        for (int i = 0; i < values.length; i++) {
            if (i > 0) {
                content.append(SEPARATOR);
            }
            content.append(formatCell(values[i]));
        }

        content.append(LINE_END);
        return this;
    }

    public byte[] toBytes() {
        return content.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static String formatCell(Object value) {
        if (value == null) {
            return "";
        }

        if (value instanceof BigDecimal) {
            return formatMoney((BigDecimal) value);
        }

        if (value instanceof LocalDate) {
            return ((LocalDate) value).format(DATE_FORMAT);
        }

        if (value instanceof Number) {
            return value.toString();
        }

        return escapeText(value.toString());
    }

    private static String formatMoney(BigDecimal value) {
        return value.setScale(MONEY_SCALE, RoundingMode.HALF_UP).toPlainString().replace('.', ',');
    }

    static String escapeText(String text) {
        String safe = neutralizeFormula(text);

        boolean needsQuotes = safe.indexOf(SEPARATOR) >= 0
                || safe.indexOf('"') >= 0
                || safe.indexOf('\n') >= 0
                || safe.indexOf('\r') >= 0;

        if (!needsQuotes) {
            return safe;
        }

        return '"' + safe.replace("\"", "\"\"") + '"';
    }

    private static String neutralizeFormula(String text) {
        if (text.isEmpty()) {
            return text;
        }

        char first = text.charAt(0);

        if (first == '=' || first == '+' || first == '-' || first == '@' || first == '\t' || first == '\r') {
            return "'" + text;
        }

        return text;
    }
}
