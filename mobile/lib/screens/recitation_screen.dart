import 'package:flutter/material.dart';
import '../theme.dart';

class RecitationScreen extends StatefulWidget {
  final int tableNumber;
  const RecitationScreen({super.key, required this.tableNumber});

  @override
  State<RecitationScreen> createState() => _RecitationScreenState();
}

class _RecitationScreenState extends State<RecitationScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text('Recite Table ${widget.tableNumber}', style: const TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: AppTheme.surface,
      ),
      body: const Center(
        child: Text('Recitation Mode', style: TextStyle(color: Colors.white, fontSize: 24)),
      ),
    );
  }
}