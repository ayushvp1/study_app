import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  Map<String, dynamic>? _user;
  String? _token;
  bool _isLoading = false;
  String? _error;
  String? _success;
  late ApiService _apiService;
  String _baseUrl = kIsWeb ? 'http://localhost:3000' : 'http://192.168.18.42:3000';

  AuthProvider() {
    _apiService = ApiService(_baseUrl);
    loadSession();
  }

  // Getters
  Map<String, dynamic>? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _token != null;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get success => _success;
  String get baseUrl => _baseUrl;
  ApiService get apiService => _apiService;

  // Clear errors
  void clearMessages() {
    _error = null;
    _success = null;
    notifyListeners();
  }

  // Load persisted session
  Future<void> loadSession() async {
    _isLoading = true;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      
      // Load saved API URL if any
      final savedUrl = prefs.getString('api_base_url');
      if (savedUrl != null && savedUrl.isNotEmpty) {
        _baseUrl = savedUrl;
        _apiService.updateBaseUrl(_baseUrl);
      }

      // Load token and user
      _token = prefs.getString('jwt_token');
      final userString = prefs.getString('user_profile');
      if (userString != null) {
        _user = Map<String, dynamic>.from(jsonDecode(userString));
      }
    } catch (e) {
      _error = 'Failed to load session';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Update Base URL
  Future<void> updateBaseUrl(String newUrl) async {
    _baseUrl = newUrl;
    _apiService.updateBaseUrl(newUrl);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('api_base_url', newUrl);
    notifyListeners();
  }

  // Standard Login
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    _success = null;
    notifyListeners();

    try {
      final response = await _apiService.login(email, password);
      _token = response['token'];
      _user = Map<String, dynamic>.from(response['user']);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('jwt_token', _token!);
      await prefs.setString('user_profile', jsonEncode(_user));

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Register
  Future<bool> register({
    required String email,
    required String password,
    required String name,
    required String phone,
  }) async {
    _isLoading = true;
    _error = null;
    _success = null;
    notifyListeners();

    try {
      await _apiService.register(
        email: email,
        password: password,
        name: name,
        phone: phone,
      );
      _success = 'Account created successfully! Please sign in.';
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Forgot Password
  Future<bool> forgotPassword(String email) async {
    _isLoading = true;
    _error = null;
    _success = null;
    notifyListeners();

    try {
      final response = await _apiService.forgotPassword(email);
      _success = response['message'] ?? 'OTP code sent to email.';
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Reset Password
  Future<bool> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    _isLoading = true;
    _error = null;
    _success = null;
    notifyListeners();

    try {
      final response = await _apiService.resetPassword(
        email: email,
        otp: otp,
        newPassword: newPassword,
      );
      _success = response['message'] ?? 'Password reset successful!';
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Request Demo OTP
  Future<String?> requestDemoOtp() async {
    _isLoading = true;
    _error = null;
    _success = null;
    notifyListeners();

    try {
      final response = await _apiService.requestDemoOtp();
      final otp = response['otp']?.toString();
      _success = 'Demo OTP generated: $otp';
      _isLoading = false;
      notifyListeners();
      return otp;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  // Verify Demo OTP
  Future<bool> verifyDemoOtp(String otp) async {
    _isLoading = true;
    _error = null;
    _success = null;
    notifyListeners();

    try {
      final response = await _apiService.verifyDemoOtp(otp);
      _token = response['token'];
      _user = Map<String, dynamic>.from(response['user']);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('jwt_token', _token!);
      await prefs.setString('user_profile', jsonEncode(_user));

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
    await prefs.remove('user_profile');
    notifyListeners();
  }
}
