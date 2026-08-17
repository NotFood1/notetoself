"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { ArrowRight, Menu, X, Layers, Zap, Globe, BarChart2, BookOpen, MessageSquare, Clock } from "lucide-react";
import Image from "next/image";
import paperImage from "./imports/stack_of_paper__1_.jpeg";
import Link from "next/link";

const NAV_LINKS = [
  { name: "Features", href: "#features" },
  { name: "Materials", href: "/dashboard/materials" },
  { name: "AI Assistant", href: "/dashboard/chat" },
  { name: "Analytics", href: "/dashboard/analytics" },
];

const FEATURES = [
  {
    icon: Layers,
    label: "Material Mapping",
    description: "Upload and map your study materials first. No generic advice based on assumptions.",
  },
  {
    icon: Zap,
    label: "Pitfall Detection",
    description: "Groq-powered AI analyzes your notes to identify knowledge gaps and misconceptions.",
  },
  {
    icon: Globe,
    label: "Active Recall",
    description: "Instantly turn raw notes and lecture summaries into high-yield flashcard decks.",
  },
  {
    icon: BarChart2,
    label: "Habit Clarity",
    description: "Track focus minutes and study streaks with our built-in Pomodoro workflow.",
  },
];

const TESTIMONIALS = [
  {
    quote: "I always study what I need to study, leaving behind what I've already mastered.",
    name: "Nathan Gefania",
    role: "Creator & Student",
  },
  {
    quote: "The secret of getting ahead is getting started.",
    name: "Mark Twain",
    role: "Author",
  },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [recentMaterials, setRecentMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  // Check auth state and fetch preview materials
  useEffect(() => {
    async function initPage() {
      // 1. Check user session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // 2. Fetch recent public/user materials or fallback mock
      const { data } = await supabase
        .from("materials")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);

      if (data && data.length > 0) {
        setRecentMaterials(data);
      } else {
        setRecentMaterials([
          { id: "1", title: "Cellular Respiration & ATP", category: "Biology", notes: "Glycolysis, Krebs cycle, and electron transport chain breakdown." },
          { id: "2", title: "Microeconomics Price Elasticity", category: "Economics", notes: "Formulas for elasticity of demand, supply, and cross-price." },
          { id: "3", title: "AI Prompt Engineering & Tokenomics", category: "Computer Science", notes: "Optimizing Groq Llama 3 context windows for low latency." },
        ]);
      }
      setLoadingMaterials(false);
    }

    initPage();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header / Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight font-serif text-foreground hover:opacity-80 transition-opacity"
          >
            notetoself
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-foreground hover:text-accent transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-muted-foreground hover:text-foreground border-l border-border pl-4 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2 rounded font-medium hover:opacity-90 transition-opacity"
                >
                  Sign Up <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="md:hidden bg-background border-t border-border px-6 py-6 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-base text-foreground"
              >
                {link.name}
              </Link>
            ))}
            <div className="border-t border-border pt-4 flex flex-col gap-3">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="text-base font-medium text-foreground"
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="text-base text-left text-muted-foreground"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="text-base text-muted-foreground"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex items-center justify-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2.5 rounded font-medium"
                  >
                    Sign Up <ArrowRight size={14} />
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 lg:pt-44 lg:pb-28 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-end">
          <div>
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-6 font-mono">
              AI-Powered Focused Study System
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold leading-[1.05] tracking-tight mb-8 font-serif">
              Study smarter,<br />
              not <em className="not-italic text-accent">harder.</em>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-10">
              Track study sessions, organize materials, and let our Groq-powered AI
              analyze your habits to turn raw notes into active recall insights.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={user ? "/dashboard" : "/signup"}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {user ? "Open Dashboard" : "Start studying for free"} <ArrowRight size={15} />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 border border-border text-foreground px-7 py-3 rounded text-sm font-medium hover:bg-secondary transition-colors"
              >
                See how it works
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-3 text-right pb-2 font-mono">
            {["Personalized Notes", "Groq AI Speed", "Active Recall", "Built for Students"].map((stat) => (
              <span key={stat} className="text-xs tracking-widest uppercase text-muted-foreground">
                {stat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Hero image banner */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-24">
        <div className="relative w-full h-64 md:h-96 lg:h-[460px] rounded-lg overflow-hidden border border-border bg-secondary">
          <Image
            src={paperImage}
            alt="Studio study workspace"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover"
          />
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-12 mb-24 lg:mb-36 scroll-mt-24">
        <div className="grid lg:grid-cols-[280px_1fr] gap-16">
          <div>
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-4 font-mono">
              Core Method
            </p>
            <h2 className="text-3xl lg:text-4xl font-semibold leading-tight font-serif">
              Built on four disciplines
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-px bg-border border border-border rounded-lg overflow-hidden">
            {FEATURES.map(({ icon: Icon, label, description }) => (
              <div
                key={label}
                className="bg-card p-8 hover:bg-muted/50 transition-colors group"
              >
                <Icon
                  size={22}
                  className="mb-5 text-accent group-hover:scale-110 transition-transform"
                />
                <h3 className="text-lg font-semibold mb-2 font-serif text-foreground">
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

      {/* Selected work / Recent Materials */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 mb-24 lg:mb-36">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3 font-mono">
              Materials Hub Preview
            </p>
            <h2 className="text-3xl lg:text-4xl font-semibold font-serif">
              Structured Study Decks
            </h2>
          </div>
          <Link
            href="/dashboard/materials"
            className="hidden md:inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Open Materials Hub <ArrowRight size={14} />
          </Link>
        </div>

        {loadingMaterials ? (
          <p className="text-muted-foreground">Loading preview...</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {recentMaterials.map((item, index) => (
              <Link
                href="/dashboard/materials"
                key={item.id || index}
                className="group block border border-border rounded-lg p-6 bg-card hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-accent uppercase tracking-wider">
                      {item.category || `Material 0${index + 1}`}
                    </span>
                    <h3 className="text-xl font-semibold leading-tight mt-2 mb-2 font-serif text-foreground group-hover:text-primary transition-colors">
                      {item.title || "Untitled Note"}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.notes || "Ready for AI analysis and active recall."}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Testimonials */}
      <section className="bg-primary text-primary-foreground py-20 lg:py-28 mb-24 lg:mb-36">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-[1fr_280px] gap-12 items-start">
            <div>
              <blockquote className="text-2xl md:text-3xl lg:text-4xl font-light leading-snug mb-10 font-serif">
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
                  className={`text-left px-4 py-3 rounded text-sm transition-colors cursor-pointer ${
                    activeTestimonial === i
                      ? "bg-primary-foreground/15 text-primary-foreground font-medium"
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
        <div className="border border-border rounded-lg p-12 lg:p-20 text-center bg-card">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-6 font-mono">
            Ready to begin?
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-8 max-w-2xl mx-auto font-serif">
            You're not behind — you just studied without feedback.
          </h2>
          <Link
            href={user ? "/dashboard" : "/signup"}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {user ? "Go to Dashboard" : "Start your first session"} <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border max-w-7xl mx-auto px-6 lg:px-12 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <span className="text-lg font-semibold font-serif">
            notetoself
          </span>
          <nav className="flex flex-wrap gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-muted-foreground font-mono">
            © {new Date().getFullYear()} notetoself Studio
          </p>
        </div>
      </footer>
    </div>
  );
}