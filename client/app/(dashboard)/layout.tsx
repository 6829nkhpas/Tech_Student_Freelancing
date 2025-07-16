'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ProtectedRoute from '@/components/auth/protected-route';
import { useAuth } from '@/components/providers/auth-provider';

// Icons (you'll need to install an icon library like lucide-react)
import { 
  Home, 
  Briefcase, 
  Users, 
  CheckSquare, 
  MessageSquare, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out',
    });
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <Home size={20} /> },
    { name: 'Projects', href: '/dashboard/projects', icon: <Briefcase size={20} /> },
    { name: 'Teams', href: '/dashboard/teams', icon: <Users size={20} /> },
    { name: 'Tasks', href: '/dashboard/tasks', icon: <CheckSquare size={20} /> },
    { name: 'Messages', href: '/dashboard/messages', icon: <MessageSquare size={20} /> },
    { name: 'Notifications', href: '/dashboard/notifications', icon: <Bell size={20} /> },
    { name: 'Profile', href: '/dashboard/profile', icon: <User size={20} /> },
    { name: 'Settings', href: '/dashboard/settings', icon: <Settings size={20} /> },
  ];

  // Loading state is handled by ProtectedRoute component

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border">
        <div className="p-4 border-b border-border">
          <h1 className="text-2xl font-bold text-primary">Cyber Hunter</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm rounded-md transition-colors ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'}`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start text-sm"
            onClick={handleLogout}
          >
            <LogOut size={20} className="mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-background border-b border-border p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">Cyber Hunter</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-64 bg-card shadow-lg z-20 pt-16">
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="px-2 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-sm rounded-md transition-colors ${isActive
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="p-4 border-t border-border">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-start text-sm"
                onClick={handleLogout}
              >
                <LogOut size={20} className="mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="container mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}