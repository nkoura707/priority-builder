import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Star, Check, ArrowRight, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

const SmartDelayBadge = () => (
  <span
    className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
    style={{ backgroundColor: "hsl(var(--accent-light))", color: "hsl(var(--accent))" }}
  >
    SmartDelay™
  </span>
);

const ReviewPreviewCard = ({
  rating = 5,
  name = "Sandra L.",
  initialColor = "#FDE68A",
  initialText = "S",
  date = "3 days ago",
  text = "Best brunch in the neighborhood. The truffle pasta was incredible and our server Marco was so attentive. Already planning our next visit!",
  reply = "Sandra, thank you so much for the kind words! Marco will be thrilled to hear this — the truffle pasta is one of his favorites to recommend. We can't wait to welcome you back. — The Team",
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
        <SmartDelayBadge />
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

const useInView = <T extends HTMLElement>(threshold = 0.15) => {
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
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

/* Lightweight reveal-on-scroll wrapper. Pure CSS transition, no library. */
const Reveal = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => {
  const { ref, inView } = useInView<HTMLDivElement>(0.12);
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform] motion-reduce:transition-none",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className,
      )}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
};

const HeroHeadline = () => {
  const lines = [
    ["Most", "businesses", "lose", "customers"],
    ["before", "they", "ever", "walk", "in", "the", "door."],
  ];
  let idx = 0;
  return (
    <h1 className="font-serif text-[40px] leading-[1.05] md:text-[64px] md:leading-[1.02] text-foreground tracking-[-0.03em]">
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.map((w) => {
            const i = idx++;
            return (
              <span
                key={`${li}-${i}`}
                className="inline-block animate-in-up mr-[0.22em]"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {w}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
};

const Index = () => {
  const scrolled = useScrollPosition();
  const howRef = useInView<HTMLDivElement>();
  const pricingRef = useInView<HTMLDivElement>();
  const spotsTaken = 31;
  const spotsTotal = 50;
  const spotsLeft = spotsTotal - spotsTaken;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top announcement bar */}
      <div
        className="fixed top-0 inset-x-0 z-50 text-center text-[13px] py-1.5 px-4"
        style={{ backgroundColor: "#FEF2EC", color: "#92400E" }}
      >
        Founding rate ends at 50 businesses — Growth plan at $49/mo, locked for life · {spotsLeft} spots left
      </div>

      {/* Navbar */}
      <header
        className={cn(
          "fixed top-[30px] inset-x-0 z-40 transition-all duration-200 border-b",
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
              <Link to="/login">Start free — 14 days</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="pt-[94px]">
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
                The #1 thing losing you customers on Google — and it takes 2 minutes to fix
              </span>

              <HeroHeadline />

              <p
                className="mt-7 text-[19px] text-muted-foreground max-w-[540px] leading-[1.65] font-light animate-in-up"
                style={{ animationDelay: "550ms" }}
              >
                Every day, people search for a business like yours on Google. They read your reviews. Then they look to see if you respond to them. If you don't — most of them choose someone who does. ReviewReply makes sure there's always a reply, without you spending a minute on it.
              </p>

              <div className="mt-10 animate-in-up" style={{ animationDelay: "650ms" }}>
                <Button asChild size="lg" className="group h-12 px-8 text-[15px]">
                  <Link to="/login">
                    See how it works — free for 14 days
                    <ArrowRight size={16} className="arrow-nudge" />
                  </Link>
                </Button>
                <div className="mt-3 text-[13px] text-muted-foreground">
                  No credit card · No contracts · Takes 4 minutes to set up
                </div>
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
                  rating={2}
                  name="Tom B."
                  initialColor="#FECACA"
                  initialText="T"
                  date="yesterday"
                  borderColor="hsl(var(--danger))"
                  text="Waited 40 minutes for a table we had reserved. Food was fine but the experience left a bad taste."
                  reply="Tom, I'm really sorry we kept you waiting — that's not the experience we want for anyone. I'd love to make it right. Could you email me directly? — Marco, Owner"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 1 — The Revelation */}
        <section className="border-b border-border bg-surface">
          <div className="max-w-3xl mx-auto px-6 py-24 md:py-32">
            <Reveal>
              <p className="font-serif text-[28px] md:text-[36px] text-foreground tracking-[-0.02em] leading-[1.2] text-center italic">
                "What happens when a customer leaves you a review and you don't reply?"
              </p>
            </Reveal>
            <div className="mt-12 space-y-5 text-[17px] text-foreground/80 leading-[1.75]">
              <Reveal delay={80}>
                <p className="border-l-2 border-border pl-5">
                  Most business owners assume the answer is: <span className="font-semibold text-foreground">nothing</span>. The review sits there, people read it, life goes on.
                </p>
              </Reveal>
              <Reveal delay={140}>
                <p className="border-l-2 border-accent/60 pl-5 bg-accent-light/40 py-4 rounded-r-md">
                  But here's what actually happens. When a potential customer finds your business on Google, they don't just read the reviews — <span className="font-semibold text-foreground">they scroll down to see how you responded to them</span>. A business with 4.6 stars and thoughtful replies to every review looks fundamentally different from a business with the same 4.6 stars and silence. One looks like a business that cares about its customers. The other looks like no one's home.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <p className="border-l-2 border-border pl-5">
                  That gap — between replying and not replying — is <span className="font-semibold text-foreground">costing real businesses real revenue</span>. Quietly. Every week.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Section 2 — The Numbers */}
        <section className="border-b border-border bg-muted-bg">
          <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
            <div className="label-tiny text-accent mb-3">What the research actually shows</div>
            <h2 className="font-serif text-[36px] md:text-[44px] text-foreground tracking-[-0.02em] leading-[1.05] max-w-[680px] mb-12">
              The numbers behind unanswered reviews.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  stat: "18% more revenue",
                  body: "Businesses that consistently respond to all their Google reviews — positive and negative — earn an average of 18% more revenue than those that don't. This isn't a marginal difference. It compounds over months.",
                  source: "Harvard Business School / LocaliQ",
                },
                {
                  stat: "97% of people read your responses",
                  body: "Nearly every person who reads a review on your Google profile also reads the business's reply — if there is one. A well-written response to a 1-star review can actually bring in new customers who were impressed by how you handled it.",
                  source: "ReviewTrackers, 2026",
                },
                {
                  stat: "A 1-star increase = 5–9% revenue growth",
                  body: "For every half-star improvement in your overall Google rating — driven partly by how actively you engage with reviewers — a business can see a 5 to 9% increase in revenue. For a business doing $500K a year, that's $25,000–$45,000.",
                  source: "Harvard Business School",
                },
                {
                  stat: "53% expect a reply within one week",
                  body: "More than half of customers who leave a negative review expect a response within seven days. Most businesses take weeks. Or never respond. The ones that reply fast build a reputation for actually caring — which shows up in their star rating over time.",
                  source: "BrightLocal, 2025",
                },
              ].map((card, i) => {
                // Split the leading number/percentage from the rest of the headline for visual emphasis.
                const match = card.stat.match(/^([^\s]+)\s+(.*)$/);
                const lead = match ? match[1] : card.stat;
                const rest = match ? match[2] : "";
                return (
                  <Reveal key={card.stat} delay={i * 90}>
                    <div className="group bg-surface border border-border rounded-xl p-7 hover-lift hover:border-accent/60 transition-colors h-full">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-serif text-[40px] md:text-[48px] leading-none text-accent tracking-[-0.03em]">
                          {lead}
                        </span>
                        {rest && (
                          <span className="font-serif text-[18px] md:text-[20px] text-foreground tracking-[-0.01em] leading-tight">
                            {rest}
                          </span>
                        )}
                      </div>
                      <div className="mt-5 h-px w-10 bg-accent/40 group-hover:w-16 transition-all duration-300" />
                      <p className="mt-5 text-[14px] text-muted-foreground leading-[1.7]">{card.body}</p>
                      <p className="mt-4 text-[12px] italic text-foreground/50">Source: {card.source}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            <Reveal delay={120}>
              <p className="mt-14 text-center text-[16px] italic text-foreground/70 max-w-[640px] mx-auto leading-[1.7]">
                None of this requires better service, lower prices, or more advertising. It just requires showing up in the conversation your customers are already having about you.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Section 3 — The Problem in Plain Terms */}
        <section className="border-b border-border bg-surface">
          <div className="max-w-5xl mx-auto px-6 py-24 md:py-32">
            <Reveal>
              <h2 className="font-serif text-[32px] md:text-[40px] text-foreground tracking-[-0.02em] leading-[1.15] max-w-[760px]">
                The problem isn't that owners don't care. It's that <span className="text-accent">replying to reviews is genuinely hard to keep up with</span>.
              </h2>
            </Reveal>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  n: "01",
                  body: "A new review comes in. You mean to reply. Something else needs your attention first. By the time you circle back, three more reviews have arrived, you don't know where to start, and the task feels bigger than it is. So it waits. And waits.",
                },
                {
                  n: "02",
                  body: "Even owners who do reply face a different problem: knowing what to say. A 5-star review is easy. A 3-star review with a vague complaint about \"the atmosphere\" is harder. A 1-star review from a customer who you know had an unreasonable experience — that one can take 20 minutes to write and still feel wrong.",
                },
                {
                  n: "03",
                  body: "What most businesses need isn't motivation. It's a system that handles this without them having to think about it.",
                },
              ].map((p, i) => (
                <Reveal key={p.n} delay={i * 90}>
                  <div className="h-full bg-muted-bg/60 border border-border rounded-xl p-6 hover-lift hover:border-accent/50 transition-colors">
                    <div className="font-serif text-[28px] leading-none text-accent/70 tracking-[-0.02em]">{p.n}</div>
                    <p className="mt-4 text-[15px] text-foreground/80 leading-[1.7]">{p.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4 — Solution */}
        <section className="border-b border-border bg-muted-bg">
          <div className="max-w-3xl mx-auto px-6 py-24 md:py-32">
            <Reveal>
              <div className="label-tiny text-accent mb-3">What ReviewReply does</div>
              <h2 className="font-serif text-[32px] md:text-[44px] text-foreground tracking-[-0.02em] leading-[1.1]">
                Every review gets a reply. You set it up once.
              </h2>
            </Reveal>
            <div className="mt-8 space-y-5 text-[16px] text-foreground/80 leading-[1.75]">
              <Reveal delay={80}>
                <p>
                  ReviewReply connects to your Google Business Profile and watches for new reviews as they come in. For each one, it reads the actual content of what the customer wrote — <span className="font-semibold text-foreground">the specific complaint, the specific compliment, the specific detail</span> — and writes a reply that addresses it directly.
                </p>
              </Reveal>
              <Reveal delay={140}>
                <p>
                  Not a template. Not "Thank you for your review, we appreciate your feedback." <span className="font-semibold text-foreground">A reply that reads like a person who actually read what the customer said and took it seriously.</span>
                </p>
              </Reveal>
              <Reveal delay={200}>
                <p className="font-serif italic text-[22px] md:text-[26px] text-foreground tracking-[-0.01em] leading-snug pt-2">
                  Then — and this is important — <span className="text-accent">it waits.</span>
                </p>
              </Reveal>
            </div>

            {/* Callout box */}
            <Reveal delay={120}>
              <div
                className="mt-10 rounded-xl p-6 md:p-7 hover-lift transition-all"
                style={{ backgroundColor: "#FEF2EC", border: "1px solid #F5C4A0" }}
              >
                <div className="text-[14px] font-semibold text-foreground mb-2">Why the wait matters:</div>
                <p className="text-[15px] text-foreground/80 leading-[1.7]">
                  Automated review tools that post instantly are increasingly recognized as bots. <span className="font-semibold text-foreground">46% of consumers say they can identify an AI-generated response by how fast it appears.</span> ReviewReply holds every reply for 2–6 hours and posts during normal business hours — so every response looks like it came from a person who took a moment to think about it. We call this <span className="font-semibold text-accent">SmartDelay™</span>. No competitor at our price point has it.
                </p>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <p className="mt-8 text-[16px] text-foreground/80 leading-[1.75]">
                After the wait, the reply posts to Google automatically. If you want to review or edit the draft before it goes out, it's in your dashboard. <span className="font-semibold text-foreground">You have the final say on everything.</span>
              </p>
            </Reveal>
          </div>
        </section>

        {/* Section 5 — How it works */}
        <section ref={howRef.ref} className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
            <div className="label-tiny text-accent mb-3">Four minutes to set up. Then it runs itself.</div>
            <h2 className="font-serif text-[36px] md:text-[44px] text-foreground tracking-[-0.02em] leading-[1.05] max-w-[640px]">
              How ReviewReply works.
            </h2>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 relative">
              {[
                {
                  n: "01",
                  t: "Connect your Google Business Profile",
                  d: "One-time authorization. ReviewReply syncs with your profile and starts pulling in reviews immediately.",
                },
                {
                  n: "02",
                  t: "AI reads and writes",
                  d: "Each review gets a unique reply written around what the customer actually said. Positive reviews get genuine gratitude. Negative reviews get a calm, professional response that acknowledges the issue and invites resolution. Rating-only reviews get a short, appropriate acknowledgment.",
                },
                {
                  n: "03",
                  t: "SmartDelay™ posts at the right time",
                  d: "Your reply goes into a queue. ReviewReply posts it 2–6 hours later, during business hours, so it lands naturally. Your dashboard shows every reply before and after it posts — you're always in the loop.",
                },
              ].map((s, i) => (
                <div
                  key={s.n}
                  className={cn("relative", howRef.inView && "animate-in-up")}
                  style={howRef.inView ? { animationDelay: `${i * 120}ms` } : { opacity: 0 }}
                >
                  {i < 2 && (
                    <div className="hidden md:block absolute top-7 left-[64px] right-[-12px] border-t border-dashed border-border-strong" />
                  )}
                  <div className="relative bg-surface border border-border rounded-xl p-6 hover-lift hover:border-accent/50 transition-colors h-full">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-accent-light text-accent flex items-center justify-center font-serif text-[22px] tracking-[-0.02em] border border-accent/20 shrink-0">
                        {s.n}
                      </div>
                      <h3 className="text-[16px] font-semibold text-foreground leading-snug">{s.t}</h3>
                    </div>
                    <p className="mt-5 text-[14px] text-muted-foreground leading-[1.7]">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-14">
              <Button asChild size="lg" className="h-12 px-8 text-[15px]">
                <Link to="/login">
                  Start free for 14 days — no card needed
                  <ArrowRight size={16} className="arrow-nudge ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 6 — Review Generation */}
        <section className="border-b border-border bg-surface">
          <div className="max-w-3xl mx-auto px-6 py-24 md:py-32">
            <div className="label-tiny text-accent mb-3">The other half of a strong review profile</div>
            <h2 className="font-serif text-[32px] md:text-[44px] text-foreground tracking-[-0.02em] leading-[1.1]">
              More good reviews — without asking your customers in person.
            </h2>
            <div className="mt-8 space-y-6 text-[16px] text-foreground/80 leading-[1.75]">
              <p>
                Responding to reviews improves your reputation with the customers you already have. Generating new ones builds your profile for customers you haven't met yet.
              </p>
              <p>
                With ReviewReply's review generation feature, you can send a simple one-tap review request to any customer — by SMS or email. They receive a message, tap a link, land directly on your Google review page, and leave a review in under 30 seconds. No app to download. No account to create. No friction.
              </p>
              <div
                className="rounded-xl p-6 mt-2"
                style={{ backgroundColor: "#FEF2EC", border: "1px solid #F5C4A0" }}
              >
                <div className="text-[14px] font-semibold text-foreground mb-2">Why this matters:</div>
                <p className="text-[15px] text-foreground/80 leading-[1.7]">
                  Businesses with 200 or more Google reviews earn twice the revenue of businesses with fewer reviews — on average. Not because their service is twice as good. Because their reputation is twice as visible. The businesses dominating local search in your area aren't just better than you. They have a system for collecting reviews consistently. Now you do too.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7 — Features grid */}
        <section className="border-b border-border bg-muted-bg">
          <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
            <div className="label-tiny text-accent mb-3">What you get</div>
            <h2 className="font-serif text-[36px] md:text-[44px] text-foreground tracking-[-0.02em] leading-[1.05] max-w-[680px] mb-12">
              Everything you need. Nothing you don't.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  label: "Negative reviews handled right",
                  body: "1-star reviews are the ones that matter most — to potential customers reading them and to your overall rating. ReviewReply is specifically trained to write calm, non-defensive responses that acknowledge what went wrong and invite the customer to return. No templates. No corporate non-answers.",
                },
                {
                  label: "Your tone, consistently",
                  body: "Choose professional, friendly, or formal. Your replies stay consistent with your brand voice across every review, every location, every time — without you having to rewrite anything.",
                },
                {
                  label: "All your locations, one place",
                  body: "Whether you have one location or ten, every review inbox is managed from a single dashboard. Each location can have its own tone and auto-reply settings. New locations added any time.",
                },
                {
                  label: "Always in control",
                  body: "Every reply is a draft first. Edit it, rewrite it, or skip it entirely before SmartDelay posts it. Most owners stop checking after the first few weeks because the quality holds up — but the control is always there.",
                },
              ].map((cell, i) => (
                <Reveal key={cell.label} delay={i * 80}>
                  <div className="group h-full bg-surface border border-border rounded-xl p-7 hover-lift hover:border-accent/60 transition-colors relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent scale-y-0 origin-top group-hover:scale-y-100 transition-transform duration-300" />
                    <div className="flex items-center gap-2 mb-3">
                      <Check size={14} className="text-accent" />
                      <div className="label-tiny text-accent">{cell.label}</div>
                    </div>
                    <p className="text-[15px] text-foreground/80 leading-[1.7]">{cell.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Section 8 — Social Proof */}
        <section className="border-b border-border bg-surface">
          <div className="max-w-4xl mx-auto px-6 py-24 md:py-32">
            <blockquote className="font-serif text-[26px] md:text-[34px] text-foreground tracking-[-0.02em] leading-[1.3] text-center italic">
              "I genuinely didn't know that not replying to reviews was costing me customers. I thought it was just good practice. Turns out it's a revenue issue. ReviewReply fixed it in one afternoon."
            </blockquote>
            <div className="mt-6 text-center text-[13px] text-muted-foreground">
              — Owner, Restaurant · Austin, TX
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  q: "The replies don't sound like a robot wrote them. A regular customer actually commented that she appreciated how I'd responded to a bad review — she thought I'd written it myself.",
                  a: "Owner, Hair Salon",
                },
                {
                  q: "I manage three locations. Before this, reviews just piled up. Now it's one less thing I have to worry about, and all three profiles look active and engaged.",
                  a: "Operator, Multi-location Café",
                },
              ].map((t, i) => (
                <Reveal key={t.a} delay={i * 100}>
                  <div className="h-full bg-muted-bg border border-border rounded-xl p-6 hover-lift hover:border-accent/40 transition-colors">
                    <p className="text-[15px] text-foreground/80 leading-[1.7] italic">"{t.q}"</p>
                    <div className="mt-4 text-[12px] text-muted-foreground">— {t.a}</div>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mt-14 flex flex-col sm:flex-row items-stretch justify-center gap-4 sm:gap-3 text-center">
              {[
                { n: "12,000+", l: "reviews replied to" },
                { n: "4.9 / 5", l: "from owners" },
                { n: "12+", l: "business categories" },
              ].map((s, i) => (
                <Reveal key={s.l} delay={i * 100} className="flex-1">
                  <div className="px-6 py-5 rounded-xl border border-border bg-surface hover:border-accent/40 hover-lift transition-colors h-full">
                    <div className="font-serif text-[32px] leading-none text-accent tracking-[-0.02em]">{s.n}</div>
                    <div className="mt-2 text-[13px] text-muted-foreground">{s.l}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <PricingSection inView={pricingRef.inView} sectionRef={pricingRef.ref} />

        {/* Section 10 — FAQ */}
        <section className="border-b border-border bg-surface">
          <div className="max-w-3xl mx-auto px-6 py-24 md:py-32">
            <h2 className="font-serif text-[36px] md:text-[44px] text-foreground tracking-[-0.02em] leading-[1.05] mb-10">
              Questions worth answering properly.
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  q: "I didn't know not responding to reviews was a real problem — how much does it actually matter?",
                  a: "More than most owners realize. Research from Harvard Business School shows that businesses with consistent review responses earn 18% more revenue on average. 97% of people who read a review also read the business's responses — if there are any. And when there aren't, they notice. It's not that unanswered reviews hurt your rating directly — it's that they signal to potential customers that no one is paying attention. ReviewReply fixes that signal without you having to do anything.",
                },
                {
                  q: "Will the replies actually sound like they came from me — or will customers know it's automated?",
                  a: "Two things prevent the \"obviously automated\" feeling. First, the AI reads each review individually and responds to what the customer actually wrote — not a generic template. Second, SmartDelay™ holds every reply for 2–6 hours before posting, during business hours. Replies that post instantly at 2:47am read like a bot. Replies that post at 10:30am on a Tuesday read like a person. Most customers won't know. Some of yours will mention that they appreciated your response — because it sounds like you meant it.",
                },
                {
                  q: "What happens if I disagree with what the AI wrote?",
                  a: "Every reply is a draft in your dashboard before it posts. You can edit the wording, change the tone entirely, or delete the reply and write your own. The draft sits there during the SmartDelay window — you have time to review it before anything goes live. You're never locked out of the process.",
                },
                {
                  q: "Does this work for businesses that get a lot of reviews — or only a few?",
                  a: "Both. If you get 200 reviews a month, the automation handles all of them without you spending hours you don't have. If you get 10 reviews a month, each one still gets the same quality reply it would if you'd written it yourself — just without the time investment. The value scales with your review volume.",
                },
                {
                  q: "What if I want to cancel?",
                  a: "Settings → Billing → Cancel subscription. No phone call. No retention screen. No 90-day notice window. If you cancel, your subscription ends at the end of the current billing period. Your data is yours. We'd rather earn your subscription every month than trap you in one.",
                },
                {
                  q: "How is this different from just using ChatGPT to write replies?",
                  a: "ChatGPT requires you to: notice a new review, copy the text, open ChatGPT, write a prompt explaining your business and tone, generate the reply, read it, copy it, go back to Google, find the review, paste the reply, and hit publish — every single time, for every single review, indefinitely. ReviewReply does all of that automatically, posts during business hours so it looks human, and sends review requests to new customers so your profile keeps growing. It's not a tool you use. It's a system that works while you're not thinking about it.",
                },
              ].map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-border">
                  <AccordionTrigger className="text-left text-[16px] font-semibold text-foreground hover:no-underline py-5">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-[15px] text-foreground/75 leading-[1.75] pb-5">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-b border-border bg-muted-bg">
          <div className="max-w-3xl mx-auto px-6 py-24 md:py-32 text-center">
            <h2 className="font-serif text-[34px] md:text-[48px] text-foreground tracking-[-0.02em] leading-[1.1]">
              The businesses winning on Google aren't doing more work than you.
              <span className="block mt-2">They just have a better system.</span>
            </h2>
            <div className="mt-10 space-y-5 text-[16px] text-foreground/80 leading-[1.75] text-left max-w-[640px] mx-auto">
              <p>
                Every search someone does for a business like yours ends at a Google profile. They read the reviews. They look for replies. They make a decision — usually in under two minutes — based on what they find.
              </p>
              <p>ReviewReply makes sure that what they find looks like a business that pays attention.</p>
              <p>Set it up in 4 minutes today. Your first reply generates automatically.</p>
            </div>
            <div className="mt-10">
              <Button asChild size="lg" className="h-12 px-8 text-[15px]">
                <Link to="/login">
                  Start free — 14 days, no card needed
                  <ArrowRight size={16} className="arrow-nudge ml-1" />
                </Link>
              </Button>
              <div className="mt-3 text-[13px] text-muted-foreground">
                No credit card required to start. Cancel any time.
              </div>
              <div className="mt-6 inline-block text-[13px] font-medium px-3 py-1.5 rounded-full" style={{ backgroundColor: "#FEF2EC", color: "#92400E" }}>
                Founding rate: {spotsLeft} of {spotsTotal} spots remaining — $49/month, locked for life
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
              <p className="mt-4 text-[14px] text-white/60 max-w-[260px]">Your reputation, always on.</p>
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

/* ---------------- Pricing Section ---------------- */

type Plan = {
  id: "starter" | "growth" | "agency";
  name: string;
  monthly: number;
  originalMonthly?: number;
  yearly: number;
  yearlyTotal: number;
  subtitle: string;
  description: string;
  features: string[];
  unavailable?: string[];
  featured?: boolean;
  ctaLabel: string;
  ctaVariant: "default" | "outline";
  ctaSubline?: string;
  badge?: string;
};

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthly: 39,
    yearly: 32,
    yearlyTotal: 384,
    subtitle: "1 location · month to month",
    description: "For owners who want the AI to draft replies, with manual approval before posting.",
    features: [
      "Unlimited AI-generated replies",
      "Review inbox — you approve before posting",
      "3 tone presets",
      "14-day free trial — no card needed",
    ],
    unavailable: ["SmartDelay auto-posting", "Review generation", "Multiple locations"],
    ctaLabel: "Start free →",
    ctaVariant: "outline",
  },
  {
    id: "growth",
    name: "Growth",
    monthly: 49,
    originalMonthly: 69,
    yearly: 41,
    yearlyTotal: 492,
    subtitle: "Up to 3 locations · month to month",
    description: "The fully automated option. Set it up and let it run.",
    features: [
      "Everything in Starter",
      "SmartDelay™ — posts at human timing, no input needed",
      "Review generation — request reviews via SMS and email",
      "Up to 3 locations",
      "Auto-reply scope: all reviews / 4★+ only / 5★ only",
      "Hourly review sync",
      "14-day free trial — no card needed",
    ],
    featured: true,
    ctaLabel: "Start free — founding rate →",
    ctaVariant: "default",
    ctaSubline: "The founding rate locks the moment you subscribe. It doesn't change.",
    badge: "31 founding spots left",
  },
  {
    id: "agency",
    name: "Agency",
    monthly: 149,
    yearly: 124,
    yearlyTotal: 1488,
    subtitle: "Unlimited locations · month to month",
    description: "For agencies and groups managing multiple Google Business Profiles.",
    features: [
      "Everything in Growth",
      "Unlimited locations",
      "Per-location tone and auto-reply settings",
      "Priority support",
      "Onboarding call included",
    ],
    ctaLabel: "Start free →",
    ctaVariant: "outline",
  },
];

const PricingSection = ({
  inView,
  sectionRef,
}: {
  inView: boolean;
  sectionRef: React.RefObject<HTMLDivElement>;
}) => {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [compareOpen, setCompareOpen] = useState(false);
  const spotsTaken = 31;
  const spotsTotal = 50;
  const spotsLeft = spotsTotal - spotsTaken;

  return (
    <section ref={sectionRef} className="border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
        <div className="text-center">
          <div className="label-tiny text-accent mb-3">Pricing</div>
          <h2 className="font-serif text-[40px] md:text-[48px] text-foreground tracking-[-0.02em] leading-[1.05]">
            Clear pricing. No contracts. No surprises.
          </h2>
        </div>

        {/* Founding member banner */}
        <div
          className="mt-10 mx-auto max-w-3xl rounded-[10px] px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ backgroundColor: "#FEF2EC", border: "1px solid #F5C4A0" }}
        >
          <div>
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-accent mb-1">
              Founding member rate — still available
            </span>
            <div className="text-[15px] font-semibold text-foreground leading-snug">
              Growth plan at $49/month — permanently
            </div>
            <div className="text-[13px] text-muted-foreground mt-1 max-w-[440px]">
              The first {spotsTotal} businesses to join ReviewReply lock in this rate forever — regardless of future pricing changes or feature additions. {spotsLeft} of those spots are still available.
            </div>
          </div>
          <div className="sm:text-right shrink-0 sm:min-w-[160px]">
            <div className="text-[12px] font-medium text-foreground mb-1.5">
              {spotsLeft} of {spotsTotal} spots remaining
            </div>
            <div className="h-1.5 w-full sm:w-[160px] bg-white/70 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(spotsTaken / spotsTotal) * 100}%`,
                  backgroundColor: "#CD5A20",
                }}
              />
            </div>
          </div>
        </div>

        {/* Billing toggle */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center gap-1 bg-muted-bg rounded-lg p-1 border border-border">
            {(["monthly", "yearly"] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                className={cn(
                  "h-8 px-4 rounded-md text-[13px] font-medium transition-colors",
                  billing === b
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {b === "monthly" ? "Monthly" : "Yearly — save 17%"}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan, i) => {
            const price = billing === "monthly" ? plan.monthly : plan.yearly;
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-xl bg-surface p-7 transition-all",
                  plan.featured
                    ? "border-2 shadow-lg md:-translate-y-2"
                    : "border border-border hover-lift",
                  inView && "animate-in-up",
                )}
                style={{
                  borderColor: plan.featured ? "#CD5A20" : undefined,
                  animationDelay: inView ? `${i * 100}ms` : undefined,
                }}
              >
                {plan.featured && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full text-white whitespace-nowrap"
                    style={{ backgroundColor: "#CD5A20" }}
                  >
                    Most popular
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div className="label-tiny text-accent">{plan.name}</div>
                  {plan.badge && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: "hsl(var(--accent-light))", color: "hsl(var(--accent))" }}>
                      {plan.badge}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                  {plan.originalMonthly && billing === "monthly" && (
                    <span className="font-serif text-[24px] leading-none text-muted-foreground/60 line-through">
                      ${plan.originalMonthly}
                    </span>
                  )}
                  <span className="font-serif text-[48px] leading-none text-foreground tracking-[-0.03em]">
                    ${price}
                  </span>
                  <span className="text-[15px] text-muted-foreground">/mo</span>
                  {billing === "yearly" && (
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "hsl(var(--success-light))", color: "hsl(var(--success))" }}
                    >
                      Save 17%
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[13px] text-muted-foreground">
                  {billing === "yearly"
                    ? `billed as $${plan.yearlyTotal.toLocaleString()}/year`
                    : plan.subtitle}
                </div>
                <p className="mt-4 text-[13px] text-foreground/70 leading-relaxed min-h-[40px]">
                  {plan.description}
                </p>

                <ul className="mt-5 space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px] text-foreground">
                      <Check className="w-4 h-4 mt-0.5 text-accent shrink-0" strokeWidth={2.5} />
                      <span>{f}</span>
                    </li>
                  ))}
                  {plan.unavailable?.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px] text-muted-foreground/60">
                      <span className="w-4 mt-0.5 shrink-0 text-center font-medium">—</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Button asChild variant={plan.ctaVariant} className="w-full h-11 text-[14px]">
                    <Link to="/login">{plan.ctaLabel}</Link>
                  </Button>
                  {plan.ctaSubline && (
                    <p className="mt-2 text-center text-[11px] italic text-muted-foreground leading-snug">
                      {plan.ctaSubline}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Annual + guarantee */}
        <div className="mt-10 text-center space-y-2 text-[13px] text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Annual option:</span> Save 17% — pay yearly, get 2 months free. Starter $32/mo · Growth $41/mo · Agency $124/mo
          </p>
          <p>🔒 30-day money-back guarantee on all plans · No annual contracts · Cancel any time from your dashboard</p>
        </div>

        {/* Competitor comparison */}
        <div className="mt-10 max-w-3xl mx-auto">
          <button
            type="button"
            onClick={() => setCompareOpen((v) => !v)}
            className="mx-auto flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            How does ReviewReply compare to other tools?
            <ChevronDown size={14} className={cn("transition-transform", compareOpen && "rotate-180")} />
          </button>
          {compareOpen && (
            <div className="mt-5 border border-border rounded-lg overflow-hidden bg-surface animate-in-fade">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-muted-bg text-muted-foreground">
                    <th className="text-left px-4 py-2.5 font-medium"></th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ backgroundColor: "#FEF2EC", color: "hsl(var(--accent))" }}>
                      ReviewReply
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium">Birdeye</th>
                    <th className="text-left px-4 py-2.5 font-medium">Podium</th>
                    <th className="text-left px-4 py-2.5 font-medium">NiceJob</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { row: "Starting price", us: "$39/mo", b: "$349+/mo", p: "$249+/mo", n: "$75/mo" },
                    { row: "Auto-reply with timing delay", us: "✓", b: "✗", p: "✗", n: "✗" },
                    { row: "Review generation", us: "✓", b: "✓", p: "✓", n: "✓" },
                    { row: "Month-to-month billing", us: "✓", b: "✗ Annual only", p: "✗ Annual only", n: "✓" },
                    { row: "No setup fee", us: "✓", b: "✗", p: "✗", n: "✓" },
                    { row: "Setup time", us: "4 minutes", b: "Days + onboarding", p: "Days + onboarding", n: "~1 hour" },
                  ].map((r) => (
                    <tr key={r.row} className="border-t border-border">
                      <td className="px-4 py-2.5 font-medium text-foreground/80">{r.row}</td>
                      <td className="px-4 py-2.5 font-semibold text-foreground" style={{ backgroundColor: "#FEF2EC" }}>{r.us}</td>
                      <td className="px-4 py-2.5 text-foreground/80">{r.b}</td>
                      <td className="px-4 py-2.5 text-foreground/80">{r.p}</td>
                      <td className="px-4 py-2.5 text-foreground/80">{r.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-4 py-3 text-[12px] text-muted-foreground italic border-t border-border">
                Birdeye starts at $349/month and requires an annual contract. Podium starts at $249/month with the same lock-in. ReviewReply is month-to-month at any time and has no setup fee.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Index;
