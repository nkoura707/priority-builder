import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Star, Check } from "lucide-react";

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
  borderColor = "#16A34A",
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
    className={`bg-surface rounded-[10px] border border-border shadow-sm ${className}`}
    style={{ borderLeft: `4px solid ${borderColor}`, ...style }}
  >
    <div className="p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
          style={{ backgroundColor: initialColor, color: "#7c5a00" }}
        >
          {initialText}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-foreground">{name}</span>
            <Stars count={rating} />
          </div>
          <div className="text-xs text-muted-foreground">{date}</div>
        </div>
      </div>
      <p className="mt-4 text-[15px] text-[#374151] leading-[1.7]">{text}</p>
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

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-surface border-b border-border">
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size={20} />
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2">
              Log in
            </Link>
            <Button asChild>
              <Link to="/login">Start free trial</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 min-h-[80vh] grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
            <div className="md:col-span-3">
              <div className="label-tiny text-accent mb-6">Google Reviews · Automated</div>
              <h1 className="font-serif text-[40px] leading-[1.05] md:text-[64px] md:leading-[1.02] text-foreground tracking-tight">
                Every review deserves a reply. Now they all get one.
              </h1>
              <p className="mt-6 text-[18px] text-muted-foreground max-w-[480px] leading-relaxed">
                ReviewReply writes personalized responses to your Google reviews and posts them for you. Set it up in 5
                minutes. Never ignore a review again.
              </p>
              <div className="mt-8">
                <Button asChild size="lg" className="h-12 px-6 text-[15px]">
                  <Link to="/login">Start free — 7 days</Link>
                </Button>
                <div className="mt-3 text-[13px] text-muted-foreground">No credit card required</div>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-2 text-[13px] text-muted-foreground">
                <span>✓ Works with any Google Business</span>
                <span aria-hidden className="text-hint">·</span>
                <span>✓ Publishes directly to Google</span>
                <span aria-hidden className="text-hint">·</span>
                <span>✓ Cancel anytime</span>
              </div>
            </div>

            <div className="md:col-span-2 hidden md:block relative">
              <div
                aria-hidden
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none font-serif"
                style={{ fontSize: 200, color: "#F0EDE8", lineHeight: 1, letterSpacing: "-0.05em" }}
              >
                ★★★★★
              </div>
              <div className="relative" style={{ transform: "rotate(2deg)" }}>
                <ReviewPreviewCard />
              </div>
            </div>
          </div>
        </section>

        {/* Proof bar */}
        <section style={{ backgroundColor: "hsl(var(--muted-bg))" }} className="border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-center">
            <div className="text-[15px] text-muted-foreground md:max-w-[200px] md:text-left">
              Helping local businesses reply faster
            </div>
            {[
              { n: "12,000+", l: "reviews replied to" },
              { n: "4.9 / 5", l: "average owner rating" },
              { n: "< 2 min", l: "average setup time" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-serif text-[32px] leading-none text-foreground">{s.n}</div>
                <div className="mt-2 text-[13px] text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-b border-border">
          <div className="max-w-5xl mx-auto px-6 py-20 md:py-28">
            <div className="label-tiny text-accent mb-3">How it works</div>
            <h2 className="font-serif text-[36px] md:text-[44px] text-foreground tracking-tight max-w-[600px]">
              From connect to first reply in under five minutes.
            </h2>
            <div className="mt-14 space-y-12">
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
                  d: "Review the draft, make any edits, and post directly to Google without leaving your dashboard.",
                },
              ].map((s) => (
                <div key={s.n} className="grid grid-cols-[80px_1fr] md:grid-cols-[140px_1fr] gap-6 items-start">
                  <div
                    className="font-serif leading-none"
                    style={{ fontSize: 80, color: "hsl(var(--border))" }}
                  >
                    {s.n}
                  </div>
                  <div className="pt-4 md:pt-6">
                    <h3 className="text-[20px] font-semibold text-foreground">{s.t}</h3>
                    <p className="mt-2 text-[16px] text-muted-foreground max-w-[560px] leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-b border-border" style={{ backgroundColor: "hsl(var(--muted-bg))" }}>
          <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 space-y-24">
            {/* Feature 1: text left */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="label-tiny text-accent mb-3">Personalized</div>
                <h3 className="font-serif text-[32px] md:text-[40px] tracking-tight text-foreground">
                  Replies that actually sound human.
                </h3>
                <p className="mt-4 text-[16px] text-muted-foreground leading-relaxed max-w-[460px]">
                  The AI reads the actual content of each review — not just the star rating. A reviewer who mentions
                  the pasta gets a reply about the pasta.
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-surface rounded-[10px] border border-border p-4">
                  <div className="text-[11px] uppercase tracking-wider text-[#DC2626] mb-2">Generic</div>
                  <p className="text-[14px] text-muted-foreground line-through">
                    Thank you for your feedback! We appreciate your business.
                  </p>
                </div>
                <div className="bg-surface rounded-[10px] border-2 p-4" style={{ borderColor: "#16A34A" }}>
                  <div className="text-[11px] uppercase tracking-wider text-[#16A34A] mb-2">Specific</div>
                  <p className="text-[14px] text-foreground leading-relaxed">
                    Sarah, so glad Marco took good care of you — and that the truffle pasta lived up to the hype. We'll
                    save you a table for next time.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2: visual left */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="md:order-1 order-2">
                <ReviewPreviewCard
                  rating={1}
                  name="James K."
                  initialColor="#FECACA"
                  initialText="J"
                  date="yesterday"
                  borderColor="#DC2626"
                  text="Waited 40 minutes for a table we had reserved. Food was fine but the experience left a bad taste."
                  reply="James, I'm really sorry we kept you waiting — that's not the experience we want for anyone, especially with a reservation. I'd love to make it right. Could you email me directly at hello@osteria.com? — Marco, Owner"
                />
              </div>
              <div className="md:order-2 order-1">
                <div className="label-tiny text-accent mb-3">Hard reviews handled</div>
                <h3 className="font-serif text-[32px] md:text-[40px] tracking-tight text-foreground">
                  Built for 1-star reviews too.
                </h3>
                <p className="mt-4 text-[16px] text-muted-foreground leading-relaxed max-w-[460px]">
                  Negative reviews need the most attention and get the least. ReviewReply drafts calm, professional
                  responses that de-escalate and invite the customer to return.
                </p>
              </div>
            </div>

            {/* Feature 3: text left */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="label-tiny text-accent mb-3">Multi-location</div>
                <h3 className="font-serif text-[32px] md:text-[40px] tracking-tight text-foreground">
                  All your locations, one inbox.
                </h3>
                <p className="mt-4 text-[16px] text-muted-foreground leading-relaxed max-w-[460px]">
                  Own a restaurant group or a small chain? Connect every location and manage all reviews from a single
                  dashboard.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Osteria Marco — Downtown", count: "12 pending", color: "#FDE68A", initial: "O" },
                  { name: "Osteria Marco — Riverside", count: "4 pending", color: "#BBF7D0", initial: "O" },
                  { name: "Osteria Marco — Airport", count: "0 pending", color: "#BFDBFE", initial: "O" },
                ].map((loc) => (
                  <div
                    key={loc.name}
                    className="bg-surface rounded-[10px] border border-border p-4 flex items-center gap-3"
                  >
                    <div
                      className="w-9 h-9 rounded-md flex items-center justify-center font-semibold text-sm"
                      style={{ backgroundColor: loc.color, color: "#7c5a00" }}
                    >
                      {loc.initial}
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold text-foreground">{loc.name}</div>
                      <div className="text-[12px] text-muted-foreground">{loc.count}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-b border-border">
          <div className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
            <h2 className="font-serif text-[36px] md:text-[44px] text-foreground tracking-tight">Simple pricing</h2>
            <p className="mt-3 text-muted-foreground">One plan. Everything included. Cancel whenever.</p>

            <div className="mt-12 mx-auto max-w-[420px] bg-surface border border-border rounded-[12px] p-10 text-left shadow-sm">
              <div className="label-tiny text-accent">Growth</div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-serif text-[56px] leading-none text-foreground">$29</span>
                <span className="text-[16px] text-muted-foreground">/month</span>
              </div>
              <div className="mt-1 text-[13px] text-muted-foreground">per location · billed monthly</div>

              <ul className="mt-8 space-y-3">
                {[
                  "Unlimited AI-generated replies",
                  "Direct publish to Google",
                  "All star ratings handled",
                  "Tone customization (Professional / Friendly / Formal)",
                  "Multiple locations supported",
                  "New review notifications (coming soon)",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[15px] text-foreground">
                    <Check className="w-4 h-4 mt-1 text-accent shrink-0" strokeWidth={2.5} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button asChild className="mt-8 w-full h-12 text-[15px]">
                <Link to="/login">Start 7-day free trial</Link>
              </Button>
              <p className="mt-4 text-center text-[12px] text-muted-foreground">
                Cancel anytime from your dashboard. No hidden fees.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: "#141414" }} className="text-white">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div>
              <Logo variant="light" size={20} />
              <p className="mt-4 text-[14px] text-white/60 max-w-[260px]">Replies that sound like you.</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-white/70">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
              <a href="mailto:hello@reviewreply.app" className="hover:text-white">hello@reviewreply.app</a>
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
