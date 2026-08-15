import 'package:uuid/uuid.dart';

const uuid = Uuid();

enum TransactionType {
  expense,
  income,
  payment,
}

class Transaction {
  final String id;
  final String title;
  final double amount;
  final DateTime date;
  final TransactionType type;
  final bool isCredit;
  final String category;
  
  Transaction({
    String? id,
    required this.title,
    required this.amount,
    required this.date,
    this.type = TransactionType.expense,
    this.isCredit = false,
    this.category = 'Otros',
  }) : id = id ?? uuid.v4();

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'amount': amount,
      'date': date.toIso8601String(),
      'type': type.toString(),
      'isCredit': isCredit,
      'category': category,
    };
  }

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'],
      title: json['title'],
      amount: json['amount'],
      date: DateTime.parse(json['date']),
      type: json['type'] != null 
          ? TransactionType.values.firstWhere((e) => e.toString() == json['type'])
          : TransactionType.expense,
      isCredit: json['isCredit'] ?? false,
      category: json['category'] ?? 'Otros',
    );
  }
}
