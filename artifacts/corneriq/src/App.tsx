import { Switch, Route } from "wouter";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import InventoryPage from "./pages/InventoryPage";
import SalesPage from "./pages/SalesPage";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import SupplierInvoicesPage from "./pages/SupplierInvoicesPage";
import AuditsPage from "./pages/AuditsPage";
import InvoicesPage from "./pages/InvoicesPage";
import AlertsPage from "./pages/AlertsPage";

export default function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/inventory" component={InventoryPage} />
        <Route path="/sales" component={SalesPage} />
        <Route path="/purchase-orders" component={PurchaseOrdersPage} />
        <Route path="/supplier-invoices" component={SupplierInvoicesPage} />
        <Route path="/audits" component={AuditsPage} />
        <Route path="/invoices" component={InvoicesPage} />
        <Route path="/alerts" component={AlertsPage} />
      </Switch>
    </Layout>
  );
}
