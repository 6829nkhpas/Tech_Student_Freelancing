import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background pattern/gradient */}
      <div className="fixed inset-0 cyber-gradient opacity-10 z-0"></div>
      
      {/* Content */}
      <main className="flex-grow flex items-center justify-center relative z-10">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground relative z-10">
        <p>© {new Date().getFullYear()} Cyber Hunter. All rights reserved.</p>
      </footer>
    </div>
  );
}