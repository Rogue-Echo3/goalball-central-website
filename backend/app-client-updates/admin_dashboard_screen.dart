import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'final_score_entry_screen.dart';
import 'goalball_scouting_screen.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() =>
      _AdminDashboardScreenState();
}

class _AdminDashboardScreenState
    extends State<AdminDashboardScreen> {
  static const String _apiUrl =
      'https://script.google.com/macros/s/'
      'AKfycbxXn-ZLqTgLajg8YcTwIj-2zMq9KmpNaZrVv1Awy2diSWjXwMOJyjsUQn1VW62eSXP-/exec';

  bool _isUpdatingPools = false;

  Future<void> _signOut() async {
    try {
      await FirebaseAuth.instance.signOut();
    } catch (_) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Unable to sign out. Please try again.'),
        ),
      );
    }
  }

  Future<void> _confirmPoolUpdate() async {
    if (_isUpdatingPools) return;

    final shouldUpdate = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Update Tournament Pools?'),
          content: const Text(
            'This will recalculate the standings for every tournament '
            'currently marked AUTO. Tournaments marked LOCKED will not '
            'be changed.',
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop(false);
              },
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                Navigator.of(dialogContext).pop(true);
              },
              child: const Text('Update Pools'),
            ),
          ],
        );
      },
    );

    if (shouldUpdate != true) return;

    await _updateTournamentPools();
  }

  Future<void> _updateTournamentPools() async {
    setState(() {
      _isUpdatingPools = true;
    });

    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) throw Exception('Sign in to update pools.');
      final idToken = await user.getIdToken();
      final response = await http
    .post(
      Uri.parse(_apiUrl),
      body: jsonEncode({
        'action': 'updatePools',
        'idToken': idToken,
      }),
    )
          .timeout(const Duration(seconds: 60));

      if (response.statusCode < 200 ||
          response.statusCode >= 300) {
        throw Exception(
          'The server returned status ${response.statusCode}.',
        );
      }

      final dynamic decodedResponse = jsonDecode(response.body);

      if (decodedResponse is! Map<String, dynamic>) {
        throw Exception('The server returned an invalid response.');
      }

      final data = decodedResponse;
      final success = data['success'] == true;

      if (!success) {
        final error = data['error']?.toString().trim();

        throw Exception(
          error == null || error.isEmpty
              ? 'The tournament pools could not be updated.'
              : error,
        );
      }

      if (!mounted) return;

      final autoEvents = _readNumber(data['autoEvents']);
      final lockedEvents = _readNumber(data['lockedEvents']);
      final updatedRows = _readNumber(data['updatedRows']);
      final processedGames = _readNumber(data['processedGames']);
      final skippedGames = _readNumber(data['skippedGames']);

      await showDialog<void>(
        context: context,
        builder: (dialogContext) {
          return AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.check_circle_outline),
                SizedBox(width: 12),
                Expanded(
                  child: Text('Pools Update Complete'),
                ),
              ],
            ),
            content: Text(
              'AUTO tournaments: $autoEvents\n'
              'LOCKED tournaments: $lockedEvents\n'
              'Pool rows updated: $updatedRows\n'
              'Games processed: $processedGames\n'
              'Games skipped: $skippedGames',
            ),
            actions: [
              FilledButton(
                onPressed: () {
                  Navigator.of(dialogContext).pop();
                },
                child: const Text('OK'),
              ),
            ],
          );
        },
      );
    } on FormatException {
      if (!mounted) return;

      _showErrorMessage(
        'The server returned a response that the app could not read.',
      );
    } catch (error) {
      if (!mounted) return;

      final message = error
          .toString()
          .replaceFirst('Exception: ', '')
          .trim();

      _showErrorMessage(
        message.isEmpty
            ? 'Unable to update the tournament pools.'
            : message,
      );
    } finally {
      if (mounted) {
        setState(() {
          _isUpdatingPools = false;
        });
      }
    }
  }

  int _readNumber(dynamic value) {
    if (value is num) {
      return value.toInt();
    }

    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  void _showErrorMessage(String message) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.error_outline),
              SizedBox(width: 12),
              Text('Update Failed'),
            ],
          ),
          content: Text(message),
          actions: [
            FilledButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
              },
              child: const Text('OK'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        actions: [
          IconButton(
            tooltip: 'Sign out',
            onPressed: _isUpdatingPools ? null : _signOut,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              'Goalball Central Admin',
              style:
                  Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
            ),
            const SizedBox(height: 8),
            Text(
              'Signed in as ${user?.email ?? 'Administrator'}',
            ),
            const SizedBox(height: 24),
            Card(
              child: ListTile(
                leading: const Icon(Icons.scoreboard),
                title: const Text('Enter Final Score'),
                subtitle: const Text(
                  'Select a scheduled game and enter its final result.',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: _isUpdatingPools
                    ? null
                    : () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) =>
                                const FinalScoreEntryScreen(),
                          ),
                        );
                      },
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.analytics_outlined),
                title: const Text('Goalball Scouting'),
                subtitle: const Text(
                  'Record player and team scouting information.',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: _isUpdatingPools
                    ? null
                    : () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) =>
                                const GoalballScoutingScreen(),
                          ),
                        );
                      },
              ),
            ),
            Card(
              child: ListTile(
                leading: _isUpdatingPools
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                        ),
                      )
                    : const Icon(Icons.refresh),
                title: Text(
                  _isUpdatingPools
                      ? 'Updating Tournament Pools...'
                      : 'Update Tournament Pools',
                ),
                subtitle: const Text(
                  'Recalculate pool standings for tournaments '
                  'currently marked AUTO.',
                ),
                trailing: _isUpdatingPools
                    ? null
                    : const Icon(Icons.chevron_right),
                onTap:
                    _isUpdatingPools ? null : _confirmPoolUpdate,
              ),
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: _isUpdatingPools ? null : _signOut,
              icon: const Icon(Icons.logout),
              label: const Text('Sign Out'),
            ),
          ],
        ),
      ),
    );
  }
}