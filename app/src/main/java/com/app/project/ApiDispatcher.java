package com.app.project;

import com.app.project.client.ClientController;
import com.app.project.export.ExportController;
import com.app.project.products.ProductController;
import com.app.project.sale.SaleController;
import com.app.project.shared.NotFound;

import java.util.function.Function;

import fi.iki.elonen.NanoHTTPD;
import fi.iki.elonen.NanoHTTPD.IHTTPSession;
import fi.iki.elonen.NanoHTTPD.Method;
import fi.iki.elonen.NanoHTTPD.Response;
import fi.iki.elonen.NanoHTTPD.Response.Status;

public class ApiDispatcher {
    private static final String CLIENTS_URI = "/api/v1/clients";
    private static final String PRODUCTS_URI = "/api/v1/products";
    private static final String SALES_URI = "/api/v1/sales";
    private static final String EXPORT_URI = "/api/v1/export";

    private static final String ALLOWED_METHODS = "GET, POST, DELETE";

    private static final String EXPORT_ALLOWED_METHODS = "GET";

    private final ClientController clientController;
    private final ProductController productController;
    private final SaleController saleController;
    private final ExportController exportController;
    private final NotFound notFound;

    public ApiDispatcher(ClientController clientController,
                         ProductController productController,
                         SaleController saleController,
                         ExportController exportController,
                         NotFound notFound) {
        this.clientController = clientController;
        this.productController = productController;
        this.saleController = saleController;
        this.exportController = exportController;
        this.notFound = notFound;
    }

    public Response toDispatcher(IHTTPSession session) {
        String uri = session.getUri();

        if (belongsTo(uri, CLIENTS_URI)) {
            return dispatchByMethod(session,
                    clientController::handleGetRequest,
                    clientController::handlePostRequest,
                    clientController::handleDeleteRequest);
        }

        if (belongsTo(uri, PRODUCTS_URI)) {
            return dispatchByMethod(session,
                    productController::handleGetRequest,
                    productController::handlePostRequest,
                    productController::handleDeleteRequest);
        }

        if (belongsTo(uri, SALES_URI)) {
            return dispatchByMethod(session,
                    saleController::handleGetRequest,
                    saleController::handlePostRequest,
                    saleController::handleDeleteRequest);
        }

        if (belongsTo(uri, EXPORT_URI)) {
            if (session.getMethod() == Method.GET) {
                return exportController.handleGetRequest(session);
            }
            return methodNotAllowed(EXPORT_ALLOWED_METHODS);
        }

        return notFound.handleRequest(session);
    }

    private Response dispatchByMethod(IHTTPSession session,
                                      Function<IHTTPSession, Response> getHandler,
                                      Function<IHTTPSession, Response> postHandler,
                                      Function<IHTTPSession, Response> deleteHandler) {
        Method method = session.getMethod();

        if (method == Method.GET) {
            return getHandler.apply(session);
        }

        if (method == Method.POST) {
            return postHandler.apply(session);
        }

        if (method == Method.DELETE) {
            return deleteHandler.apply(session);
        }

        return methodNotAllowed(ALLOWED_METHODS);
    }

    private boolean belongsTo(String uri, String baseUri) {
        return uri.equals(baseUri) || uri.startsWith(baseUri + "/");
    }

    private Response methodNotAllowed(String allowedMethods) {
        Response response = NanoHTTPD.newFixedLengthResponse(
                Status.METHOD_NOT_ALLOWED,
                "application/json; charset=UTF-8",
                "{\"error\": \"Método não permitido. Use " + allowedMethods + ".\"}"
        );

        response.addHeader("Allow", allowedMethods);
        return response;
    }
}
