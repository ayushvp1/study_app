import 'package:flutter/material.dart';
import '../theme.dart';

class PracticeScreen extends StatefulWidget {
  final int tableNumber;
  const PracticeScreen({super.key, required this.tableNumber});

  @override
  State<PracticeScreen> createState() => _PracticeScreenState();
}

class _PracticeScreenState extends State<PracticeScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text('Practice Table ${widget.tableNumber}', style: const TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: AppTheme.surface,
      ),
      body: const Center(
        child: Text('Practice Mode', style: TextStyle(color: Colors.white, fontSize: 24)),
      ),
    );
  }
}