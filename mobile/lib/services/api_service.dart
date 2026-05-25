import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  String _baseUrl;

  ApiService(this._baseUrl);

  String get baseUrl => _baseUrl;

  void updateBaseUrl(String newUrl) {
    _baseUrl = newUrl;
  }

  // Get token helper
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('jwt_token');
  }

  // Create headers with optional auth token
  Future<Map<String, String>> _getHeaders({bool authenticated = true}) async {
    final Map<String, String> headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (authenticated) {
      final token = await _getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  // Handle standard JSON response
  dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return jsonDecode(response.body);
    } else {
      String errorMessage = 'Request failed with status: ${response.statusCode}';
      try {
        final errorJson = jsonDecode(response.body);
        if (errorJson is Map && errorJson.containsKey('error')) {
          errorMessage = errorJson['error'];
        }
      } catch (_) {}
      throw Exception(errorMessage);
    }
  }

  // --- AUTH ENDPOINTS ---

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/auth/login'),
      headers: await _getHeaders(authenticated: false),
      body: jsonEncode({'email': email, 'password': password}),
    );
    return Map<String, dynamic>.from(_handleResponse(response));
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String name,
    required String phone,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/auth/register'),
      headers: await _getHeaders(authenticated: false),
      body: jsonEncode({
        'email': email,
        'password': password,
        'name': name,
        'phone': phone,
      }),
    );
    return Map<String, dynamic>.from(_handleResponse(response));
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/auth/forgot-password'),
      headers: await _getHeaders(authenticated: false),
      body: jsonEncode({'email': email}),
    );
    return Map<String, dynamic>.from(_handleResponse(response));
  }

  Future<Map<String, dynamic>> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/auth/reset-password'),
      headers: await _getHeaders(authenticated: false),
      body: jsonEncode({
        'email': email,
        'otp': otp,
        'newPassword': newPassword,
      }),
    );
    return Map<String, dynamic>.from(_handleResponse(response));
  }

  Future<Map<String, dynamic>> requestDemoOtp() async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/auth/demo-send-otp'),
      headers: await _getHeaders(authenticated: false),
    );
    return Map<String, dynamic>.from(_handleResponse(response));
  }

  Future<Map<String, dynamic>> verifyDemoOtp(String otp) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/auth/demo-verify-otp'),
      headers: await _getHeaders(authenticated: false),
      body: jsonEncode({'otp': otp}),
    );
    return Map<String, dynamic>.from(_handleResponse(response));
  }

  // --- STATS ENDPOINTS ---

  Future<Map<String, dynamic>> getStatsSummary() async {
    final response = await http.get(
      Uri.parse('$_baseUrl/api/stats/summary'),
      headers: await _getHeaders(authenticated: true),
    );
    return Map<String, dynamic>.from(_handleResponse(response));
  }

  // --- QUESTIONS & ATTEMPTS ---

  Future<Map<String, dynamic>> getQuestionsAndStats() async {
    final response = await http.get(
      Uri.parse('$_baseUrl/api/questions'),
      headers: await _getHeaders(authenticated: true),
    );
    return Map<String, dynamic>.from(_handleResponse(response));
  }

  Future<Map<String, dynamic>> recordAttempt({
    required String questionId,
    required dynamic answer,
    required bool isCorrect,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/questions/attempt'),
      headers: await _getHeaders(authenticated: true),
      body: jsonEncode({
        'questionId': questionId,
        'answer': answer,
        'isCorrect': isCorrect,
      }),
    );
    return Map<String, dynamic>.from(_handleResponse(response));
  }

  // --- RECITATION ---

  Future<Map<String, dynamic>> completeRecitation(int tableNumber) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/recitations/complete'),
      headers: await _getHeaders(authenticated: true),
      body: jsonEncode({'tableNumber': tableNumber}),
    );
    return Map<String, dynamic>.from(_handleResponse(response));
  }

  // --- SPEECH TRANSCRIBE ---

  Future<Map<String, dynamic>> transcribeAudio(String filePath) async {
    final token = await _getToken();
    final uri = Uri.parse('$_baseUrl/api/speech/transcribe');
    
    final request = http.MultipartRequest('POST', uri);
    request.files.add(await http.MultipartFile.fromPath('file', filePath));
    
    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    return Map<String, dynamic>.from(_handleResponse(response));
  }
}
