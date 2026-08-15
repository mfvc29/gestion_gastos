import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TransactionsService } from '../../services/transactions.service';
import { TransactionType } from '../../models/transaction.model';

@Component({
  selector: 'app-metrics',
  imports: [CommonModule, RouterModule],
  templateUrl: './metrics.html',
  styleUrl: './metrics.css',
})
export class Metrics {
  public txService = inject(TransactionsService);

  public categoryMetrics = computed(() => {
    const txs = this.txService.transactions();
    const now = new Date();
    
    const monthlyExpenses = txs.filter(tx => {
      const d = new Date(tx.date);
      return tx.type === TransactionType.expense &&
             d.getFullYear() === now.getFullYear() &&
             d.getMonth() === now.getMonth();
    });

    const categories: Record<string, number> = {};
    for (const tx of monthlyExpenses) {
      if (categories[tx.category]) {
        categories[tx.category] += tx.amount;
      } else {
        categories[tx.category] = tx.amount;
      }
    }

    const total = Object.values(categories).reduce((sum, val) => sum + val, 0);

    return Object.keys(categories).map(key => ({
      name: key,
      amount: categories[key],
      percentage: total > 0 ? (categories[key] / total) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);
  });

  public get monthlyTotal(): number {
    return this.txService.currentMonthExpenses();
  }
}
