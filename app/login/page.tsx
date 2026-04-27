import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If already logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
      {/* Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7C3AED]/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Lumina AI</h1>
          <p className="text-white/50">Sign in to access your meetings</p>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <p className="text-white/70 text-center mb-6">
            This is a placeholder login page. In production, integrate with your auth provider.
          </p>

          <Link
            href="/dashboard"
            className="block w-full py-3 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium rounded-lg transition-colors text-center"
          >
            Continue to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
