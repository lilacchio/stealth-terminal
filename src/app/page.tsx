import Link from "next/link";
import {
  Shield,
  Lock,
  Search,
  Zap,
  ArrowRight,
  Eye,
  EyeOff,
  Server,
  Wallet,
  TrendingUp,
  ArrowLeftRight,
  Bot,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-16 space-y-16 sm:space-y-24">
        {/* Hero */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-terminal text-xs font-mono">
            <Shield className="h-4 w-4" />
            <span>{">"} STEALTH_TERMINAL v1.0</span>
            <span className="cursor-blink">_</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
            your trading research
            <br />
            <span className="text-terminal">nobody else&apos;s business</span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
            You ask ChatGPT about a token, that query sits on their server in
            plain text. They know what you&apos;re buying before you do. StealthTerminal
            encrypts your prompts on your machine with Arcium RescueCipher, runs
            them inside a TEE, and sends back encrypted results. The backend
            can&apos;t read your questions. Not &quot;won&apos;t&quot;. Can&apos;t.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/agent"
              className="inline-flex items-center gap-2 bg-terminal text-background px-5 py-2.5 text-xs font-bold tracking-wide hover:bg-terminal/90 transition-colors rounded"
            >
              start researching
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 border border-border text-muted-foreground px-5 py-2.5 text-xs font-bold tracking-wide hover:text-foreground hover:border-foreground/20 transition-colors rounded"
            >
              browse tokens
            </Link>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-muted-foreground/70 pt-2">
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3" /> Arcium RescueCipher
            </span>
            <span className="flex items-center gap-1">
              <Server className="h-3 w-3" /> TEE-isolated inference
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" /> 5 AI models
            </span>
            <span className="flex items-center gap-1">
              <Search className="h-3 w-3" /> live on-chain data
            </span>
          </div>
        </section>

        {/* The problem */}
        <section className="space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            why this matters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-red-500/20 bg-red-500/5 p-4 sm:p-5 rounded space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-red-400" />
                <span className="text-xs font-bold text-red-400">what happens now</span>
              </div>
              <ul className="space-y-2 text-[11px] text-muted-foreground leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-red-400 shrink-0">✗</span>
                  You ask about a token, the provider logs it
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400 shrink-0">✗</span>
                  Your whole strategy sits in someone else&apos;s database
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400 shrink-0">✗</span>
                  Anyone with db access knows your next move
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400 shrink-0">✗</span>
                  One breach and your research history is public
                </li>
              </ul>
            </div>

            <div className="border border-terminal/20 bg-terminal/5 p-4 sm:p-5 rounded space-y-3">
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-terminal" />
                <span className="text-xs font-bold text-terminal">what we do instead</span>
              </div>
              <ul className="space-y-2 text-[11px] text-muted-foreground leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-terminal shrink-0">✓</span>
                  Your prompt gets encrypted before it leaves your browser
                </li>
                <li className="flex gap-2">
                  <span className="text-terminal shrink-0">✓</span>
                  Runs inside a TEE, isolated from everyone including us
                </li>
                <li className="flex gap-2">
                  <span className="text-terminal shrink-0">✓</span>
                  SolRouter themselves can&apos;t read your queries
                </li>
                <li className="flex gap-2">
                  <span className="text-terminal shrink-0">✓</span>
                  Every response comes with a privacy attestation you can verify
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            how it works
          </h2>

          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                {
                  step: "01",
                  title: "you type a query",
                  desc: "\"Is BONK a rug?\" Just text sitting on your machine, nothing sent yet.",
                  icon: Bot,
                },
                {
                  step: "02",
                  title: "arcium encrypts it",
                  desc: "RescueCipher kicks in client-side. What hits the server is gibberish.",
                  icon: Lock,
                },
                {
                  step: "03",
                  title: "TEE processes it",
                  desc: "SolRouter runs it in an isolated enclave. Their own team can't see what's inside.",
                  icon: Server,
                },
                {
                  step: "04",
                  title: "you get the answer",
                  desc: "Response comes back encrypted, decrypted on your device. Plus an attestation ID as proof.",
                  icon: Shield,
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="border border-border bg-card p-4 rounded space-y-2 relative"
                >
                  <div className="text-[10px] text-terminal font-mono">{s.step}</div>
                  <s.icon className="h-4 w-4 text-terminal" />
                  <div className="text-xs font-bold text-foreground">{s.title}</div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    {s.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground bg-card border border-border p-3 rounded font-mono">
            <span className="text-terminal">$</span> clearSession() → new SolRouter(&#123; encrypted: true &#125;) → client.chat(prompt) → attestationId ✓
          </div>
        </section>

        {/* Features */}
        <section className="space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            what you get
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FeatureCard
              icon={Bot}
              title="encrypted AI agent"
              href="/agent"
              desc="5 models to pick from. Arcium encryption on every message. Live search grabs real-time data without anyone knowing what you searched for."
            />
            <FeatureCard
              icon={TrendingUp}
              title="token dashboard"
              href="/dashboard"
              desc="Trending tokens, new pairs, search. Risk scores on every card based on liquidity, sell pressure, age, volume weirdness. One click for encrypted AI deep-dive."
            />
            <FeatureCard
              icon={ArrowLeftRight}
              title="swap quotes"
              href="/quotes"
              desc="Jupiter quotes with route breakdowns, price impact, slippage settings. Ask the AI if the swap makes sense, then execute directly on Jupiter."
            />
            <FeatureCard
              icon={Wallet}
              title="portfolio scanner"
              href="/portfolio"
              desc="Paste any wallet address. See all holdings, USD values, allocation chart. Send the whole thing to the encrypted agent for risk analysis in one click."
            />
          </div>
        </section>

        {/* SDK integration depth */}
        <section className="space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            solrouter SDK integration
          </h2>

          <div className="border border-border bg-card rounded overflow-hidden divide-y divide-border">
            {[
              {
                label: "encrypted inference",
                detail: "Every AI call goes through SolRouter({ encrypted: true }) with Arcium RescueCipher. On by default, not an afterthought.",
              },
              {
                label: "TEE session mgmt",
                detail: "We call clearSession() before each request. Without this, concurrent conversations break because of shared encryption state.",
              },
              {
                label: "multi-model routing",
                detail: "GPT-OSS 20B, Qwen3 8B, Gemini Flash, Claude Sonnet, GPT-4o Mini. Switch models per query depending on what you need.",
              },
              {
                label: "live search + encryption",
                detail: "SolRouter's live search requires encryption. We figured that out the hard way and now auto-force it when you toggle live search on.",
              },
              {
                label: "privacy attestation",
                detail: "Every single response has an attestation ID that proves it went through the TEE. We show it right next to each message.",
              },
              {
                label: "balance tracking",
                detail: "Your USDC balance from getBalance(), refreshed on every page switch and after each query so you always know where you stand.",
              },
            ].map((item) => (
              <div key={item.label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 py-3">
                <span className="text-xs font-bold text-terminal font-mono shrink-0 w-48">
                  {item.label}
                </span>
                <span className="text-[11px] text-muted-foreground leading-relaxed">
                  {item.detail}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Tech stack */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            built with
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              "Next.js 16",
              "TypeScript",
              "Tailwind v4",
              "@solrouter/sdk",
              "Arcium RescueCipher",
              "@solana/web3.js",
              "Jupiter API",
              "DexScreener API",
              "shadcn/ui",
            ].map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-1 text-[10px] font-mono border border-border text-muted-foreground rounded"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border pt-8 sm:pt-12 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">
            keep your research to yourself
          </h2>
          <p className="text-xs text-muted-foreground max-w-md">
            Your token research, trading strategies, and portfolio analysis
            should be yours alone. StealthTerminal makes that the default,
            not an upsell.
          </p>
          <Link
            href="/agent"
            className="inline-flex items-center gap-2 bg-terminal text-background px-5 py-2.5 text-xs font-bold tracking-wide hover:bg-terminal/90 transition-colors rounded"
          >
            open terminal
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>

        {/* Footer */}
        <footer className="border-t border-border pt-6 pb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-terminal" />
            <span className="text-xs font-bold text-terminal font-mono">
              STEALTH_TERMINAL
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
            <a
              href="https://solrouter.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-terminal transition-colors"
            >
              SolRouter Docs
            </a>
            <a
              href="https://solrouter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-terminal transition-colors"
            >
              solrouter.com
            </a>
            <a
              href="https://x.com/SolRouterAI"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-terminal transition-colors"
            >
              @SolRouterAI
            </a>
            <a
              href="https://jup.ag"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-terminal transition-colors"
            >
              Jupiter
            </a>
            <a
              href="https://dexscreener.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-terminal transition-colors"
            >
              DexScreener
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  href,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  href: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group border border-border bg-card p-4 sm:p-5 rounded space-y-3 hover:border-terminal/30 transition-colors"
    >
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-terminal" />
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-terminal transition-colors" />
      </div>
      <div className="text-xs font-bold text-foreground">{title}</div>
      <div className="text-[11px] text-muted-foreground leading-relaxed">
        {desc}
      </div>
    </Link>
  );
}
