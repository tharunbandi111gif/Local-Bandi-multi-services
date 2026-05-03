
import { Transaction } from '../types';

const WALLET_KEY = 'lokal_wallet_balance';
const TRANSACTIONS_KEY = 'lokal_transactions';
const REFERRAL_KEY = 'lokal_referral_pending';
const FIRST_ORDER_KEY = 'lokal_first_order_completed';
const REFERRED_BY_KEY = 'lokal_referred_by';

export const referralService = {
  getWalletBalance: (): number => {
    const saved = localStorage.getItem(WALLET_KEY);
    return saved ? parseInt(saved) : 0;
  },

  getTransactions: (): Transaction[] => {
    const saved = localStorage.getItem(TRANSACTIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  updateWallet: (amount: number, description: string, type: 'credit' | 'debit') => {
    const currentBalance = referralService.getWalletBalance();
    const newBalance = type === 'credit' ? currentBalance + amount : currentBalance - amount;
    
    const transactions = referralService.getTransactions();
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      type,
      amount,
      description,
      date: 'Just now'
    };

    localStorage.setItem(WALLET_KEY, newBalance.toString());
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([newTransaction, ...transactions]));
    
    // Dispatch custom event for real-time updates across components
    window.dispatchEvent(new Event('wallet_updated'));
  },

  // Called when app first opens for a new downloader
  initializeNewUser: () => {
    const isFirstRun = localStorage.getItem('lokal_app_initialized') === null;
    if (isFirstRun) {
      localStorage.setItem('lokal_app_initialized', 'true');
      localStorage.setItem(FIRST_ORDER_KEY, 'false');
      
      // Give ₹10 Welcome Bonus
      referralService.updateWallet(10, 'Welcome Bonus: New Downloader', 'credit');
    }
  },

  // Called when an order is completed successfully
  handleOrderCompletion: (orderId: string) => {
    const firstOrderCompleted = localStorage.getItem(FIRST_ORDER_KEY) === 'true';
    
    if (!firstOrderCompleted) {
      localStorage.setItem(FIRST_ORDER_KEY, 'true');
      
      // In a real app, we would notify the referrer's account here.
      // For this demo, we simulate the referrer (you) getting ₹15 
      // when a friend (mocked) completes their first order.
      
      // We also want to show the specific ₹15 credit logic you requested
      // strictly after the first order is done.
      
      // If the user was referred by someone (mocked here)
      const referredBy = localStorage.getItem(REFERRED_BY_KEY) || 'Friend';
      
      // Strictly implement: Referrer gets ₹15
      // Since this is a client-side demo, we represent the "Referrer Rewards" 
      // showing up in the wallet to demonstrate the rule logic.
      referralService.updateWallet(15, `Referral Reward: Friend completed order ${orderId}`, 'credit');
    }
  }
};
