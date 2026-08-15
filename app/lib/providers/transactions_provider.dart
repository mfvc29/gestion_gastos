import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/transaction.dart';

class TransactionsProvider with ChangeNotifier {
  List<Transaction> _transactions = [];
  double _initialBalance = 0.0;

  List<Transaction> get transactions => [..._transactions];
  double get initialBalance => _initialBalance;

  // --- Lógica Financiera ---

  // Deuda actual de tarjeta (Gastos Crédito - Pagos Realizados)
  double get totalDebt {
    final creditExpenses = _transactions
        .where((tx) => tx.type == TransactionType.expense && tx.isCredit)
        .fold(0.0, (sum, item) => sum + item.amount);
    
    final payments = _transactions
        .where((tx) => tx.type == TransactionType.payment)
        .fold(0.0, (sum, item) => sum + item.amount);
    
    // La deuda no puede ser menor a 0 teóricamente en este modelo simple,
    // a menos que pagues de más (saldo a favor).
    return creditExpenses - payments;
  }

  // Dinero real en mano/banco (Saldo Inicial + Ingresos - Gastos Efectivo - Pagos Deuda)
  double get cashBalance {
    final income = _transactions
        .where((tx) => tx.type == TransactionType.income)
        .fold(0.0, (sum, item) => sum + item.amount);

    final cashExpenses = _transactions
        .where((tx) => tx.type == TransactionType.expense && !tx.isCredit)
        .fold(0.0, (sum, item) => sum + item.amount);

    final payments = _transactions
        .where((tx) => tx.type == TransactionType.payment)
        .fold(0.0, (sum, item) => sum + item.amount);

    return _initialBalance + income - cashExpenses - payments;
  }

  // Saldo Proyectado (Dinero real - Deuda pendiente)
  // Esto es lo que realmente tienes libre si pagaras toda tu deuda hoy.
  double get projectedBalance {
    return cashBalance - totalDebt;
  }

  // Métricas de Gastos (Total absoluto gastado, sea crédito o debito)
  double get totalSpentAbsolute {
    return _transactions
        .where((tx) => tx.type == TransactionType.expense)
        .fold(0.0, (sum, item) => sum + item.amount);
  }

  // Métricas Mensuales
  List<Transaction> get currentMonthTransactions {
    final now = DateTime.now();
    return _transactions.where((tx) {
      return tx.date.year == now.year && tx.date.month == now.month;
    }).toList();
  }

  double getMonthlyExpenses(DateTime date) {
    return _transactions
        .where((tx) => 
            tx.type == TransactionType.expense && 
            tx.date.year == date.year && 
            tx.date.month == date.month)
        .fold(0.0, (sum, item) => sum + item.amount);
  }

  double getMonthlyIncome(DateTime date) {
    return _transactions
        .where((tx) => 
            tx.type == TransactionType.income && 
            tx.date.year == date.year && 
            tx.date.month == date.month)
        .fold(0.0, (sum, item) => sum + item.amount);
  }

   Map<String, double> getMonthlyExpensesByCategory(DateTime date) {
    final monthlyTx = _transactions.where((tx) => 
            tx.type == TransactionType.expense && 
            tx.date.year == date.year && 
            tx.date.month == date.month);
    
    final Map<String, double> categories = {};
    for (var tx in monthlyTx) {
      if (categories.containsKey(tx.category)) {
        categories[tx.category] = categories[tx.category]! + tx.amount;
      } else {
        categories[tx.category] = tx.amount;
      }
    }
    return categories;
  }

  // Alertas
  String get budgetAlert {
    // Usamos el gasto total absoluto para medir el control de gasto,
    // independientemente de si es crédito o débito.
    final spent = getMonthlyExpenses(DateTime.now());
    
    if (spent >= 2000) return '¡Alerta Crítica! Has superado los S/ 2000 este mes';
    if (spent >= 1900) return 'Cuidado: Al 95% de los S/ 2000';
    if (spent >= 1500) return 'Atención: Has superado los S/ 1500';
    if (spent >= 1350) return 'Aviso: Al 90% de los S/ 1500';
    if (spent >= 1000) return 'Aviso: Has superado el límite de S/ 1000';
    if (spent >= 900)  return 'Preventivo: Al 90% de tu primer límite (S/ 1000)';
    
    return '';
  }

  Color get alertColor {
    final spent = getMonthlyExpenses(DateTime.now());
    if (spent >= 2000) return Colors.red.shade900;
    if (spent >= 1900) return Colors.red;
    if (spent >= 1500) return Colors.orange.shade900;
    if (spent >= 1350) return Colors.orange;
    if (spent >= 1000) return Colors.deepPurple;
    if (spent >= 900)  return Colors.amber.shade700;
    return Colors.green;
  }

  // CRUD
  Future<void> loadData() async {
    final prefs = await SharedPreferences.getInstance();
    _initialBalance = prefs.getDouble('initialBalance') ?? 0.0;
    
    if (!prefs.containsKey('transactions')) return;
    final extractedUserData = json.decode(prefs.getString('transactions')!) as List<dynamic>;
    _transactions = extractedUserData.map((item) => Transaction.fromJson(item)).toList();
    _transactions.sort((a, b) => b.date.compareTo(a.date));
    notifyListeners();
  }

  Future<void> updateProfile(double initialBalance) async {
    _initialBalance = initialBalance;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    prefs.setDouble('initialBalance', _initialBalance);
  }

  Future<void> addTransaction(String title, double amount, DateTime date, TransactionType type, {bool isCredit = false, String category = 'Otros'}) async {
    final newTransaction = Transaction(
      title: title,
      amount: amount,
      date: date,
      type: type,
      isCredit: isCredit,
      category: category,
    );
    _transactions.insert(0, newTransaction);
    notifyListeners();
    _saveTransactions();
  }

  Future<void> deleteTransaction(String id) async {
    _transactions.removeWhere((tx) => tx.id == id);
    notifyListeners();
    _saveTransactions();
  }

  Future<void> _saveTransactions() async {
    final prefs = await SharedPreferences.getInstance();
    final userData = json.encode(_transactions.map((tx) => tx.toJson()).toList());
    prefs.setString('transactions', userData);
  }
}
