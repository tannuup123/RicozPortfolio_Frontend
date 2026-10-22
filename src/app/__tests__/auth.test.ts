/**
 * Auth Phase — Test Coverage Notes
 *
 * NO TEST RUNNER IS CURRENTLY INSTALLED in this project.
 * (package.json devDependencies has no vitest, jest, @testing-library/*, or similar.)
 *
 * When a test runner is added, the following tests should be written for
 * the Next.js auth implementation:
 *
 * --- bootstrapAuth ---
 * 1. On successful refresh: setAccessToken is called with the new token,
 *    getMe is called, setSession receives the user object, setIsLoading(false) called.
 * 2. On failed refresh (401/no cookie): setSession is NOT called (session stays null),
 *    setIsLoading(false) is still called (always).
 * 3. The refresh handler registered via registerRefreshHandler returns true after
 *    a successful silent refresh and false after a failed one.
 *
 * --- DashboardLayout (auth guard) ---
 * 4. While isLoading=true: renders the loading spinner, does NOT redirect.
 * 5. isLoading=false, isAuthenticated=false: calls router.replace('/login').
 * 6. isLoading=false, isAuthenticated=true: renders the AppShell and children.
 *
 * --- LoginPage ---
 * 7. Valid credentials: calls login(), then getMe(), then setSession(), then router.replace('/').
 * 8. Invalid credentials (401): displays "Invalid email or password." error.
 * 9. Network error: displays the error message from the thrown Error.
 * 10. Token is set in memory (setAccessToken), never in localStorage/sessionStorage.
 *
 * --- RegisterPage ---
 * 11. Valid payload: calls register(), then getMe(), then setSession(), then router.replace('/').
 * 12. 409 conflict: displays the conflict error message.
 * 13. Token is set in memory, never in storage.
 *
 * --- Providers ---
 * 14. Renders without throwing when AuthProvider is present.
 * 15. bootstrapAuth is called exactly once on mount (not on re-renders).
 *
 * --- RBAC ---
 * 16. useAuth().user.roles is populated from /auth/me response.
 * 17. A page that checks user.roles renders correctly for an authorised role
 *     and shows an access-denied message for an unauthorised role.
 */

export {}
