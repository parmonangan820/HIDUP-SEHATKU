import React from 'react';
import { useHealth } from '../context/HealthContext';
import { X } from 'lucide-react';
import { PaymentHistory, PaymentTransactionItem } from './PaymentHistory';

export { PaymentHistory };
export type { PaymentTransactionItem };

interface PaymentHistoryModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialRefId?: string;
}

export const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({
  isOpen,
  onClose,
  initialRefId = '',
}) => {
  const {
    isPaymentHistoryOpen,
    setIsPaymentHistoryOpen,
  } = useHealth();

  const isVisible = isOpen !== undefined ? isOpen : isPaymentHistoryOpen;

  if (!isVisible) return null;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setIsPaymentHistoryOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl relative flex flex-col overflow-hidden text-white">
        {/* Background ambient glow */}
        <div className="absolute -top-20 -right-20 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
          title="Tutup dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Render PaymentHistory UI component */}
        <PaymentHistory
          onClose={handleClose}
          isModal={true}
          initialRefId={initialRefId}
        />
      </div>
    </div>
  );
};
