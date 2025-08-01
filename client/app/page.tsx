import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header className="relative">
        <div className="absolute inset-0 cyber-gradient opacity-20 z-0"></div>
        <div className="container mx-auto px-4 py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 cyber-glow">
              <span className="text-cyber-cyan">Cyber Hunter</span> Freelancing Platform
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Connecting students with real-world clients for freelance opportunities, portfolio building, and skill development.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="cyber-border bg-cyber-cyan text-black hover:bg-cyber-cyan/80" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" className="cyber-border" asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-black/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center cyber-glow">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "User Management",
                description: "Role-based authentication and profiles for students, clients, and admins",
                icon: "👤"
              },
              {
                title: "Project & Job Module",
                description: "Post, apply, search, and bid on projects with ease",
                icon: "💼"
              },
              {
                title: "Team & Collaboration",
                description: "Create teams, assign roles, and collaborate in real-time",
                icon: "👥"
              },
              {
                title: "Project Lifecycle",
                description: "Kanban boards, milestones, time tracking, and deliverables",
                icon: "📊"
              },
              {
                title: "Gamification & Ranking",
                description: "Points system, leaderboards, badges, and skill endorsements",
                icon: "🏆"
              },
              {
                title: "Chat & Communication",
                description: "Real-time messaging and notifications between clients and freelancers",
                icon: "💬"
              },
            ].map((feature, index) => (
              <div key={index} className="cyber-card p-6">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center cyber-glow">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create Your Profile",
                description: "Sign up as a student or client and build your professional profile"
              },
              {
                step: "2",
                title: "Connect & Collaborate",
                description: "Find projects or post jobs, form teams, and start collaborating"
              },
              {
                step: "3",
                title: "Grow & Succeed",
                description: "Complete projects, earn points, build your portfolio, and advance your career"
              },
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-cyber-cyan text-black flex items-center justify-center text-2xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 cyber-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Freelancing Journey?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join Cyber Hunter today and connect with real-world clients, build your portfolio, and develop your skills.
          </p>
          <Button size="lg" className="cyber-border bg-black text-cyber-cyan hover:bg-black/80">
            <Link href="/register">Sign Up Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-bold cyber-glow">Cyber Hunter</h3>
              <p className="text-gray-400">Student Freelancing Platform</p>
            </div>
            <div className="flex space-x-6">
              <Link href="/about" className="text-gray-400 hover:text-cyber-cyan">About</Link>
              <Link href="/features" className="text-gray-400 hover:text-cyber-cyan">Features</Link>
              <Link href="/contact" className="text-gray-400 hover:text-cyber-cyan">Contact</Link>
              <Link href="/privacy" className="text-gray-400 hover:text-cyber-cyan">Privacy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-cyber-cyan">Terms</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Cyber Hunter. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
