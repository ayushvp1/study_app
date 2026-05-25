import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme.dart';
import 'dashboard_screen.dart';

enum AuthMode { login, register, demo }

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  AuthMode _mode = AuthMode.login;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  void _submit() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    bool success = false;

    if (_mode == AuthMode.login) {
      if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
        _showError('Please fill in all fields');
        return;
      }
      success = await auth.login(_emailController.text, _passwordController.text);
    } else if (_mode == AuthMode.register) {
      if (_nameController.text.isEmpty || _emailController.text.isEmpty || _passwordController.text.isEmpty) {
        _showError('Please fill in required fields');
        return;
      }
      success = await auth.register(
        email: _emailController.text,
        password: _passwordController.text,
        name: _nameController.text,
        phone: _phoneController.text,
      );
      if (success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Registration successful! Please login.', style: TextStyle(color: Colors.white)), backgroundColor: Colors.teal));
          setState(() => _mode = AuthMode.login);
        }
        return;
      }
    } else if (_mode == AuthMode.demo) {
      if (_otpController.text.isNotEmpty) {
        success = await auth.verifyDemoOtp(_otpController.text);
      } else {
        final generatedOtp = await auth.requestDemoOtp();
        if (generatedOtp != null) {
          setState(() {
            _otpController.text = generatedOtp;
          });
          _showError('Demo OTP: $generatedOtp. Logging in...', isSuccess: true);
          await Future.delayed(const Duration(milliseconds: 600));
          if (mounted) {
            success = await auth.verifyDemoOtp(generatedOtp);
          }
        } else {
          _showError(auth.error ?? 'Failed to generate Demo OTP. Check network connection.');
          return;
        }
      }
    }

    if (success && mounted) {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen()));
    } else if (!success && mounted) {
      _showError(auth.error ?? 'Authentication failed');
    }
  }

  void _showError(String message, {bool isSuccess = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(color: Colors.white)),
        backgroundColor: isSuccess ? Colors.teal : Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final isLogin = _mode == AuthMode.login;
    final isRegister = _mode == AuthMode.register;
    final isDemo = _mode == AuthMode.demo;

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Stack(
          children: [
            Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 40.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Icon(Icons.school, size: 64, color: AppTheme.primary),
                const SizedBox(height: 16),
                const Text('Study App', textAlign: TextAlign.center, style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900)),
                const SizedBox(height: 40),

                // Mode Toggle
                Row(
                  children: [
                    Expanded(child: _buildModeTab('Sign In', AuthMode.login)),
                    const SizedBox(width: 8),
                    Expanded(child: _buildModeTab('Sign Up', AuthMode.register)),
                    const SizedBox(width: 8),
                    Expanded(child: _buildModeTab('Demo', AuthMode.demo)),
                  ],
                ),
                const SizedBox(height: 32),

                // Form Fields
                if (isRegister) ...[
                  _buildTextField('Full Name', _nameController, icon: Icons.person),
                  const SizedBox(height: 16),
                  _buildTextField('Phone (Optional)', _phoneController, icon: Icons.phone, keyboardType: TextInputType.phone),
                  const SizedBox(height: 16),
                ],
                
                if (isLogin || isRegister) ...[
                  _buildTextField('Email', _emailController, icon: Icons.email, keyboardType: TextInputType.emailAddress),
                  const SizedBox(height: 16),
                  _buildTextField('Password', _passwordController, icon: Icons.lock, isPassword: true),
                ],

                if (isDemo) ...[
                  const Text('Enter Demo OTP to log in as a guest.', style: TextStyle(color: AppTheme.textSecondary, fontSize: 14), textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  _buildTextField('Demo OTP', _otpController, icon: Icons.vpn_key),
                ],

                const SizedBox(height: 32),
                SizedBox(
                  height: 56,
                  child: ElevatedButton(
                    onPressed: auth.isLoading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 8,
                    ),
                    child: auth.isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Text(
                            isDemo && _otpController.text.isEmpty ? 'Get Demo OTP' : (isRegister ? 'Create Account' : 'Log In'),
                            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            top: 16,
              right: 16,
              child: IconButton(
                icon: const Icon(Icons.settings, color: AppTheme.textSecondary),
                onPressed: () => _showConfigDialog(context, auth),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showConfigDialog(BuildContext context, AuthProvider auth) {
    final controller = TextEditingController(text: auth.baseUrl);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.surface,
        title: const Text('API Configuration', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'For a physical device on local Wi-Fi, enter your server\'s IP address.',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Server URL',
                labelStyle: const TextStyle(color: AppTheme.textSecondary),
                filled: true,
                fillColor: AppTheme.background,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
              ),
            ),
            const SizedBox(height: 16),
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  controller.text = 'http://192.168.18.42:3000';
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.primary.withOpacity(0.3), width: 1),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.wifi, size: 20, color: AppTheme.primary),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Quick Connect (Host Wi-Fi)',
                              style: TextStyle(color: AppTheme.primary, fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'http://192.168.18.42:3000',
                              style: TextStyle(color: AppTheme.primary.withOpacity(0.8), fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            ),
            onPressed: () {
              auth.updateBaseUrl(controller.text);
              Navigator.pop(context);
              _showError('API URL updated to: ${controller.text}', isSuccess: true);
            },
            child: const Text('Save', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildModeTab(String label, AuthMode mode) {
    final isSelected = _mode == mode;
    return GestureDetector(
      onTap: () => setState(() => _mode = mode),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary.withOpacity(0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? AppTheme.primary : AppTheme.surface),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? AppTheme.primary : AppTheme.textSecondary,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, {required IconData icon, bool isPassword = false, TextInputType? keyboardType}) {
    return TextField(
      controller: controller,
      obscureText: isPassword,
      keyboardType: keyboardType,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: AppTheme.textSecondary),
        prefixIcon: Icon(icon, color: AppTheme.textSecondary),
        filled: true,
        fillColor: AppTheme.surface,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.primary)),
      ),
    );
  }
}
