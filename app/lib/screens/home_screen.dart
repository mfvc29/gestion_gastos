import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/transaction.dart';
import '../providers/transactions_provider.dart';
import '../widgets/transaction_item.dart';
import './add_transaction_screen.dart';
import './profile_screen.dart';
import './metrics_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Gastos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.bar_chart),
            onPressed: () {
              Navigator.of(context).pushNamed(MetricsScreen.routeName);
            },
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.of(context).pushNamed(ProfileScreen.routeName);
            },
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              Navigator.of(context).pushNamed(AddTransactionScreen.routeName);
            },
          ),
        ],
      ),
      body: FutureBuilder(
        future: Provider.of<TransactionsProvider>(context, listen: false).loadData(),
        builder: (ctx, snapshot) => snapshot.connectionState ==
                ConnectionState.waiting
            ? const Center(child: CircularProgressIndicator())
            : Consumer<TransactionsProvider>(
                child: const Center(
                  child: Text('No hay movimientos aún'),
                ),
                builder: (ctx, txData, ch) => Column(
                  children: [
                    // Dashboard 
                    Card(
                      elevation: 4,
                      margin: const EdgeInsets.all(12),
                      color: Colors.indigo.shade50,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            const Text('Saldo Proyectado (Real)', style: TextStyle(color: Colors.indigo, fontWeight: FontWeight.bold)),
                            Text(
                              'S/ ${txData.projectedBalance.toStringAsFixed(2)}',
                              style: TextStyle(
                                fontSize: 36,
                                fontWeight: FontWeight.bold,
                                color: txData.projectedBalance >= 0 ? Colors.green.shade800 : Colors.red.shade800,
                              ),
                            ),
                            if (txData.projectedBalance < 0)
                              const Text('¡Estás gastando dinero que no tienes!', style: TextStyle(color: Colors.red, fontSize: 12)),
                            
                            const Divider(height: 20),
                            
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('En Billetera/Banco', style: TextStyle(fontSize: 12, color: Colors.indigo)),
                                    Text('S/ ${txData.cashBalance.toStringAsFixed(2)}', 
                                      style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 16)),
                                  ],
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    const Text('Deuda Tarjeta', style: TextStyle(fontSize: 12, color: Colors.indigo)),
                                    Text('S/ ${txData.totalDebt.toStringAsFixed(2)}', 
                                      style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 16)),
                                  ],
                                ),
                              ],
                            )
                          ],
                        ),
                      ),
                    ),
                    
                    // Alerta de Presupuesto Mensual
                    if (txData.budgetAlert.isNotEmpty)
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: txData.alertColor.withOpacity(0.1),
                          border: Border.all(color: txData.alertColor),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.warning_amber_rounded, color: txData.alertColor),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                txData.budgetAlert,
                                style: TextStyle(
                                  color: txData.alertColor,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Alerta de Pago de Deuda
                    if (txData.totalDebt > 0 && DateTime.now().day >= 20 && DateTime.now().day <= 25)
                       Container(
                        width: double.infinity,
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.blue.withOpacity(0.1),
                          border: Border.all(color: Colors.blue),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          children: [
                             Icon(Icons.payment, color: Colors.blue),
                             SizedBox(width: 10),
                             Expanded(child: Text('Recuerda pagar tu Tarjeta de Crédito el día 25', style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold))),
                          ],
                        ),
                       ),

                    // Lista de Transacciones
                    Expanded(
                      child: txData.transactions.isEmpty
                          ? ch!
                          : ListView.builder(
                              itemCount: txData.transactions.length,
                              itemBuilder: (ctx, i) {
                                final tx = txData.transactions[i];
                                return TransactionItem(
                                  key: ValueKey(tx.id),
                                  transaction: tx,
                                );
                              },
                            ),
                    ),
                  ],
                ),
              ),
      ),
      floatingActionButton: FloatingActionButton(
        child: const Icon(Icons.add),
        onPressed: () {
          Navigator.of(context).pushNamed(AddTransactionScreen.routeName);
        },
      ),
    );
  }
}
