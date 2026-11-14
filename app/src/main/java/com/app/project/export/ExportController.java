package com.app.project.export;

import com.app.project.shared.CsvWriter;
import com.app.project.shared.GsonFactory;
import com.google.gson.Gson;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

import fi.iki.elonen.NanoHTTPD;
import fi.iki.elonen.NanoHTTPD.IHTTPSession;
import fi.iki.elonen.NanoHTTPD.Response;
import fi.iki.elonen.NanoHTTPD.Response.Status;

public class ExportController {
    private static final String BASE_URI = "/api/v1/export";
    private static final String SALES_URI = BASE_URI + "/sales";
    private static final String INSTALLMENTS_URI = BASE_URI + "/installments";
    private static final String CLIENTS_URI = BASE_URI + "/clients";
    private static final String PRODUCTS_URI = BASE_URI + "/products";

    private final ExportService exportService;
    private final Gson gson;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
        this.gson = GsonFactory.create();
    }

    public Response handleGetRequest(IHTTPSession session) {
        String uri = session.getUri();
        Map<String, List<String>> params = session.getParameters();

        try {
            if (SALES_URI.equals(uri)) {
                return exportSales(params);
            }

            if (INSTALLMENTS_URI.equals(uri)) {
                return exportInstallments(params);
            }

            if (CLIENTS_URI.equals(uri)) {
                return csvResponse(exportService.exportClients());
            }

            if (PRODUCTS_URI.equals(uri)) {
                return csvResponse(exportService.exportProducts());
            }

            return errorResponse(Status.NOT_FOUND,
                    "Exportação não encontrada. Use sales, installments, clients ou products.");
        } catch (NumberFormatException e) {
            return errorResponse(Status.BAD_REQUEST, "Parâmetro numérico inválido.");
        } catch (DateTimeParseException e) {
            return errorResponse(Status.BAD_REQUEST, "Data inválida. Use o formato AAAA-MM-DD.");
        } catch (IllegalArgumentException e) {
            return errorResponse(Status.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return errorResponse(Status.INTERNAL_ERROR, "Erro interno ao gerar o arquivo de exportação.");
        }
    }

    private Response exportSales(Map<String, List<String>> params) {
        Long clientId = optionalPositiveLongParam(params, "clientId");
        LocalDate startDate = optionalDateParam(params, "startDate");
        LocalDate endDate = optionalDateParam(params, "endDate");

        validatePeriod(startDate, endDate);

        return csvResponse(exportService.exportSales(clientId, startDate, endDate));
    }

    private Response exportInstallments(Map<String, List<String>> params) {
        Long clientId = optionalPositiveLongParam(params, "clientId");
        LocalDate startDate = optionalDateParam(params, "startDate");
        LocalDate endDate = optionalDateParam(params, "endDate");
        ExportService.InstallmentStatus status =
                ExportService.InstallmentStatus.fromParam(firstParam(params, "status"));

        validatePeriod(startDate, endDate);

        return csvResponse(exportService.exportInstallments(clientId, startDate, endDate, status));
    }

    private String firstParam(Map<String, List<String>> params, String name) {
        List<String> values = params.get(name);

        if (values == null || values.isEmpty() || values.get(0) == null || values.get(0).trim().isEmpty()) {
            return null;
        }
        return values.get(0).trim();
    }

    private Long optionalPositiveLongParam(Map<String, List<String>> params, String name) {
        String value = firstParam(params, name);

        if (value == null) {
            return null;
        }

        long parsed = Long.parseLong(value);

        if (parsed < 1) {
            throw new IllegalArgumentException("O parâmetro " + name + " deve ser maior que zero.");
        }
        return parsed;
    }

    private LocalDate optionalDateParam(Map<String, List<String>> params, String name) {
        String value = firstParam(params, name);
        return value == null ? null : LocalDate.parse(value);
    }

    private void validatePeriod(LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return;
        }

        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Os parâmetros startDate e endDate devem ser informados juntos.");
        }

        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("O endDate não pode ser anterior ao startDate.");
        }
    }

    private Response csvResponse(CsvFile file) {
        byte[] content = file.getContent();

        Response response = NanoHTTPD.newFixedLengthResponse(
                Status.OK, CsvWriter.CONTENT_TYPE, new ByteArrayInputStream(content), content.length);

        response.addHeader("Content-Disposition", "attachment; filename=\"" + file.getFileName() + "\"");

        response.addHeader("Cache-Control", "no-store");

        response.addHeader("X-Content-Type-Options", "nosniff");

        return response;
    }

    private Response errorResponse(Status status, String message) {
        String safeMessage = message != null ? message : "Erro ao processar a requisição.";
        return NanoHTTPD.newFixedLengthResponse(status, "application/json; charset=UTF-8",
                gson.toJson(Map.of("error", safeMessage)));
    }
}
