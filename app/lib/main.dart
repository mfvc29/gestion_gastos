import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart';

import './providers/transactions_provider.dart';
import './screens/home_screen.dart';
import './screens/add_transaction_screen.dart';
import './screens/profile_screen.dart';
import './screens/metrics_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (ctx) => TransactionsProvider(),
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Gestión de Gastos',
        theme: ThemeData(
          primarySwatch: Colors.indigo,
          colorScheme: ColorScheme.fromSwatch(primarySwatch: Colors.indigo).copyWith(
            secondary: Colors.amber,
          ),
          fontFamily: 'Quicksand',
          useMaterial3: true,
        ),
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: const [
          Locale('es', ''), 
        ],
        home: const HomeScreen(),
        routes: {
          AddTransactionScreen.routeName: (ctx) => const AddTransactionScreen(),
          ProfileScreen.routeName: (ctx) => const ProfileScreen(),
          MetricsScreen.routeName: (ctx) => const MetricsScreen(),
        },
      ),
    );
  }
}
