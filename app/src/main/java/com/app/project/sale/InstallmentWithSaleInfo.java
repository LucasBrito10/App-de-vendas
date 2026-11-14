package com.app.project.sale;

import androidx.room.ColumnInfo;
import androidx.room.Embedded;

import java.time.LocalDate;

public class InstallmentWithSaleInfo {
    @Embedded
    public Installment installment;

    @ColumnInfo(name = "purchase_date")
    public LocalDate purchaseDate;

    @ColumnInfo(name = "client_name")
    public String clientName;

    @ColumnInfo(name = "client_phone")
    public String clientPhone;
}
