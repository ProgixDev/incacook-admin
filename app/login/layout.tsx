import { AuthProvider } from "@/lib/auth";

/**
 * `/login` needs `useAuth()` (to skip the form when already signed in, and to
 * sign in) but is not part of the `(dashboard)` route group, so it gets its
 * own `AuthProvider` here rather than sharing the dashboard layout's.
 */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
