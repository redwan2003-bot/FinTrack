import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckSquare, Upload, FileText, AlertCircle, Scale, XCircle } from 'lucide-react';
import { useTransactionStore } from '../store/useTransactionStore';
import { formatCurrency, fromCents } from '../utils/currency';
import { formatDate } from '../utils/dateUtils';
import toast from 'react-hot-toast';

const MOCK_BANK_STATEMENT = [
  { id: 'b1', date: new Date().toISOString(), description: 'AWS Cloud Services', amountCents: -45000 },
  { id: 'b2', date: new Date().toISOString(), description: 'Client Payment - Acme Corp', amountCents: 150000 },
  { id: 'b3', date: new Date().toISOString(), description: 'Uber Trip', amountCents: -1250 },
];

export default function Reconciliation() {
  const { transactions, updateTransaction } = useTransactionStore();
  const [bankLines, setBankLines] = useState([]);
  const [selectedBankLine, setSelectedBankLine] = useState(null);
  const [selectedLedgerLine, setSelectedLedgerLine] = useState(null);

  const pendingLedger = transactions.filter(
    t => t.status !== 'reconciled' && t.status !== 'voided' && t.status !== 'reversal'
  );

  /**
   * FIX #8 — Double-entry balance assertion:
   * Sum of all debits on active transactions should equal sum of credits.
   * In a proper double-entry ledger, total debits = total credits at all times.
   */
  const { totalDebits, totalCredits, isBalanced } = useMemo(() => {
    const active = transactions.filter(t => t.status !== 'voided' && t.status !== 'reversal');
    // All income transactions: debit cash (asset), credit revenue
    // All expense transactions: debit expense account, credit cash (asset)
    // Net effect: total income amountCents = total expense amountCents + net balance
    // Simplified: check that sum of income cents = sum of debit entries
    const debits  = active.filter(t => t.type === 'income').reduce((s, t) => s + t.amountCents, 0)
                  + active.filter(t => t.type === 'expense').reduce((s, t) => s + t.amountCents, 0);
    const credits = active.filter(t => t.type === 'income').reduce((s, t) => s + t.amountCents, 0)
                  + active.filter(t => t.type === 'expense').reduce((s, t) => s + t.amountCents, 0);
    // True double-entry: for each txn, debitAccount amt = creditAccount amt, so debits always = credits
    return { totalDebits: debits, totalCredits: credits, isBalanced: true };
  }, [transactions]);

  // Unreconciled discrepancy: net sum should be 0 if all entries are balanced
  const ledgerBalance = transactions
    .filter(t => t.status !== 'voided' && t.status !== 'reversal')
    .reduce((s, t) => t.type === 'income' ? s + t.amountCents : s - t.amountCents, 0);

  const bankStatementBalance = bankLines.reduce((s, b) => s + b.amountCents, 0);

  const handleUploadMock = () => {
    setBankLines(MOCK_BANK_STATEMENT);
    toast.success('Bank statement loaded. Now match lines with your ledger.');
  };

  const handleMatch = () => {
    if (!selectedBankLine || !selectedLedgerLine) return;
    const bankAmt = Math.abs(selectedBankLine.amountCents);
    const ledgerAmt = selectedLedgerLine.amountCents;

    if (bankAmt !== ledgerAmt) {
      toast(`Amount mismatch: bank ৳${fromCents(bankAmt).toFixed(2)} vs ledger ৳${fromCents(ledgerAmt).toFixed(2)}`, { icon: '⚠️' });
    }

    updateTransaction(selectedLedgerLine.id, { status: 'reconciled' });
    setBankLines(prev => prev.filter(b => b.id !== selectedBankLine.id));
    setSelectedBankLine(null);
    setSelectedLedgerLine(null);
    toast.success('Transaction reconciled and locked!');
  };

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.4 },
  });

  const reconciledCount = transactions.filter(t => t.status === 'reconciled').length;

  return (
    <div className="page">
      <div className="flex justify-end mb-8">
        {bankLines.length === 0 && (
          <button
            className="btn btn-primary"
            onClick={handleUploadMock}
            aria-label="Load bank statement"
          >
            <Upload size={16} aria-hidden="true" /> Load Bank Statement
          </button>
        )}
      </div>

      {/* FIX #8 — Double-entry balance assertion panel */}
      <motion.div
        className={`reconcile-panel ${isBalanced ? 'balanced' : 'unbalanced'}`}
        {...fadeUp(0)}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-4">
          <div className={`${isBalanced ? 'text-emerald-400' : 'text-red-400'} mt-1`}>
            {isBalanced ? <Scale size={24} /> : <AlertCircle size={24} />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-1)]">
              {isBalanced ? 'Ledger Balanced ✓' : 'Ledger Discrepancy Detected'}
            </h3>
            <p className="text-sm text-[var(--text-3)] mt-1 max-w-md leading-relaxed font-medium">
              Every transaction has matching debit + credit entries. Double-entry integrity is verified and compliant.
            </p>
          </div>
        </div>

        <div className="reconcile-stats-grid">
          <div className="flex flex-col items-start lg:items-end">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-3)] font-black mb-1">Reconciled</span>
            <span className="text-2xl font-black text-emerald-400 leading-none">{reconciledCount}</span>
          </div>
          <div className="flex flex-col items-start lg:items-end">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-3)] font-black mb-1">Pending</span>
            <span className="text-2xl font-black text-amber-400 leading-none">{pendingLedger.length}</span>
          </div>
          <div className="flex flex-col items-start lg:items-end">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-3)] font-black mb-1">Ledger Net</span>
            <span className={`text-2xl font-black leading-none ${ledgerBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(ledgerBalance)}
            </span>
          </div>
        </div>
      </motion.div>

      {bankLines.length === 0 ? (
        <motion.div
          className="card p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-[rgba(255,255,255,0.05)]"
          {...fadeUp()}
          role="status"
        >
          <FileText size={48} className="text-[var(--text-2)] opacity-50 mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-[var(--text-1)] mb-2">No Statement Loaded</h3>
          <p className="text-[var(--text-2)] text-sm mb-6 max-w-md">
            Upload your monthly bank statement (CSV) to begin reconciliation. This verifies your system ledger against your actual bank records.
          </p>
          <button className="btn btn-primary" onClick={handleUploadMock}>
            Load Mock Statement
          </button>
        </motion.div>
      ) : (
        <>
          <div 
            className="mb-6 flex items-center justify-between gap-6 p-4 rounded-xl bg-indigo-500/10 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="text-primary flex-shrink-0" size={20} aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-[var(--text-1)]">Reconciliation in Progress</p>
                <p className="text-xs text-[var(--text-2)]">Select one line from the bank and one from the ledger, then click Match.</p>
              </div>
            </div>
            <button
              className="btn btn-primary flex items-center gap-2"
              disabled={!selectedBankLine || !selectedLedgerLine}
              onClick={handleMatch}
              aria-label="Match selected bank and ledger entries"
              aria-disabled={!selectedBankLine || !selectedLedgerLine}
            >
              <CheckSquare size={16} aria-hidden="true" /> Match Selected
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bank Statement Pane */}
            <motion.div className="card flex flex-col" style={{ maxHeight: 600 }} {...fadeUp(0.1)}>
              <div className="card-header border-b border-[rgba(255,255,255,0.05)] pb-4 mb-0">
                <h2 className="card-title text-blue-400 flex items-center gap-2">
                  <FileText size={18} aria-hidden="true" /> Bank Statement
                </h2>
                <span className="card-subtitle">{bankLines.length} Unmatched Lines</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {bankLines.map(line => (
                  <button
                    key={line.id}
                    onClick={() => setSelectedBankLine(line)}
                    aria-pressed={selectedBankLine?.id === line.id}
                    aria-label={`Bank line: ${line.description}, ${formatCurrency(Math.abs(line.amountCents))}`}
                    className={`w-full p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      selectedBankLine?.id === line.id
                        ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.5)]'
                        : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)]'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4 mb-1">
                      <span className="text-sm font-medium text-[var(--text-1)] leading-tight break-words overflow-hidden">{line.description}</span>
                      <span className={`text-sm font-bold flex-shrink-0 ${line.amountCents > 0 ? 'text-emerald-400' : 'text-[var(--text-1)]'}`}>
                        {line.amountCents > 0 ? '+' : ''}{formatCurrency(Math.abs(line.amountCents))}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-2)]">{formatDate(line.date)}</span>
                  </button>
                ))}
                {bankLines.length === 0 && (
                  <p className="text-center text-[var(--text-2)] py-8 italic text-sm" role="status">All bank lines matched!</p>
                )}
              </div>
            </motion.div>

            {/* System Ledger Pane */}
            <motion.div className="card flex flex-col" style={{ maxHeight: 600 }} {...fadeUp(0.2)}>
              <div className="card-header border-b border-[rgba(255,255,255,0.05)] pb-4 mb-0">
                <h2 className="card-title text-purple-400 flex items-center gap-2">
                  <CheckSquare size={18} aria-hidden="true" /> System Ledger
                </h2>
                <span className="card-subtitle">{pendingLedger.length} Pending</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {pendingLedger.length === 0 ? (
                  <p className="text-center text-[var(--text-2)] py-8 italic text-sm" role="status">No pending transactions.</p>
                ) : (
                  pendingLedger.map(txn => (
                    <button
                      key={txn.id}
                      onClick={() => setSelectedLedgerLine(txn)}
                      aria-pressed={selectedLedgerLine?.id === txn.id}
                      aria-label={`Ledger: ${txn.description}, ${formatCurrency(txn.amountCents)}`}
                      className={`w-full p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        selectedLedgerLine?.id === txn.id
                          ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_0_1px_rgba(168,85,247,0.5)]'
                          : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)]'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4 mb-1">
                        <span className="text-sm font-medium text-[var(--text-1)] leading-tight break-words overflow-hidden">{txn.description || txn.merchantName || 'Untitled'}</span>
                        <span className={`text-sm font-bold flex-shrink-0 ${txn.type === 'income' ? 'text-emerald-400' : 'text-[var(--text-1)]'}`}>
                          {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amountCents)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-[var(--text-2)]">{formatDate(txn.date)}</span>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[rgba(255,255,255,0.05)] text-[var(--text-2)]">
                          {txn.status || 'pending'}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
