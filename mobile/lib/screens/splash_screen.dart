import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme.dart';
import 'login_screen.dart';
import 'dashboard_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 1));
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeInOut);
    _controller.forward();
    
    _checkAuthAndNavigate();
  }

  Future<void> _checkAuthAndNavigate() async {
    // Enforce a minimum splash duration for aesthetic
    await Future.delayed(const Duration(milliseconds: 2500));
    if (!mounted) return;
    
    final auth = Provider.of<AuthProvider>(context, listen: false);
    // wait until auth is no longer loading
    while (auth.isLoading) {
      await Future.delayed(const Duration(milliseconds: 100));
    }
    
    if (!mounted) return;
    
    if (auth.isAuthenticated) {
      Navigator.pushReplacement(context, PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => const DashboardScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
      ));
    } else {
      Navigator.pushReplacement(context, PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => const LoginScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
      ));
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Center(
        child: FadeTransition(
          opacity: _animation,
          child: ScaleTransition(
            scale: _animation,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [AppTheme.primary, Colors.deepOrange],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primary.withOpacity(0.5),
                        blurRadius: 30,
                        spreadRadius: 5,
                      )
                    ],
                  ),
                  child: const Icon(Icons.school, size: 80, color: Colors.white),
                ),
                const SizedBox(height: 32),
                const Text('STUDY APP', style: TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900, letterSpacing: 4)),
                const SizedBox(height: 16),
                const Text('Master Your Recitations', style: TextStyle(color: AppTheme.textSecondary, fontSize: 16, fontWeight: FontWeight.w500, letterSpacing: 1)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
