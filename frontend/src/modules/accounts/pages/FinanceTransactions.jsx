import { useEffect, useState } from "react";
import DashboardCards from "../components/transactions/DashboardCards";
import TransactionFilters from "../components/transactions/TransactionFilters";
import TransactionTable from "../components/transactions/TransactionTable";
import LedgerView from "../components/transactions/LedgerView";
import BillSection from "../components/transactions/BillSection";
import { accountsService } from "../services/accountsService";
import "../styles/finance.css";

// Maps a real backend AccountsTransactionItem (see app/accounts/schemas)
// onto the shape the existing table/ledger components already expect.
function toRowShape(t) {
  return {
    id: t.id,
    date: new Date(t.date).toLocaleDateString("en-IN"),
    voucher: `TXN-${t.id.slice(0, 8).toUpperCase()}`,
    type: "Expense",
    budgetHead: t.budget_head,
    debit: t.budget_head,
    credit: "Bank Account",
    amount: t.amount,
    status: t.status,
    remarks: t.description,
  };
}

function FinanceTransactions() {
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [txns, dashboardKpis] = await Promise.all([
          accountsService.getTransactions(),
          accountsService.getDashboardKPIs(),
        ]);
        if (!isMounted) return;
        setTransactions((txns || []).map(toRowShape));
        setKpis(dashboardKpis);
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.error || "Unable to load transactions.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTransactions = transactions.filter(
    (item) =>
      item.voucher.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase()) ||
      item.budgetHead.toLowerCase().includes(search.toLowerCase())
  );

  const totalBudget = kpis?.total_allocated_funds ?? 0;
  const totalGrants = 0; // No "grant release" ledger entries exist in the current data model
  const totalExpenses = kpis?.total_spent_funds ?? 0;
  const remainingBalance = kpis?.remaining_funds ?? 0;

  return (
    <div className="fin-page">
      {/* Header */}
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1>Finance Transactions</h1>
            <p className="subtitle">
              View all financial transactions and ledger entries.
            </p>
          </div>
          <span className="fin-badge-role">Read Only Access</span>
        </div>
      </div>

      {error && <div className="fin-empty">{error}</div>}
      {loading && !error && <div className="fin-empty">Loading transactions…</div>}

      {!loading && !error && (
        <>
          {/* Dashboard KPI Cards */}
          <DashboardCards
            totalBudget={totalBudget}
            totalGrants={totalGrants}
            totalExpenses={totalExpenses}
            remainingBalance={remainingBalance}
          />

          {/* Filters */}
          <TransactionFilters
            search={search}
            setSearch={setSearch}
            transactions={filteredTransactions}
            setTransactions={setTransactions}
            viewOnly={true}
          />

          {/* Table */}
          <TransactionTable transactions={filteredTransactions} viewOnly={true} />

          {/* Ledger */}
          <LedgerView transactions={filteredTransactions} />

          {/* Bills (not yet wired to live data — see Reports page for real bill documents) */}
          <BillSection viewOnly={true} />
        </>
      )}
    </div>
  );
}

export default FinanceTransactions;