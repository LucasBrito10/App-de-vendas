package com.app.project.export;

import com.app.project.client.Client;
import com.app.project.client.ClientRepository;
import com.app.project.products.Product;
import com.app.project.products.ProductRepository;
import com.app.project.sale.Installment;
import com.app.project.sale.InstallmentWithSaleInfo;
import com.app.project.sale.SaleItemWithProduct;
import com.app.project.sale.SaleRepository;
import com.app.project.sale.SaleWithDetails;
import com.app.project.shared.CsvWriter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class ExportService {
    public enum InstallmentStatus {
        ALL, PENDING, OVERDUE, PAID;

        public static InstallmentStatus fromParam(String value) {
            if (value == null) {
                return ALL;
            }

            for (InstallmentStatus status : values()) {
                if (status.name().equalsIgnoreCase(value)) {
                    return status;
                }
            }

            throw new IllegalArgumentException("Parâmetro status inválido. Use all, pending, overdue ou paid.");
        }
    }

    private final SaleRepository saleRepository;
    private final ClientRepository clientRepository;
    private final ProductRepository productRepository;

    public ExportService(SaleRepository saleRepository,
                         ClientRepository clientRepository,
                         ProductRepository productRepository) {
        this.saleRepository = saleRepository;
        this.clientRepository = clientRepository;
        this.productRepository = productRepository;
    }

    public CsvFile exportSales(Long clientId, LocalDate startDate, LocalDate endDate) {
        List<SaleWithDetails> sales = saleRepository.findFiltered(clientId, startDate, endDate);
        Map<Long, Client> clientsById = loadClientsById();

        CsvWriter csv = new CsvWriter().row(
                "ID da venda", "Data da compra", "Cliente", "Telefone", "Produtos",
                "Total (R$)", "Parcelas", "Pago (R$)", "Em aberto (R$)");

        for (SaleWithDetails details : sales) {
            Client client = clientsById.get(details.sale.clientId);
            BigDecimal paid = sumPaid(details.installments);

            csv.row(
                    details.sale.saleId,
                    details.sale.purchaseDate,
                    client != null ? client.getName() : null,
                    client != null ? client.getPhone() : null,
                    describeItems(details.items),
                    details.sale.totalPrice,
                    details.installments != null ? details.installments.size() : 0,
                    paid,
                    sumOutstanding(details.installments));
        }

        return new CsvFile(buildFileName("vendas", startDate, endDate), csv.toBytes());
    }

    // Uma linha por produto vendido, para análises como "o que mais vende".
    // Nome e preço vêm do item (valores da época da venda), não do catálogo atual.
    public CsvFile exportSaleItems(Long clientId, LocalDate startDate, LocalDate endDate) {
        List<SaleWithDetails> sales = saleRepository.findFiltered(clientId, startDate, endDate);
        Map<Long, Client> clientsById = loadClientsById();

        CsvWriter csv = new CsvWriter().row(
                "ID da venda", "Data da compra", "Cliente", "Produto",
                "Quantidade", "Preço unitário (R$)", "Subtotal (R$)");

        for (SaleWithDetails details : sales) {
            if (details.items == null) {
                continue;
            }

            Client client = clientsById.get(details.sale.clientId);

            for (SaleItemWithProduct entry : details.items) {
                BigDecimal unitPrice = entry.item.unitPrice;
                BigDecimal subtotal = unitPrice != null
                        ? unitPrice.multiply(BigDecimal.valueOf(entry.item.quantity))
                        : null;

                csv.row(
                        details.sale.saleId,
                        details.sale.purchaseDate,
                        client != null ? client.getName() : null,
                        entry.item.productName,
                        entry.item.quantity,
                        unitPrice,
                        subtotal);
            }
        }

        return new CsvFile(buildFileName("itens_vendas", startDate, endDate), csv.toBytes());
    }

    public CsvFile exportInstallments(Long clientId, LocalDate startDate, LocalDate endDate,
                                      InstallmentStatus status) {
        LocalDate today = LocalDate.now();
        List<InstallmentWithSaleInfo> rows = saleRepository.findInstallmentsWithSaleInfo(clientId, startDate, endDate);

        CsvWriter csv = new CsvWriter().row(
                "ID da venda", "Data da compra", "Cliente", "Telefone", "Parcela",
                "Vencimento", "Valor (R$)", "Situação", "Data do pagamento", "Valor pago (R$)");

        for (InstallmentWithSaleInfo row : rows) {
            Installment installment = row.installment;

            if (!matchesStatus(installment, status, today)) {
                continue;
            }

            csv.row(
                    installment.saleId,
                    row.purchaseDate,
                    row.clientName,
                    row.clientPhone,
                    installment.number,
                    installment.dueDate,
                    installment.amount,
                    describeStatus(installment, today),
                    installment.paidAt,
                    installment.paidAmount);
        }

        String prefix = status == InstallmentStatus.ALL
                ? "parcelas"
                : "parcelas_" + status.name().toLowerCase(Locale.ROOT);

        return new CsvFile(buildFileName(prefix, startDate, endDate), csv.toBytes());
    }

    public CsvFile exportClients() {
        CsvWriter csv = new CsvWriter().row("ID", "Nome", "Telefone");

        for (Client client : clientRepository.findAll()) {
            csv.row(client.getId(), client.getName(), client.getPhone());
        }

        return new CsvFile(buildFileName("clientes", null, null), csv.toBytes());
    }

    public CsvFile exportProducts() {
        CsvWriter csv = new CsvWriter().row("ID", "Nome", "Preço (R$)");

        for (Product product : productRepository.findAll()) {
            csv.row(product.getProductId(), product.getName(), product.getPrice());
        }

        return new CsvFile(buildFileName("produtos", null, null), csv.toBytes());
    }

    private Map<Long, Client> loadClientsById() {
        List<Client> clients = clientRepository.findAll();
        Map<Long, Client> byId = new HashMap<>(clients.size() * 2);

        for (Client client : clients) {
            byId.put(client.getId(), client);
        }
        return byId;
    }

    private String describeItems(List<SaleItemWithProduct> items) {
        if (items == null || items.isEmpty()) {
            return "";
        }

        StringBuilder description = new StringBuilder();

        for (SaleItemWithProduct entry : items) {
            if (description.length() > 0) {
                description.append(", ");
            }
            description.append(entry.item.quantity).append("x ").append(entry.item.productName);
        }

        return description.toString();
    }

    private BigDecimal sumPaid(List<Installment> installments) {
        BigDecimal total = BigDecimal.ZERO;

        if (installments == null) {
            return total;
        }

        for (Installment installment : installments) {
            if (installment.paidAmount != null) {
                total = total.add(installment.paidAmount);
            }
        }
        return total;
    }

    private BigDecimal sumOutstanding(List<Installment> installments) {
        BigDecimal total = BigDecimal.ZERO;

        if (installments == null) {
            return total;
        }

        for (Installment installment : installments) {
            if (installment.paidAt == null && installment.amount != null) {
                total = total.add(installment.amount);
            }
        }
        return total;
    }

    private boolean matchesStatus(Installment installment, InstallmentStatus status, LocalDate today) {
        boolean paid = installment.paidAt != null;

        switch (status) {
            case PAID:
                return paid;
            case PENDING:
                return !paid;
            case OVERDUE:
                return !paid && installment.dueDate.isBefore(today);
            default:
                return true;
        }
    }

    private String describeStatus(Installment installment, LocalDate today) {
        if (installment.paidAt != null) {
            return "Paga";
        }
        return installment.dueDate.isBefore(today) ? "Vencida" : "A vencer";
    }

    private String buildFileName(String prefix, LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null) {
            return prefix + "_" + startDate + "_a_" + endDate + ".csv";
        }
        return prefix + "_" + LocalDate.now() + ".csv";
    }
}
