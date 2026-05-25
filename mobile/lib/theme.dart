import 'package:flutter/material.dart';

class AppTheme {
  static const Color background = Color(0xFF020617); // Deep slate black
  static const Color surface = Color(0xFF0B1329); // Premium card dark blue/slate
  static const Color cardBg = Color(0xFF0F172A); // Slate 900
  static const Color border = Color(0xFF1E293B); // Slate 800
  
  static const Color primary = Color(0xFFDC2626); // Strong Red 600
  static const Color accent = Color(0xFFF43F5E); // Rose 500
  static const Color textPrimary = Color(0xFFF8FAFC); // Slate 50
  static const Color textSecondary = Color(0xFF94A3B8); // Slate 400
  static const Color textMuted = Color(0xFF64748B); // Slate 500

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFFDC2626), Color(0xFFBE123C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFF0F172A), Color(0xFF020617)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static ThemeData get darkTheme {
    return ThemeData.dark().copyWith(
      scaffoldBackgroundColor: background,
      primaryColor: primary,
      colorScheme: const ColorScheme.dark().copyWith(
        primary: primary,
        secondary: accent,
        surface: surface,
        background: background,
      ),
      cardTheme: CardThemeData(
        color: cardBg,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24.0),
          side: const BorderSide(color: border, width: 1.0),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Color(0xFF030712), // Deep input black
        hintStyle: const TextStyle(color: textMuted, fontWeight: FontWeight.w500),
        labelStyle: const TextStyle(color: textSecondary, fontWeight: FontWeight.bold),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 18.0),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16.0),
          borderSide: const BorderSide(color: border, width: 1.0),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16.0),
          borderSide: const BorderSide(color: border, width: 1.0),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16.0),
          borderSide: const BorderSide(color: primary, width: 2.0),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 4.0,
          shadowColor: primary.withOpacity(0.3),
          padding: const EdgeInsets.symmetric(vertical: 16.0),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16.0),
          ),
          textStyle: const TextStyle(
            fontSize: 16.0,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.0,
          ),
        ),
      ),
    );
  }
}
