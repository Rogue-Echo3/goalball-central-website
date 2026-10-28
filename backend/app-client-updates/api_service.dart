import 'dart:convert';
import 'package:firebase_auth/firebase_auth.dart';

import 'package:http/http.dart' as http;

class ApiService {
  ApiService._();

  static const String baseUrl =
      'https://script.google.com/macros/s/AKfycbxXn-ZLqTgLajg8YcTwIj-2zMq9KmpNaZrVv1Awy2diSWjXwMOJyjsUQn1VW62eSXP-/exec';

  static Future<Map<String, dynamic>> getGoalballData() async {
    final uri = Uri.parse('$baseUrl?mode=schedules');

    final response =
        await http.get(uri).timeout(const Duration(seconds: 20));

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        'Unable to load games. HTTP ${response.statusCode}.',
      );
    }

    final decoded = jsonDecode(response.body);

    if (decoded is! Map<String, dynamic>) {
      throw const ApiException(
        'The schedule service returned an unexpected response.',
      );
    }

    if (decoded['success'] == false) {
      throw ApiException(
        decoded['error']?.toString() ?? 'Unable to load games.',
      );
    }

    return decoded;
  }

  static Future<SaveFinalScoreResult> saveFinalScore({
    required int sheetRow,
    required int teamAScore,
    required int teamBScore,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) throw const ApiException('Sign in to save scores.');
    final idToken = await user.getIdToken();

    // POST goes to the base URL
    final uri = Uri.parse(baseUrl);

    final response = await http.post(
      uri,
      headers: const {
        'Content-Type': 'text/plain; charset=UTF-8',
      },
      body: jsonEncode({
        'action': 'saveFinalScore',
        'idToken': idToken,
        'sheetRow': sheetRow,
        'teamAScore': teamAScore,
        'teamBScore': teamBScore,
      }),
    ).timeout(const Duration(seconds: 20));

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        'Unable to save the score. HTTP ${response.statusCode}.',
      );
    }

    final decoded = jsonDecode(response.body);

    if (decoded is! Map<String, dynamic>) {
      throw const ApiException(
        'The score service returned an unexpected response.',
      );
    }

    if (decoded['success'] != true) {
      throw ApiException(
        decoded['error']?.toString() ??
            'The score could not be saved.',
      );
    }

    return SaveFinalScoreResult(
      message: decoded['message']?.toString() ?? 'Final score saved.',
      result: decoded['result']?.toString() ?? '',
    );
  }
}

class SaveFinalScoreResult {
  const SaveFinalScoreResult({
    required this.message,
    required this.result,
  });

  final String message;
  final String result;
}

class ApiException implements Exception {
  const ApiException(this.message);

  final String message;

  @override
  String toString() => message;
}
