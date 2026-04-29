import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Star, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const Stars = ({ count = 5, size = 14 }: { count?: number; size?: number }) => (
  <div className="inline-flex items-center gap-0.5" aria-label={`${count} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        style={{ width: size, height: size }}
        className={i < count ? "fill-[#F59E0B] text-[#F59E0B]" : "fill-[#D1D5DB] text-[#D1D5DB]"}
      />
    ))}
  </div>
);

const ReviewPreviewCard = ({
  rating = 5,
  name = "Sarah M.",
  initialColor = "#FDE68A",
  initialText = "S",
  date = "3 days ago",
  text = "Best brunch in the neighborhood. The truffle pasta was incredible and our server Marco was so attentive. Already planning our next visit!",
  reply = "Sarah, thank you so much for the kind words! Marco will be thrilled to hear this — the truffle pasta is one of his favorites to recommend. We can't wait to welcome you back. — The Team",
  borderColor = "hsl(var(--success))",
  className = "",
  style,
}: {
  rating?: number;
  name?: string;
  initialColor?: string;
  initialText?: string;
  date?: string;
  text?: string;
  reply?: string;
  borderColor?: string;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={`bg-surface rounded-xl border border-border ${className}`}
    style={{ borderLeft: `3px solid ${borderColor}`, ...style }}
  >
    <div className="p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
          style={{ backgroundColor: initialColor, color: "#7c5a00" }}
        >
          {initialText}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-foreground">{name}</span>
            <Stars count={rating} size={15} />
          </div>
          <div className="text-xs text-muted-foreground">{date}</div>
        </div>
      </div>
      <p className="mt-4 text-[15px] text-foreground/80 leading-[1.7]">{text}</p>
      <div className="mt-5 border-t border-dashed border-border" />
      <div className="mt-4 label-tiny text-accent">Draft reply</div>
      <div
        className="mt-2 rounded-md p-3 text-[14px] text-foreground leading-relaxed"
        style={{ backgroundColor: "hsl(var(--draft-bg))", border: "1px solid hsl(var(--draft-border))" }}
      >
        {reply}
      </div>
    </div>
  </div>
);

const useScrollPosition = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
};

const useInView = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
};

const HeroHeadline = () => {
  const words = ["Every", "review", "deserves", "a", "reply.", "Now", "they", "all", "get", "one."];
  return (
    <h1 className="font-serif text-[44px] leading-[1.0] md:text-[72px] md:leading-[1.0] text-foreground tracking-[-0.03em]">
      {words.map((w, i) => (
        <span
          key={i}
          className="inline-block animate-in-up mr-[0.22em]"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {w}
        </span>
      ))}
    </h1>
  );
};

const Index = () => {
  const scrolled = useScrollPosition();
  const howRef = useInView<HTMLDivElement>();
  const pricingRef = useInView<HTMLDivElement>();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-40 transition-all duration-200 border-b",
          scrolled
            ? "bg-surface/85 backdrop-blur-md border-border"
            : "bg-transparent border-transparent",
        )}
      >
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="logo-underline">
            <Logo size={20} />
          </span>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 transition-colors"
            >
              Log in
            </Link>
            <Button asChild className="cta-shimmer">
              <Link to="/login">Start free trial</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="pt-16">
        {/* Hero */}
        <section className="border-b border-border relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid grid-cols-1 md:grid-cols-5 gap-12 items-center min-h-[80vh]">
            <div className="md:col-span-3">
              <span
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] font-medium tracking-wide text-foreground/70 mb-7 animate-in-fade"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-success/60 pulse-dot" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                </span>
                Google Reviews · Automated
              </span>

              <HeroHeadline />

              <p
                className="mt-7 text-[19px] text-muted-foreground max-w-[480px] leading-[1.65] font-light animate-in-up"
                style={{ animationDelay: "550ms" }}
              >
                ReviewReply writes personalized responses to your Google reviews and posts them for you. Set it up in 5
                minutes. Never ignore a review again.
              </p>

              <div className="mt-10 animate-in-up" style={{ animationDelay: "650ms" }}>
                <Button asChild size="lg" className="group h-12 px-8 text-[15px]">
                  <Link to="/login">
                    Start free — 14 days
                    <ArrowRight size={16} className="arrow-nudge" />
                  </Link>
                </Button>
                <div className="mt-3 text-[13px] text-muted-foreground">No credit card required</div>
              </div>

              <div
                className="mt-10 flex items-center gap-3 animate-in-up"
                style={{ animationDelay: "750ms" }}
              >
                <div className="flex -space-x-2">
                  {[
                    { bg: "#FDE68A", t: "M" },
                    { bg: "#BBF7D0", t: "S" },
                    { bg: "#BFDBFE", t: "K" },
                  ].map((a) => (
                    <div
                      key={a.t}
                      className="h-7 w-7 rounded-full border-2 border-background flex items-center justify-center text-[11px] font-semibold"
                      style={{ backgroundColor: a.bg, color: "#7c5a00" }}
                    >
                      {a.t}
                    </div>
                  ))}
                </div>
                <span className="text-[13px] text-muted-foreground">
                  Trusted by 500+ local businesses
                </span>
              </div>
            </div>

            <div className="md:col-span-2 hidden md:block relative h-[460px]">
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 500px 400px at center, hsl(var(--accent-light)) 0%, transparent 70%)",
                  opacity: 0.7,
                }}
              />
              <div
                className="absolute top-0 left-2 right-0 z-20 animate-in-up group-stack"
                style={{ animationDelay: "300ms", transform: "rotate(-1.5deg)" }}
              >
                <ReviewPreviewCard />
              </div>
              <div
                className="absolute top-[180px] left-[28px] right-[-18px] z-10 animate-in-up"
                style={{ animationDelay: "450ms", transform: "rotate(1deg)" }}
              >
                <ReviewPreviewCard
                  rating={1}
                  name="James K."
                  initialColor="#FECACA"
                  initialText="J"
                  date="yesterday"
                  borderColor="hsl(var(--danger))"
                  text="Waited 40 minutes for a table we had reserved. Food was fine but the experience left a bad taste."
                  reply="James, I'm really sorry we kept you waiting — that's not the experience we want for anyone. I'd love to make it right. Could you email me directly? — Marco, Owner"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Proof bar */}
        <section className="bg-muted-bg border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-14 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20 text-center">
            <div className="text-[15px] text-muted-foreground md:max-w-[200px] md:text-left">
              Helping local businesses reply faster
            </div>
            {[
              { n: "12,000+", l: "reviews replied to" },
              { n: "4.9 / 5", l: "average owner rating" },
              { n: "< 2 min", l: "average setup time" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-serif text-[36px] leading-none text-foreground tracking-[-0.02em]">
                  {s.n}
                </div>
                <div className="mt-2 text-[13px] text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works — horizontal stepper */}
        <section ref={howRef.ref} className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
            <div className="label-tiny text-accent mb-3">How it works</div>
            <h2 className="font-serif text-[40px] md:text-[48px] text-foreground tracking-[-0.02em] leading-[1.05] max-w-[640px]">
              From connect to first reply in under five minutes.
            </h2>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 relative">
              {[
                {
                  n: "01",
                  t: "Connect your Google Business",
                  d: "Authorize once with your Google account. We sync all your reviews immediately.",
                },
                {
                  n: "02",
                  t: "AI drafts every reply",
                  d: "Each review gets a personalized response that matches your business's tone. No templates.",
                },
                {
                  n: "03",
                  t: "One click to publish",
                  d: "Review the draft, make edits, and post directly to Google without leaving your dashboard.",
                },
              ].map((s, i) => (
                <div
                  key={s.n}
                  className={cn(
                    "relative",
                    howRef.inView && "animate-in-up",
                  )}
                  style={howRef.inView ? { animationDelay: `${i * 120}ms` } : { opacity: 0 }}
                >
                  {i < 2 && (
                    <div className="hidden md:block absolute top-10 left-[120px] right-[-12px] border-t border-dashed border-border-strong" />
                  )}
                  <div
                    className="font-serif leading-none text-muted-bg-strong"
                    style={{ fontSize: 80, letterSpacing: "-0.04em" }}
                  >
                    {s.n}
                  </div>
                  <h3 className="mt-5 text-[16px] font-semibold text-foreground">{s.t}</h3>
                  <p className="mt-2 text-[14px] text-muted-foreground leading-[1.65] max-w-[300px]">
                    {s.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features — bento grid */}
        <section className="border-b border-border bg-muted-bg">
          <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
            <div className="label-tiny text-accent mb-3">What you get</div>
            <h2 className="font-serif text-[40px] md:text-[48px] text-foreground tracking-[-0.02em] leading-[1.05] max-w-[680px] mb-14">
              Built specifically for the way local businesses work.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Feature 1 — full width */}
              <div className="md:col-span-2 bg-surface border border-border rounded-xl p-8 md:p-10 hover-lift">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                  <div>
                    <div className="label-tiny text-accent mb-3">Personalized</div>
                    <h3 className="font-serif text-[28px] md:text-[34px] tracking-[-0.02em] text-foreground leading-[1.1]">
                      Replies that actually sound human.
                    </h3>
                    <p className="mt-4 text-[15px] text-muted-foreground leading-[1.65] max-w-[440px]">
                      The AI reads the actual content of each review — not just the star rating. A reviewer who mentions
                      the pasta gets a reply about the pasta.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-muted-bg rounded-lg border border-border p-4">
                      <div className="text-[11px] uppercase tracking-wider text-danger mb-2 font-medium">Generic</div>
                      <p className="text-[14px] text-muted-foreground line-through">
                        Thank you for your feedback! We appreciate your business.
                      </p>
                    </div>
                    <div
                      className="bg-surface rounded-lg p-4"
                      style={{ border: "1.5px solid hsl(var(--success))" }}
                    >
                      <div className="text-[11px] uppercase tracking-wider text-success mb-2 font-medium">Specific</div>
                      <p className="text-[14px] text-foreground leading-relaxed">
                        Sarah, so glad Marco took good care of you — and that the truffle pasta lived up to the hype.
                        We'll save you a table for next time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-surface border border-border rounded-xl p-8 hover-lift">
                <div className="label-tiny text-accent mb-3">Hard reviews handled</div>
                <h3 className="font-serif text-[26px] md:text-[28px] tracking-[-0.02em] text-foreground leading-[1.1]">
                  Built for 1-star reviews too.
                </h3>
                <p className="mt-4 text-[15px] text-muted-foreground leading-[1.65]">
                  Negative reviews need the most attention and get the least. ReviewReply drafts calm, professional
                  responses that de-escalate and invite the customer to return.
                </p>
                <div className="mt-6 bg-muted-bg rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Stars count={1} size={13} />
                    <span className="text-[12px] text-muted-foreground">James K. · yesterday</span>
                  </div>
                  <p className="text-[13px] text-foreground/80 italic leading-relaxed">
                    "Waited 40 minutes for a table we had reserved…"
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-surface border border-border rounded-xl p-8 hover-lift">
                <div className="label-tiny text-accent mb-3">Multi-location</div>
                <h3 className="font-serif text-[26px] md:text-[28px] tracking-[-0.02em] text-foreground leading-[1.1]">
                  All your locations, one inbox.
                </h3>
                <p className="mt-4 text-[15px] text-muted-foreground leading-[1.65]">
                  Own a restaurant group or a small chain? Connect every location and manage all reviews from a single
                  dashboard.
                </p>
                <div className="mt-6 space-y-2">
                  {[
                    { name: "Osteria Marco — Downtown", count: "12 pending", color: "#FDE68A" },
                    { name: "Osteria Marco — Riverside", count: "4 pending", color: "#BBF7D0" },
                  ].map((loc) => (
                    <div
                      key={loc.name}
                      className="bg-muted-bg rounded-lg border border-border p-3 flex items-center gap-3"
                    >
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center font-semibold text-xs"
                        style={{ backgroundColor: loc.color, color: "#7c5a00" }}
                      >
                        O
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-foreground truncate">{loc.name}</div>
                        <div className="text-[11px] text-muted-foreground">{loc.count}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section ref={pricingRef.ref} className="border-b border-border">
          <div className="max-w-3xl mx-auto px-6 py-24 md:py-32 text-center">
            <div className="label-tiny text-accent mb-3">Pricing</div>
            <h2 className="font-serif text-[40px] md:text-[48px] text-foreground tracking-[-0.02em] leading-[1.05]">
              Simple pricing.
            </h2>
            <p className="mt-3 text-muted-foreground text-[15px]">
              One plan. Everything included. Cancel whenever.
            </p>

            <div
              className={cn(
                "mt-12 mx-auto max-w-[440px] rounded-[13px] p-px",
                pricingRef.inView && "animate-in-up",
              )}
              style={{
                background: "linear-gradient(135deg, hsl(var(--accent)) 0%, #E8A87C 100%)",
              }}
            >
              <div className="bg-surface rounded-[12px] p-10 text-left">
                <div className="flex items-center justify-between">
                  <div className="label-tiny text-accent">Growth</div>
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--accent)) 0%, #E8A87C 100%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    Most popular
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-serif text-[64px] leading-none text-foreground tracking-[-0.03em]">
                    $29
                  </span>
                  <span className="text-[16px] text-muted-foreground">/month</span>
                </div>
                <div className="mt-1 text-[13px] text-muted-foreground">
                  per location · billed monthly
                </div>

                <ul className="mt-8 space-y-3">
                  {[
                    "Unlimited AI-generated replies",
                    "Direct publish to Google",
                    "All star ratings handled",
                    "Tone customization",
                    "Multiple locations supported",
                    "New review notifications (coming soon)",
                  ].map((f, i) => (
                    <li
                      key={f}
                      className={cn(
                        "flex items-start gap-3 text-[15px] text-foreground",
                        pricingRef.inView && "animate-in-fade",
                      )}
                      style={pricingRef.inView ? { animationDelay: `${300 + i * 60}ms` } : { opacity: 0 }}
                    >
                      <Check className="w-4 h-4 mt-1 text-accent shrink-0" strokeWidth={2.5} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild className="mt-8 w-full h-12 text-[15px] group">
                  <Link to="/login">
                    Start 7-day free trial
                    <ArrowRight size={16} className="arrow-nudge" />
                  </Link>
                </Button>
                <p className="mt-4 text-center text-[12px] text-muted-foreground">
                  Cancel anytime from your dashboard. No hidden fees.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[hsl(var(--sidebar-bg))] text-white">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div>
              <Logo variant="light" size={20} />
              <p className="mt-4 text-[14px] text-white/60 max-w-[260px]">Replies that sound like you.</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-white/70">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="mailto:hello@reviewreply.app" className="hover:text-white transition-colors">
                hello@reviewreply.app
              </a>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/10 text-[12px] text-white/40">
            © 2026 ReviewReply. Not affiliated with Google LLC.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
