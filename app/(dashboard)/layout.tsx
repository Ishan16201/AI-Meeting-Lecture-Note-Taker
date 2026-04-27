import Link from "next/link";
import {
  LayoutDashboard,
  History,
  Settings,
  Mic,
  ChevronDown,
  Zap,
} from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Re-enable auth check after Supabase auth is configured
  // const supabase = await createClient();
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();

  // if (!user) {
  //   redirect("/login");
  // }

  const navLinks = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/history", icon: History, label: "History" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-semibold text-white tracking-tight">
              Lumina
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F]"
            >
              <link.icon className="w-5 h-5" />
              <span className="font-medium">{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* New Recording CTA */}
        <div className="p-4">
          <button className="w-full flex items-center justify-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium py-3 px-4 rounded-full transition-all duration-200 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F]">
            <Mic className="w-5 h-5" />
            <span>New Recording</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Top Bar */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 sticky top-0 bg-[#0A0A0F]/80 backdrop-blur-xl z-10">
          <h1 className="text-lg font-medium text-white">Dashboard</h1>

          {/* User Avatar Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-3 hover:bg-white/5 rounded-lg px-3 py-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#22D3EE] flex items-center justify-center text-white text-sm font-medium">
                U
              </div>
              <ChevronDown className="w-4 h-4 text-white/60" />
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#13131A] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2">
              <div className="px-4 py-2 border-b border-white/10">
                <p className="text-sm text-white/60 truncate">user@example.com</p>
              </div>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="w-full text-left px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:bg-white/5"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
