"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function OAuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;
    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(async ({ error }) => {
      if (error) { toast.error("Sign in failed. Please try again."); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles").select("onboarding_complete").eq("id", user.id).single();
        if (!profile?.onboarding_complete) { router.push("/onboarding"); return; }
      }
      router.push("/dashboard");
    });
  }, [searchParams, router]);

  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback` },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  }

  async function handleMagicLink() {
    if (!email) { toast.error("Enter your email first"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback` },
    });
    if (error) {
      toast.error(error.message);
    } else {
      setMagicLinkSent(true);
      toast.success("Magic link sent! Check your email.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-8 sm:py-12">
      <Suspense><OAuthHandler /></Suspense>
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 mb-4">
            <Image src="/solocare_lockup.svg" alt="SoloCare" width={160} height={53} className="h-14 w-auto" priority />
          </Link>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl sm:text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your compliance dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {magicLinkSent ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-4">📧</div>
                <h3 className="font-semibold text-[#0F172A] mb-2">Check your email</h3>
                <p className="text-sm text-[#64748B]">
                  We sent a magic link to <strong>{email}</strong>. Click it to sign in.
                </p>
                <Button variant="link" className="mt-4" onClick={() => setMagicLinkSent(false)}>
                  Back to sign in
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Google */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  onClick={handleGoogle}
                  disabled={googleLoading}
                >
                  <GoogleIcon />
                  {googleLoading ? "Redirecting..." : "Continue with Google"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400">or</span>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  <div className="text-right">
                    <Link href="/reset-password" className="text-xs text-[#64748B] hover:text-[#1E3A5F] transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                </form>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-slate-500 text-sm"
                  onClick={handleMagicLink}
                  disabled={loading}
                >
                  Send magic link instead
                </Button>

                <p className="text-center text-sm text-[#64748B]">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="text-[#1E3A5F] font-medium hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
