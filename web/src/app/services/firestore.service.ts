import { Injectable, inject } from '@angular/core';
import { collection, doc, setDoc, deleteDoc, getDocs, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase.config';
import { AuthService } from './auth.service';
import { Account } from '../models/account.model';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private auth = inject(AuthService);

  private get userId(): string {
    return this.auth.user()?.uid || '';
  }

  // --- ACCOUNTS ---

  subscribeToAccounts(callback: (accounts: Account[]) => void) {
    if (!this.userId) return () => {};
    const q = query(collection(db, `users/${this.userId}/accounts`));
    return onSnapshot(q, (snapshot) => {
      const accounts: Account[] = [];
      snapshot.forEach(doc => {
        accounts.push({ id: doc.id, ...doc.data() } as Account);
      });
      callback(accounts);
    });
  }

  async saveAccount(account: Account) {
    if (!this.userId) return;
    const docRef = doc(db, `users/${this.userId}/accounts`, account.id);
    await setDoc(docRef, account);
  }

  async deleteAccount(accountId: string) {
    if (!this.userId) return;
    const docRef = doc(db, `users/${this.userId}/accounts`, accountId);
    await deleteDoc(docRef);
  }

  // --- TRANSACTIONS ---

  subscribeToTransactions(callback: (txs: Transaction[]) => void) {
    if (!this.userId) return () => {};
    const q = query(collection(db, `users/${this.userId}/transactions`));
    return onSnapshot(q, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        txs.push({
          id: docSnap.id,
          ...data,
          date: data['date'] instanceof Timestamp ? data['date'].toDate() : new Date(data['date'])
        } as Transaction);
      });
      // Sort desc by date
      txs.sort((a, b) => b.date.getTime() - a.date.getTime());
      callback(txs);
    });
  }

  async saveTransaction(tx: Transaction) {
    if (!this.userId) return;
    const docRef = doc(db, `users/${this.userId}/transactions`, tx.id);
    await setDoc(docRef, {
      ...tx,
      date: Timestamp.fromDate(tx.date)
    });
  }

  async deleteTransaction(txId: string) {
    if (!this.userId) return;
    const docRef = doc(db, `users/${this.userId}/transactions`, txId);
    await deleteDoc(docRef);
  }
}
