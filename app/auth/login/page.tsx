/**
 * Login Page — /auth/login
 *
 * Collects email + password, calls Supabase signInWithPassword.
 * On success, Supabase sets the session cookies and we redirect to /dashboard.
 * On failure, shows the error returned by Supabase.
 *
 * Also handles the error=auth_callback_failed query param from the callback route.
 */

import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <LoginForm />
    </Suspense>
  );
}
