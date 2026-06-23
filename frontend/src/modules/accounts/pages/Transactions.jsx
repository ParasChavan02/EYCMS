import { useState } from "react";
import DashboardCards from "../components/transactions/DashboardCards";
import TransactionForm from "../components/transactions/TransactionForm";
import TransactionFilters from "../components/transactions/TransactionFilters";
import TransactionTable from "../components/transactions/TransactionTable";
import LedgerView from "../components/transactions/LedgerView";
import BillSection from "../components/transactions/BillSection";
import "../styles/finance.css";

function Transactions({ viewOnly = false }) {
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      date: "2026-06-01",
      voucher: "VCH1780125233230",
      type: "Grant Release",
      budgetHead: "Fellowship Grant",
      debit: "Bank Account",
      credit: "Government Grant",
      amount: 50000,
      status: "Completed",
      remarks: "Grant credited",
    },
    {
      id: 2,
      date: "2026-06-03",
      voucher: "VCH1780125233309",
      type: "Expense",
      budgetHead: "Training Expense",
      debit: "Expense Account",
      credit: "Bank Account",
      amount: 12000,
      status: "Pending",
      remarks: "Training workshop",
    },
    {
      id: 3,
      date: "2026-06-05",
      voucher: "VCH1780125233305",
      type: "Bill Payment",
      budgetHead: "Operations",
      debit: "Vendor Account",
      credit: "Cash Account",
      amount: 8000,
      status: "Completed",
      remarks: "Vendor settlement",
    },
  ]);

  const addTransaction = (data) => {
    const newTransaction = {
      id: Date.now(),
      voucher: `VCH${Date.now()}`,
      date: data.date,
      type: data.type,
      budgetHead: data.budgetHead,
      debit: data.debit,
      credit: data.credit,
      amount: Number(data.amount),
      status: data.status,
      remarks: data.remarks,
    };
    setTransactions([newTransaction, ...transactions]);
  };

  const filteredTransactions = transactions.filter(
    (item) =>
      item.voucher.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase()) ||
      item.budgetHead.toLowerCase().includes(search.toLowerCase())
  );

  const totalBudget = 1000000;
  const totalGrants = transactions.filter((t) => t.type === "Grant Release").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "Expense").reduce((sum, t) => sum + t.amount, 0);
  const remainingBalance = totalBudget - totalGrants - totalExpenses;

  return (
    <div className="fin-page">
      {/* Header */}
      <div className="fin-header">
        <div className="fin-header-top">
          <div>
            <h1>{viewOnly ? "Finance Transactions" : "Transaction Dashboard"}</h1>
            <p className="subtitle">
              {viewOnly
                ? "View all financial transactions and ledger entries."
                : "Manage and record all financial transactions."}
            </p>
          </div>
          <span className="fin-badge-role">
            {viewOnly ? "Read Only Access" : "Full Access"}
          </span>
        </div>
      </div>

      {/* Dashboard KPI Cards */}
      <DashboardCards
        totalBudget={totalBudget}
        totalGrants={totalGrants}
        totalExpenses={totalExpenses}
        remainingBalance={remainingBalance}
      />

      {/* Add Transaction Form — hidden for viewOnly */}
      {!viewOnly && <TransactionForm addTransaction={addTransaction} />}

      {/* Filters */}
      <TransactionFilters
        search={search}
        setSearch={setSearch}
        transactions={filteredTransactions}
        setTransactions={setTransactions}
        viewOnly={viewOnly}
      />

      {/* Table */}
      <TransactionTable transactions={filteredTransactions} viewOnly={viewOnly} />

      {/* Ledger */}
      <LedgerView transactions={filteredTransactions} />

      {/* Bills */}
      <BillSection viewOnly={viewOnly} />
    </div>
  );
}

export default Transactions;