package com.app.project;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;
import androidx.room.TypeConverters;
import androidx.room.migration.Migration;
import androidx.sqlite.db.SupportSQLiteDatabase;

import com.app.project.client.Client;
import com.app.project.client.ClientDao;
import com.app.project.products.Product;
import com.app.project.products.ProductDao;
import com.app.project.sale.Installment;
import com.app.project.sale.Sale;
import com.app.project.sale.SaleDao;
import com.app.project.sale.SaleItem;
import com.app.project.shared.Converters;
import com.app.project.shared.PhoneNumbers;

@Database(
        entities = {Client.class, Product.class, Sale.class, SaleItem.class, Installment.class},
        version = 3,
        exportSchema = false
)
@TypeConverters(Converters.class)
public abstract class AppDatabase extends RoomDatabase {

    private static final String DATABASE_NAME = "app_database";
    private static volatile AppDatabase instance;

    public abstract ClientDao clientDao();

    public abstract ProductDao productDao();

    public abstract SaleDao saleDao();

    // 2 → 3: o esquema não muda. Só padroniza os telefones já gravados para conter apenas dígitos
    // (mesma regra do PhoneNumbers usada nos cadastros novos), preservando todos os dados.
    static final Migration MIGRATION_2_3 = new Migration(2, 3) {
        @Override
        public void migrate(SupportSQLiteDatabase db) {
            try (Cursor cursor = db.query("SELECT clientId, phone FROM clients WHERE phone IS NOT NULL")) {
                while (cursor.moveToNext()) {
                    long clientId = cursor.getLong(0);
                    String original = cursor.getString(1);
                    String normalized = PhoneNumbers.normalizeLenient(original);

                    if (normalized == null ? original == null : normalized.equals(original)) {
                        continue;
                    }

                    ContentValues values = new ContentValues();
                    values.put("phone", normalized);
                    db.update("clients", SQLiteDatabase.CONFLICT_NONE, values,
                            "clientId = ?", new Object[]{clientId});
                }
            }
        }
    };

    public static AppDatabase getInstance(Context context) {
        if (instance == null) {
            synchronized (AppDatabase.class) {
                if (instance == null) {
                    instance = Room.databaseBuilder(
                            context.getApplicationContext(),
                            AppDatabase.class,
                            DATABASE_NAME
                    )
                    .addMigrations(MIGRATION_2_3)
                    // Só é usado se faltar uma migração (ex.: banco na versão 1). Toda mudança de
                    // versão a partir de agora deve ganhar sua Migration, senão os dados são apagados.
                    .fallbackToDestructiveMigration()
                    .build();
                }
            }
        }
        return instance;
    }
}
