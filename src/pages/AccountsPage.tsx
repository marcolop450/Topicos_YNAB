import { useState } from 'react';
import { AccountsView } from '../components/AccountsView';
import { TransactionModal } from '../components/TransactionModal';
import { Transaction } from '../types';

export function AccountsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  return (
    <>
      <AccountsView
        onOpenNewTransaction={handleOpenNewTransaction}
        onEditTransaction={handleEditTransaction}
      />
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingTransaction={editingTransaction}
      />
    </>
  );
}
