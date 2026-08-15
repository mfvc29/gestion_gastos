import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/transactions_provider.dart';

class ProfileScreen extends StatefulWidget {
  static const routeName = '/profile';

  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _initialBalanceController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<TransactionsProvider>(context, listen: false);
    _initialBalanceController.text = provider.initialBalance.toString();
  }

  void _saveProfile() {
    final initialBalance = double.tryParse(_initialBalanceController.text) ?? 0.0;

    Provider.of<TransactionsProvider>(context, listen: false)
        .updateProfile(initialBalance);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Perfil actualizado')),
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mi Perfil Financiero')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _initialBalanceController,
              decoration: const InputDecoration(
                labelText: 'Saldo Inicial Tarjeta Débito (S/.)',
                hintText: 'Ej: 500.00',
              ),
              keyboardType: TextInputType.numberWithOptions(decimal: true),
            ),
            const SizedBox(height: 20),
            const Text(
              'Configura aquí el saldo con el que inicias el mes en tu cuenta, antes de recibir tu sueldo.',
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 30),
            ElevatedButton(
              onPressed: _saveProfile,
              child: const Text('Guardar Cambios'),
            ),
          ],
        ),
      ),
    );
  }
}
