import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme.dart';
import 'practice_screen.dart';
import 'recitation_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Dashboard', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: AppTheme.surface,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: () => auth.logout(),
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Welcome back, ${auth.user?['name'] ?? 'User'}!', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            Expanded(
              child: ListView.builder(
                itemCount: 19, // tables 12-30
                itemBuilder: (context, index) {
                  int tableNumber = index + 12;
                  return Card(
                    color: AppTheme.surface,
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    child: ListTile(
                      title: Text('Table of $tableNumber', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          ElevatedButton(
                            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PracticeScreen(tableNumber: tableNumber))),
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.teal),
                            child: const Text('Practice'),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => RecitationScreen(tableNumber: tableNumber))),
                            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                            child: const Text('Recite'),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}