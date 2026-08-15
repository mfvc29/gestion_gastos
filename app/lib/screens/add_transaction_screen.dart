import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/transaction.dart';
import '../providers/transactions_provider.dart';

class AddTransactionScreen extends StatefulWidget {
  static const routeName = '/add-transaction';

  const AddTransactionScreen({super.key});

  @override
  State<AddTransactionScreen> createState() => _AddTransactionScreenState();
}

class _AddTransactionScreenState extends State<AddTransactionScreen> {
  final _titleController = TextEditingController();
  final _amountController = TextEditingController();
  DateTime? _selectedDate;
  TransactionType _selectedType = TransactionType.expense;
  bool _isCredit = false;
  String _selectedCategory = 'Otros';

  final List<String> _categories = [
    'Comida',
    'Transporte',
    'Vivienda',
    'Salud',
    'Entretenimiento',
    'Otros',
  ];

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now();
  }

  void _submitData() {
    if (_amountController.text.isEmpty) {
      return;
    }
    final enteredTitle = _titleController.text;
    final enteredAmount = double.tryParse(_amountController.text) ?? 0;

    if (enteredTitle.isEmpty || enteredAmount <= 0 || _selectedDate == null) {
      return; 
    }

    Provider.of<TransactionsProvider>(context, listen: false)
        .addTransaction(
          enteredTitle, 
          enteredAmount, 
          _selectedDate!, 
          _selectedType,
          isCredit: _selectedType == TransactionType.expense ? _isCredit : false,
          category: _selectedType == TransactionType.expense ? _selectedCategory : 'Ingreso',
        );

    Navigator.of(context).pop();
  }

  void _presentDatePicker() {
    showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now(),
      firstDate: DateTime(2023),
      lastDate: DateTime.now(),
      locale: const Locale('es', ''),
    ).then((pickedDate) {
      if (pickedDate == null) {
        return;
      }
      setState(() {
        _selectedDate = pickedDate;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_selectedType == TransactionType.expense 
            ? 'Registrar Gasto' 
            : _selectedType == TransactionType.income 
                ? 'Registrar Ingreso'
                : 'Pagar Tarjeta'),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              // Selector de Tipo
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ChoiceChip(
                    label: const Text('Gasto'),
                    selected: _selectedType == TransactionType.expense,
                    selectedColor: Colors.redAccent.shade100,
                    onSelected: (selected) {
                      setState(() {
                         _selectedType = TransactionType.expense;
                         _titleController.clear();
                      });
                    },
                  ),
                  const SizedBox(width: 10),
                  ChoiceChip(
                    label: const Text('Ingreso'),
                    selected: _selectedType == TransactionType.income,
                    selectedColor: Colors.greenAccent.shade100,
                    onSelected: (selected) {
                      setState(() {
                        _selectedType = TransactionType.income;
                        _titleController.clear();
                      });
                    },
                  ),
                   const SizedBox(width: 10),
                  ChoiceChip(
                    label: const Text('Pago TC'),
                    selected: _selectedType == TransactionType.payment,
                    selectedColor: Colors.blueAccent.shade100,
                    onSelected: (selected) {
                      setState(() {
                        _selectedType = TransactionType.payment;
                        _titleController.text = 'Pago Tarjeta Crédito';
                      });
                    },
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Campos comunes
              TextField(
                decoration: InputDecoration(
                  labelText: _selectedType == TransactionType.expense ? '¿En qué gastaste?' 
                              : _selectedType == TransactionType.income ? 'Concepto' : 'Descripción',
                ),
                controller: _titleController,
              ),
              TextField(
                decoration: const InputDecoration(labelText: 'Monto (S/.)'),
                controller: _amountController,
                keyboardType: TextInputType.numberWithOptions(decimal: true),
              ),
              
              const SizedBox(height: 10),

              // Opciones específicas de GASTO
              if (_selectedType == TransactionType.expense) ...[
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: _selectedCategory,
                  decoration: const InputDecoration(labelText: 'Categoría'),
                  items: _categories.map((cat) {
                    return DropdownMenuItem(
                      value: cat,
                      child: Text(cat),
                    );
                  }).toList(),
                  onChanged: (val) {
                    setState(() {
                      _selectedCategory = val!;
                    });
                  },
                ),
                const SizedBox(height: 10),
                CheckboxListTile(
                  title: const Text('Usé Tarjeta de Crédito 💳'),
                  subtitle: const Text('Marca esto si no pagaste con efectivo/débito'),
                  value: _isCredit,
                  onChanged: (val) {
                    setState(() {
                      _isCredit = val ?? false;
                    });
                  },
                  activeColor: Colors.deepPurple,
                ),
              ],
               
              // Opciones específicas de PAGO
              if (_selectedType == TransactionType.payment)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 10),
                  child: Text(
                    'Registrar un pago reducirá tu deuda de tarjeta y tu efectivo disponible.',
                    style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic),
                  ),
                ),

              const SizedBox(height: 20),
              
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      _selectedDate == null
                          ? 'No se ha seleccionado fecha'
                          : 'Fecha: ${DateFormat.yMd('es').format(_selectedDate!)}',
                    ),
                  ),
                  TextButton(
                    onPressed: _presentDatePicker,
                    child: const Text(
                      'Elegir Fecha',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              
              ElevatedButton(
                onPressed: _submitData,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _selectedType == TransactionType.expense ? Colors.redAccent 
                                 : _selectedType == TransactionType.income ? Colors.green
                                 : Colors.blueAccent,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                ),
                child: Text(
                  _selectedType == TransactionType.expense ? 'Registrar Gasto' 
                  : _selectedType == TransactionType.income ? 'Registrar Ingreso'
                  : 'Registrar Pago',
                  style: const TextStyle(color: Colors.white, fontSize: 16),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
