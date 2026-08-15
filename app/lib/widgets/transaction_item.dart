import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/transaction.dart';
import '../providers/transactions_provider.dart';

class TransactionItem extends StatelessWidget {
  final Transaction transaction;

  const TransactionItem({super.key, required this.transaction});

  @override
  Widget build(BuildContext context) {
    final isIncome = transaction.type == TransactionType.income;
    final isPayment = transaction.type == TransactionType.payment;

    IconData getIcon() {
      if (isPayment) return Icons.payment;
      if (isIncome) return Icons.attach_money;
      switch (transaction.category) {
        case 'Comida': return Icons.restaurant;
        case 'Transporte': return Icons.directions_bus;
        case 'Vivienda': return Icons.home;
        case 'Salud': return Icons.local_hospital;
        case 'Entretenimiento': return Icons.movie;
        default: return Icons.category;
      }
    }

    Color getColor() {
       if (isPayment) return Colors.blue;
       if (isIncome) return Colors.green;
       return Colors.red;
    }

    return Dismissible(
      key: ValueKey(transaction.id),
      background: Container(
        color: Theme.of(context).colorScheme.error,
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        margin: const EdgeInsets.symmetric(horizontal: 15, vertical: 4),
        child: const Icon(
          Icons.delete,
          color: Colors.white,
          size: 40,
        ),
      ),
      direction: DismissDirection.endToStart,
      confirmDismiss: (direction) {
        return showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('¿Estás seguro?'),
            content: const Text(
                '¿Quieres eliminar este movimiento de la lista?'),
            actions: <Widget>[
              TextButton(
                child: const Text('No'),
                onPressed: () {
                  Navigator.of(ctx).pop(false);
                },
              ),
              TextButton(
                child: const Text('Sí'),
                onPressed: () {
                  Navigator.of(ctx).pop(true);
                },
              ),
            ],
          ),
        );
      },
      onDismissed: (direction) {
        Provider.of<TransactionsProvider>(context, listen: false)
            .deleteTransaction(transaction.id);
      },
      child: Card(
        elevation: 2,
        margin: const EdgeInsets.symmetric(
          vertical: 6,
          horizontal: 5,
        ),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor: getColor().withOpacity(0.1),
            radius: 25,
            child: Icon(
               getIcon(),
               color: getColor(),
               size: 24,
            ),
          ),
          title: Text(
            transaction.title,
            style: Theme.of(context).textTheme.titleMedium!.copyWith(fontWeight: FontWeight.bold),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(DateFormat.yMMMd('es').format(transaction.date)),
              if (transaction.isCredit)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.deepPurple.shade100,
                    borderRadius: BorderRadius.circular(4)
                  ),
                  child: const Text('CRÉDITO', style: TextStyle(fontSize: 10, color: Colors.deepPurple, fontWeight: FontWeight.bold)),
                )
            ],
          ),
          trailing: Text(
             '${isIncome ? '+' : isPayment ? '' : '-'} S/ ${transaction.amount.toStringAsFixed(2)}',
             style: TextStyle(
               fontWeight: FontWeight.bold,
               color: getColor(),
               fontSize: 16
             ),
          ),
        ),
      ),
    );
  }
}
