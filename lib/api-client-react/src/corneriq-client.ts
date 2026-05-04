import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { axiosInstance } from "./mutator/custom-instance";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Platform = "uber_eats" | "deliveroo" | "just_eat" | "in_store";
export type OrderStatus =
  | "pending" | "confirmed" | "preparing" | "ready"
  | "delivered" | "cancelled" | "refunded";
export type POStatus =
  | "draft" | "approved" | "sent" | "confirmed"
  | "partially_received" | "received" | "cancelled";
export type SupplierInvoiceStatus =
  | "pending_review" | "approved" | "synced_to_pos" | "rejected";
export type AuditType = "spot_check" | "weekly" | "monthly" | "full";
export type AuditStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type InvoiceStatus =
  | "draft" | "sent" | "viewed" | "partially_paid"
  | "paid" | "overdue" | "disputed" | "void";
export type AlertPriority = "low" | "medium" | "high" | "critical";
export type AlertCategory =
  | "inventory" | "finance" | "audit" | "purchasing" | "system";

export interface Product {
  id: number;
  sku: string;
  barcode?: string | null;
  name: string;
  category: string;
  subcategory?: string | null;
  brand?: string | null;
  unitOfMeasure?: string | null;
  vatRate: string;
  costPrice: string;
  sellPrice: string;
  reorderPoint: number;
  reorderQuantity: number;
  preferredSupplierId?: number | null;
  expiryTracking: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  vatNumber?: string | null;
  paymentTermsDays?: number | null;
  leadTimeDays?: number | null;
  notes?: string | null;
  createdAt: string;
}

export interface Inventory {
  id: number;
  productId: number;
  quantityOnHand: string;
  quantityOnOrder: string;
  lastCountedAt?: string | null;
  lastReceivedAt?: string | null;
  updatedAt: string;
}

export type StockStatus = "ok" | "medium" | "low" | "out_of_stock";

export interface InventoryWithProduct extends Inventory {
  product: Product;
  stockStatus: StockStatus;
}

export interface ProductWithInventory extends Product {
  inventory: Inventory | null;
}

export interface SalesOrderItem {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface SalesOrder {
  id: number;
  platformOrderId?: string | null;
  platform: Platform;
  status: OrderStatus;
  orderedAt: string;
  grossRevenue: string;
  commission: string;
  netRevenue: string;
  refundAmount: string;
  items: SalesOrderItem[];
  createdAt: string;
}

export interface SalesSummary {
  platform: Platform;
  grossRevenue: number;
  netRevenue: number;
  commission: number;
  orderCount: number;
}

export interface TopProduct {
  productId: number;
  totalQuantity: number;
  totalRevenue: number;
}

export interface POItem {
  productId: number;
  sku: string;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierId: number;
  status: POStatus;
  totalValue?: string | null;
  expectedDeliveryDate?: string | null;
  receivedDate?: string | null;
  notes?: string | null;
  aiGenerated?: boolean | null;
  items: POItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplierInvoiceItem {
  sku: string;
  productName: string;
  invoicedQuantity: number;
  invoicedUnitPrice: number;
  vatRate: number;
  lineTotal: number;
  confidenceScore: number;
}

export interface SupplierInvoice {
  id: number;
  invoiceNumber?: string | null;
  supplierId?: number | null;
  invoiceDate?: string | null;
  paymentTermsDays?: number | null;
  subtotal?: string | null;
  vatTotal?: string | null;
  grandTotal?: string | null;
  status: SupplierInvoiceStatus;
  overallConfidenceScore?: string | null;
  items: SupplierInvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditItem {
  id: number;
  auditId: number;
  productId: number;
  productName: string;
  sku: string;
  expectedQuantity: number;
  actualQuantity?: number | null;
  variance?: number | null;
  variancePercent?: string | null;
  status: string;
  discrepancyCategory?: string | null;
}

export interface Audit {
  id: number;
  auditType: AuditType;
  status: AuditStatus;
  scheduledFor?: string | null;
  completedAt?: string | null;
  totalProductsAudited?: number | null;
  totalVarianceValue?: string | null;
  shrinkageRate?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface AuditWithItems extends Audit {
  items: AuditItem[];
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  lineTotal: number;
}

export interface InvoicePayment {
  amount: number;
  method: string;
  reference: string;
  paidAt: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string | null;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  subtotal: string;
  vatTotal: string;
  grandTotal: string;
  amountPaid: string;
  amountDue: string;
  notes?: string | null;
  items: InvoiceLineItem[];
  payments: InvoicePayment[];
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: number;
  title: string;
  message: string;
  priority: AlertPriority;
  category: AlertCategory;
  isRead: boolean;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
  createdAt: string;
}

export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  revenueChange7d: number;
  lowStockCount: number;
  pendingPOCount: number;
  unreadAlertCount: number;
  platformBreakdown: SalesSummary[];
  revenueChart: Array<{
    date: string;
    uber_eats: number;
    deliveroo: number;
    just_eat: number;
    in_store: number;
    total: number;
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function get<T>(url: string, params?: Record<string, string | number | undefined>) {
  return axiosInstance
    .get<{ data: T }>(url, { params })
    .then((r) => r.data.data);
}

function post<T>(url: string, body?: unknown) {
  return axiosInstance.post<{ data: T }>(url, body).then((r) => r.data.data);
}

function patch<T>(url: string, body?: unknown) {
  return axiosInstance.patch<{ data: T }>(url, body).then((r) => r.data.data);
}

// ─── Products ────────────────────────────────────────────────────────────────

export const useGetProducts = (
  params?: { search?: string; category?: string; lowStock?: string },
  options?: Partial<UseQueryOptions<Product[]>>,
) =>
  useQuery<Product[]>({
    queryKey: ["products", params],
    queryFn: () => get<Product[]>("/api/products", params as any),
    ...options,
  });

export const useGetProduct = (id: number) =>
  useQuery<ProductWithInventory>({
    queryKey: ["products", id],
    queryFn: () => get<ProductWithInventory>(`/api/products/${id}`),
    enabled: !!id,
  });

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Product>) =>
      post<Product>("/api/products", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Product> & { id: number }) =>
      patch<Product>(`/api/products/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
};

// ─── Inventory ───────────────────────────────────────────────────────────────

export const useGetInventory = (params?: { stockStatus?: StockStatus }) =>
  useQuery<InventoryWithProduct[]>({
    queryKey: ["inventory", params],
    queryFn: () => get<InventoryWithProduct[]>("/api/inventory", params as any),
  });

export const useAdjustStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      adjustment,
      reason,
    }: {
      productId: number;
      adjustment: number;
      reason: string;
    }) => patch<Inventory>(`/api/inventory/${productId}`, { adjustment, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

// ─── Sales ───────────────────────────────────────────────────────────────────

export const useGetSales = (params?: { platform?: Platform; days?: number }) =>
  useQuery<SalesOrder[]>({
    queryKey: ["sales", params],
    queryFn: () => get<SalesOrder[]>("/api/sales", params as any),
  });

export const useGetSalesSummary = (params?: { days?: number }) =>
  useQuery<SalesSummary[]>({
    queryKey: ["sales-summary", params],
    queryFn: () => get<SalesSummary[]>("/api/sales/summary", params as any),
  });

export const useGetTopProducts = (params?: { days?: number; limit?: number }) =>
  useQuery<TopProduct[]>({
    queryKey: ["top-products", params],
    queryFn: () => get<TopProduct[]>("/api/sales/top-products", params as any),
  });

export const useCreateSale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<SalesOrder>) =>
      post<SalesOrder>("/api/sales", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

// ─── Suppliers ───────────────────────────────────────────────────────────────

export const useGetSuppliers = () =>
  useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: () => get<Supplier[]>("/api/suppliers"),
  });

export const useCreateSupplier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Supplier>) =>
      post<Supplier>("/api/suppliers", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
};

export const useUpdateSupplier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Supplier> & { id: number }) =>
      patch<Supplier>(`/api/suppliers/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
};

// ─── Purchase Orders ─────────────────────────────────────────────────────────

export const useGetPurchaseOrders = (params?: { status?: POStatus }) =>
  useQuery<PurchaseOrder[]>({
    queryKey: ["purchase-orders", params],
    queryFn: () => get<PurchaseOrder[]>("/api/purchase-orders", params as any),
  });

export const useCreatePurchaseOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      supplierId: number;
      expectedDeliveryDate?: string;
      notes?: string;
      items: POItem[];
    }) => post<PurchaseOrder>("/api/purchase-orders", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });
};

export const useUpdatePurchaseOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: POStatus }) =>
      patch<PurchaseOrder>(`/api/purchase-orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });
};

// ─── Supplier Invoices ───────────────────────────────────────────────────────

export const useGetSupplierInvoices = () =>
  useQuery<SupplierInvoice[]>({
    queryKey: ["supplier-invoices"],
    queryFn: () => get<SupplierInvoice[]>("/api/supplier-invoices"),
  });

export const useCreateSupplierInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<SupplierInvoice>) =>
      post<SupplierInvoice>("/api/supplier-invoices", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supplier-invoices"] }),
  });
};

export const useApproveSupplierInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      post<SupplierInvoice>(`/api/supplier-invoices/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-invoices"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
};

// ─── Audits ──────────────────────────────────────────────────────────────────

export const useGetAudits = () =>
  useQuery<Audit[]>({
    queryKey: ["audits"],
    queryFn: () => get<Audit[]>("/api/audits"),
  });

export const useGetAudit = (id: number) =>
  useQuery<AuditWithItems>({
    queryKey: ["audits", id],
    queryFn: () => get<AuditWithItems>(`/api/audits/${id}`),
    enabled: !!id,
  });

export const useCreateAudit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      auditType: AuditType;
      scheduledFor?: string;
      notes?: string;
    }) => post<AuditWithItems>("/api/audits", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audits"] }),
  });
};

export const useSubmitAuditCount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      auditId,
      itemId,
      actualQuantity,
      discrepancyCategory,
    }: {
      auditId: number;
      itemId: number;
      actualQuantity: number;
      discrepancyCategory?: string;
    }) =>
      patch<AuditItem>(`/api/audits/${auditId}/items/${itemId}`, {
        actualQuantity,
        discrepancyCategory,
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["audits", vars.auditId] });
    },
  });
};

export const useCompleteAudit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => post<Audit>(`/api/audits/${id}/complete`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audits"] }),
  });
};

// ─── Invoices ────────────────────────────────────────────────────────────────

export const useGetInvoices = () =>
  useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: () => get<Invoice[]>("/api/invoices"),
  });

export const useCreateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      customerName: string;
      customerEmail?: string;
      invoiceDate: string;
      dueDate: string;
      notes?: string;
      items: InvoiceLineItem[];
    }) => post<Invoice>("/api/invoices", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
};

export const useUpdateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Invoice> & { id: number }) =>
      patch<Invoice>(`/api/invoices/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
};

export const useRecordPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      amount,
      method,
      reference,
    }: {
      id: number;
      amount: number;
      method: string;
      reference?: string;
    }) => post<Invoice>(`/api/invoices/${id}/payment`, { amount, method, reference }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
};

// ─── Alerts ──────────────────────────────────────────────────────────────────

export const useGetAlerts = (params?: { unreadOnly?: boolean }) =>
  useQuery<Alert[]>({
    queryKey: ["alerts", params],
    queryFn: () =>
      get<Alert[]>("/api/alerts", {
        unreadOnly: params?.unreadOnly ? "true" : undefined,
      } as any),
  });

export const useMarkAlertRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => patch<Alert>(`/api/alerts/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
};

export const useMarkAllAlertsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      patch<{ updated: number }>("/api/alerts/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const useGetDashboard = () =>
  useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => get<DashboardStats>("/api/dashboard"),
    staleTime: 1000 * 30, // 30 seconds
  });
