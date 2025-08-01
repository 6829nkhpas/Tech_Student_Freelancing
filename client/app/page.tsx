import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="matrix-bg absolute inset-0 opacity-30"></div>
        <div className="cyber-grid absolute inset-0 opacity-20"></div>
      </div>

      {/* Hero Section */}
      <header className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 futuristic-gradient opacity-30"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Logo and Title */}
            <div className="mb-12 floating-animation">
              <div className="inline-block p-8 glass-morphism rounded-3xl mb-8 quantum-border">
                <h1 className="text-6xl md:text-8xl font-black mb-4">
                  <span className="hologram-text pulse-glow">CYBER</span>
                  <br />
                  <span className="neon-glow">HUNTER</span>
                </h1>
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded"></div>
              </div>
            </div>

            {/* Subtitle */}
            <div className="glass-morphism p-8 rounded-2xl mb-12 data-stream">
              <h2 className="text-2xl md:text-4xl font-bold mb-6 neon-glow-purple">
                Next-Gen Freelancing Platform
              </h2>
              <p className="text-lg md:text-xl mb-8 text-cyan-100 max-w-3xl mx-auto leading-relaxed">
                Connecting visionary students with cutting-edge clients through 
                <span className="hologram-text font-semibold"> AI-powered matching</span>, 
                immersive collaboration tools, and revolutionary skill development.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button size="lg" className="futuristic-button bg-transparent text-cyan-100 hover:text-black px-8 py-4 text-lg font-bold" asChild>
                <Link href="/register">INITIALIZE PROFILE</Link>
              </Button>
              <Button size="lg" variant="outline" className="glass-morphism border-cyan-400 text-cyan-100 hover:bg-cyan-400 hover:text-black px-8 py-4 text-lg font-bold" asChild>
                <Link href="/about">EXPLORE MATRIX</Link>
              </Button>
            </div>

            {/* Stats Display */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Active Users", value: "10K+", color: "text-cyan-400" },
                { label: "Projects Completed", value: "50K+", color: "text-purple-400" },
                { label: "Success Rate", value: "98%", color: "text-pink-400" }
              ].map((stat, index) => (
                <div key={index} className="glass-morphism p-6 rounded-xl">
                  <div className={`text-3xl font-black ${stat.color} neon-glow`}>{stat.value}</div>
                  <div className="text-sm text-cyan-100 mt-2">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-32 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6 hologram-text">
              QUANTUM FEATURES
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mx-auto rounded"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Neural Authentication",
                description: "Advanced biometric security with role-based quantum encryption for students, clients, and admins",
                icon: "🧠",
                color: "from-cyan-500 to-blue-600"
              },
              {
                title: "AI Project Matching",
                description: "Machine learning algorithms match projects with optimal talent using predictive analytics",
                icon: "🚀",
                color: "from-purple-500 to-indigo-600"
              },
              {
                title: "Holographic Collaboration",
                description: "Immersive team spaces with real-time synchronization and quantum communication",
                icon: "🌐",
                color: "from-pink-500 to-rose-600"
              },
              {
                title: "Quantum Lifecycle",
                description: "Advanced Kanban boards with AI-powered milestone prediction and time dilation tracking",
                icon: "⚡",
                color: "from-green-500 to-emerald-600"
              },
              {
                title: "Metaverse Gamification",
                description: "NFT achievements, blockchain leaderboards, and virtual skill endorsements in 3D space",
                icon: "🏆",
                color: "from-yellow-500 to-orange-600"
              },
              {
                title: "Telepathic Communication",
                description: "Instant neural messaging with emotion detection and thought-to-text translation",
                icon: "💭",
                color: "from-red-500 to-pink-600"
              },
            ].map((feature, index) => (
              <div key={index} className="holographic-card p-8 group">
                <div className="text-center">
                  <div className={`text-6xl mb-6 inline-block p-4 rounded-2xl bg-gradient-to-br ${feature.color} shadow-2xl`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4 neon-glow group-hover:neon-glow-purple transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-cyan-100 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                <div className="mt-6 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-32 relative z-10">
        <div className="absolute inset-0 geometric-bg opacity-20"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6 neon-glow-purple">
              NEURAL PATHWAY
            </h2>
            <p className="text-xl text-cyan-100 max-w-2xl mx-auto">
              Enter the matrix through these quantum steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Initialize Neural Profile",
                description: "Quantum-scan your skills and create your digital twin in the metaverse",
                gradient: "from-cyan-400 to-blue-500"
              },
              {
                step: "02", 
                title: "Enter The Network",
                description: "AI algorithms connect you with perfect matches across the quantum realm",
                gradient: "from-purple-400 to-indigo-500"
              },
              {
                step: "03",
                title: "Ascend & Transcend",
                description: "Level up through blockchain achievements and unlock interdimensional opportunities",
                gradient: "from-pink-400 to-red-500"
              },
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${item.gradient} mx-auto flex items-center justify-center text-2xl font-black text-black mb-4 neon-border group-hover:scale-110 transition-transform duration-300`}>
                    {item.step}
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 -translate-y-1/2"></div>
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-4 neon-glow group-hover:hologram-text transition-all duration-300">
                  {item.title}
                </h3>
                <p className="text-cyan-100 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative z-10">
        <div className="absolute inset-0 futuristic-gradient opacity-40"></div>
        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-4xl mx-auto">
            <div className="glass-morphism p-12 rounded-3xl quantum-border">
              <h2 className="text-4xl md:text-6xl font-black mb-8 hologram-text pulse-glow">
                READY TO JACK IN?
              </h2>
              <p className="text-xl mb-12 text-cyan-100 max-w-2xl mx-auto leading-relaxed">
                Join the revolution and sync with the most advanced freelancing matrix ever created. 
                Your journey to digital transcendence starts now.
              </p>
              <Button size="lg" className="futuristic-button bg-transparent text-cyan-100 hover:text-black px-12 py-6 text-xl font-black" asChild>
                <Link href="/register">ENTER THE MATRIX</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-16 glass-morphism">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="mb-6 md:mb-0">
              <h3 className="text-3xl font-black neon-glow mb-2">CYBER HUNTER</h3>
              <p className="text-cyan-200">Next-Gen Freelancing Matrix</p>
            </div>
            <div className="flex space-x-8">
              {['ABOUT', 'FEATURES', 'CONTACT', 'PRIVACY', 'TERMS'].map((link) => (
                <Link 
                  key={link}
                  href={`/${link.toLowerCase()}`} 
                  className="text-cyan-200 hover:text-cyan-400 hover:neon-glow transition-all duration-300 font-semibold"
                >
                  {link}
                </Link>
              ))}
            </div>
          </div>
          <div className="border-t border-cyan-400/30 pt-8 text-center">
            <p className="text-cyan-200">
              &copy; {new Date().getFullYear()} Cyber Hunter. All rights reserved in this dimension and beyond.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
