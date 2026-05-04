import "dotenv/config";
import express from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";

import { productsRouter } from "./routes/products";
import { inventoryRouter } from "./routes/inventory";
import { salesRouter } from "./routes/sales";
import { suppliersRouter } from "./routes/suppliers";
import { purchaseOrdersRouter } from "./routes/purchaseOrders";
import { supplierInvoicesRouter } from "./routes/supplierInvoices";
import { auditsRouter } from "./routes/audits";
import { invoicesRouter } from "./routes/invoices";
import { alertsRouter } from "./routes/alerts";
import { dashboardRouter } from "./routes/dashboard";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ transport: { target: "pino-pretty" } }));

app.use("/api/products", productsRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/sales", salesRouter);
app.use("/api/suppliers", suppliersRouter);
app.use("/api/purchase-orders", purchaseOrdersRouter);
app.use("/api/supplier-invoices", supplierInvoicesRouter);
app.use("/api/audits", auditsRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/dashboard", dashboardRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: err.message ?? "Internal server error" });
  },
);

app.listen(PORT, () => {
  console.log(`🚀 CornerIQ API running on http://localhost:${PORT}`);
});
