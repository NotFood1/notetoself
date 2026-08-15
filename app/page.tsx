"use client";
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from "react";
import { ArrowRight, Menu, X, Layers, Zap, Globe, BarChart2 } from "lucide-react";
import Image from "next/image";
import paperImage from "./imports/stack_of_paper__1_.jpeg";
import Link from "next/link";

const NAV_LINKS = ["Home", "Dashboard", "Materials", "ChatBot"];

const FEATURES = [
  {
    icon: Layers,
    label: "Strategy",
    description: "We map your materials first, we dont give results based on assumptions.",
  },
  {
    icon: Zap,
    label: "Execution",
    description: "Our AI specifically analyze and see potential pitfalls in your study.",
  },
  {
    icon: Globe,
    label: "Reach",
    description: "Built for the open web — accessible, performant, and ready for wherever you live.",
  },
  {
    icon: BarChart2,
    label: "Clarity",
    description: "Data that tells a story. We surface what matters and ignore the noise.",
  },
];

const TESTIMONIALS = [
  {
    quote: "I always study what i need to study, leave the ones i already mastered behind",
    name: "Nathan Gefania",
    role: "Creator",
  },
  {
    quote: "The secret of getting ahead is getting started.",
    name: "Mark Twain",
  },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [workSessions, setWorkSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Fetch recent notes/sessions from Supabase on load
  useEffect(() => {
    async function fetchRecentSessions() {
      const { data, error } = await supabase
        .from('notes') // Change this to your actual table name if different (e.g. 'sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching sessions:', error);
      } else if (data && data.length > 0) {
        setWorkSessions(data);
      } else {
        // Fallback mock data if the table is currently empty so the UI looks nice
        setWorkSessions([
          { id: "1", title: "My First Study Note", category: "Exam Prep", content: "Getting started with Supabase data." },
          { id: "2", title: "Design System Review", category: "Visual Design", content: "Notes on typography and spacing grids." },
          { id: "3", title: "AI Prompt Engineering", category: "Groq Integration", content: "Optimizing token outputs for speed." },
        ]);
      }
      setLoadingSessions(false);
    }

    fetchRecentSessions();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; 
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between h-16">
          <span
            className="text-lg font-semibold tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            notetoself
          </span>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                {link}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground px-5 py-2 rounded hover:opacity-90 transition-opacity"
            >
              Sign Up <ArrowRight size={14} />
            </Link>
            <button 
              onClick={handleLogout}
              className="text-sm border-l pl-6 text-muted-foreground hover:text-foreground"
            >
              Logout
            </button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-background border-t border-border px-6 py-6 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a key={link} href="#" className="text-base text-foreground">
                {link}
              </a>
            ))}
            <Link href="/login" className="text-base text-muted-foreground mt-2">
              Login
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground px-5 py-2.5 rounded w-fit"
            >
              Sign Up <ArrowRight size={14} />
            </Link>
            <button onClick={handleLogout} className="text-base text-left text-muted-foreground">
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="pt-32 pb-24 lg:pt-44 lg:pb-32 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-end">
          <div>
            <p
              className="text-xs tracking-widest uppercase text-muted-foreground mb-6"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              AI-Powered Study Platform
            </p>
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-semibold leading-[1.05] tracking-tight mb-8 text-[#3131d4]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >Study smarter,<br />not <em className="not-italic text-accent">harder.</em></h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-10">
              Track your study sessions, log your progress, and let our AI
              analyze your habits — then turn that data into personalized
              insights that help you learn faster and retain more.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Start a session <ArrowRight size={15} />
              </Link>
              <Link
                href="#"
                className="inline-flex items-center gap-2 border border-border text-foreground px-7 py-3 rounded text-sm font-medium hover:bg-secondary transition-colors"
              >
                See how it works
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-3 text-right pb-2">
            {["Student Personalized work", "Indie Developed", "For You"].map((stat) => (
              <span
                key={stat}
                className="text-xs tracking-widest uppercase text-muted-foreground"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {stat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Hero image strip */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-24">
        <div className="w-full h-64 md:h-96 lg:h-[480px] rounded overflow-hidden bg-secondary">
          <img
            src={paperImage.src}
            alt="Studio workspace"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 mb-24 lg:mb-36">
        <div className="grid lg:grid-cols-[280px_1fr] gap-16">
          <div>
            <p
              className="text-xs tracking-widest uppercase text-muted-foreground mb-4"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              What we do
            </p>
            <h2
              className="text-3xl lg:text-4xl font-semibold leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Built on four disciplines
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-px bg-border">
            {FEATURES.map(({ icon: Icon, label, description }) => (
              <div
                key={label}
                className="bg-background p-8 hover:bg-card transition-colors group"
              >
                <Icon
                  size={22}
                  className="mb-5 text-accent group-hover:scale-110 transition-transform"
                />
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {label}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Selected work / Recent Sessions */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 mb-24 lg:mb-36">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p
              className="text-xs tracking-widest uppercase text-muted-foreground mb-3"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Selected work
            </p>
            <h2
              className="text-3xl lg:text-4xl font-semibold"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >Recent Sessions</h2>
          </div>
          <a
            href="#"
            className="hidden md:inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all <ArrowRight size={14} />
          </a>
        </div>

        {loadingSessions ? (
          <p className="text-muted-foreground">Loading sessions...</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {workSessions.map((item, index) => (
              <a
                href="#"
                key={item.id || index}
                className="group block border border-border/60 rounded-lg p-6 bg-card/40 hover:bg-card transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      Session 0{index + 1}
                    </span>
                    <h3
                      className="text-xl font-semibold leading-tight mt-2 mb-2"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {item.title || item.name || "Untitled Session"}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.content || item.description || "No description provided yet."}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Testimonials */}
      <section className="bg-primary text-primary-foreground py-20 lg:py-28 mb-24 lg:mb-36">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-[1fr_280px] gap-12 items-start">
            <div>
              <p
                className="text-xs tracking-widest uppercase opacity-50 mb-10"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >&nbsp;&nbsp;</p>
              <blockquote
                className="text-2xl md:text-3xl lg:text-4xl font-light leading-snug mb-10"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                &ldquo;{TESTIMONIALS[activeTestimonial].quote}&rdquo;
              </blockquote>
              <div>
                <p className="text-sm font-medium">{TESTIMONIALS[activeTestimonial].name}</p>
                <p className="text-sm opacity-60">{TESTIMONIALS[activeTestimonial].role}</p>
              </div>
            </div>

            <div className="flex lg:flex-col gap-3 lg:pt-14">
              {TESTIMONIALS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`text-left px-4 py-3 rounded text-sm transition-colors ${
                    activeTestimonial === i
                      ? "bg-primary-foreground/10 text-primary-foreground"
                      : "text-primary-foreground/50 hover:text-primary-foreground/80"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 mb-24 lg:mb-36">
        <div className="border border-border rounded p-12 lg:p-20 text-center">
          <p
            className="text-xs tracking-widest uppercase text-muted-foreground mb-6"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Ready to begin?
          </p>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-8 max-w-2xl mx-auto"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >You're not bad, you just studied wrong</h2>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Start a conversation <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border max-w-7xl mx-auto px-6 lg:px-12 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <span
            className="text-lg font-semibold"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            notetoself
          </span>
          <nav className="flex flex-wrap gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link}
              </a>
            ))}
          </nav>
          <p
            className="text-xs text-muted-foreground"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            © 2026 notetoself Studio
          </p>
        </div>
      </footer>
    </div>
  );
}