import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:mobile/main.dart';
import 'package:mobile/providers/auth_provider.dart';

void main() {
  testWidgets('Smoke test loads app successfully', (WidgetTester tester) async {
    // Build our app wrapped in providers and trigger a frame.
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
        ],
        child: const MyApp(),
      ),
    );

    // Verify authentication loader or login layout begins initialization
    expect(find.byType(MyApp), findsOneWidget);
  });
}
