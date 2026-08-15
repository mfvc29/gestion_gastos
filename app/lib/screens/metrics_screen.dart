import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/transactions_provider.dart';
import '../widgets/transaction_item.dart';

class MetricsScreen extends StatelessWidget {
  static const routeName = '/metrics';

  const MetricsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Métricas del Mes'),
      ),
      body: FutureBuilder(
        future: Provider.of<TransactionsProvider>(context, listen: false).loadData(),
        builder: (ctx, snapshot) => snapshot.connectionState == ConnectionState.waiting
            ? const Center(child: CircularProgressIndicator())
            : Consumer<TransactionsProvider>(
                builder: (ctx, txData, _) {
                  final now = DateTime.now();
                  final monthlySpent = txData.getMonthlyExpenses(now);
                  final monthlyIncome = txData.getMonthlyIncome(now);
                  final monthName = DateFormat.MMMM('es').format(now);
                  final categoriesMap = txData.getMonthlyExpensesByCategory(now);
                  
                  // Ordenar categorías por monto
                  final sortedCategories = categoriesMap.entries.toList()
                    ..sort((a, b) => b.value.compareTo(a.value));

                  return SingleChildScrollView(
                    child: Column(
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Text(
                            'Resumen de ${monthName[0].toUpperCase()}${monthName.substring(1)}',
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                        ),
                        Card(
                          margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
                          elevation: 3,
                          child: Padding(
                            padding: const EdgeInsets.all(20.0),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  children: [
                                    const Text('Ingresos'),
                                    Text(
                                      'S/ ${monthlyIncome.toStringAsFixed(2)}',
                                      style: TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.green.shade700,
                                      ),
                                    ),
                                  ],
                                ),
                                Container(height: 40, width: 1, color: Colors.grey),
                                Column(
                                  children: [
                                    const Text('Gastos Totales'),
                                    Text(
                                      'S/ ${monthlySpent.toStringAsFixed(2)}',
                                      style: TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.red.shade700,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 20),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 20),
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              '¿En qué gastaste más?',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        
                        if (sortedCategories.isEmpty)
                          const Padding(
                            padding: EdgeInsets.all(20),
                            child: Text('No hay gastos registrados este mes.'),
                          )
                        else
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: sortedCategories.length,
                            itemBuilder: (ctx, i) {
                              final catName = sortedCategories[i].key;
                              final amount = sortedCategories[i].value;
                              final percentage = monthlySpent == 0 ? 0.0 : (amount / monthlySpent);
                              
                              return Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
                                child: Column(
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(catName, style: const TextStyle(fontWeight: FontWeight.bold)),
                                        Text('S/ ${amount.toStringAsFixed(2)} (${(percentage * 100).toStringAsFixed(1)}%)'),
                                      ],
                                    ),
                                    const SizedBox(height: 5),
                                    LinearProgressIndicator(
                                      value: percentage,
                                      backgroundColor: Colors.grey.shade200,
                                      color: Colors.indigoAccent,
                                      minHeight: 8,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),

                        const SizedBox(height: 20),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 20),
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              'Detalle de Movimientos',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        
                         ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: txData.currentMonthTransactions.length,
                            itemBuilder: (ctx, i) => TransactionItem(
                              key: ValueKey(txData.currentMonthTransactions[i].id),
                              transaction: txData.currentMonthTransactions[i],
                            ),
                          ),
                        const SizedBox(height: 30),
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }
}
