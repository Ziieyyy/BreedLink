"use client";
import { useState, useEffect, useRef } from "react";

/* ─── Scroll animation hook ─── */
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".animate-on-scroll").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─── FAQ Accordion ─── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? "open" : ""}`}>
      <button className="faq-question" onClick={() => setOpen(!open)}>
        {q}
        <span className="faq-chevron">▼</span>
      </button>
      <div className="faq-answer"><p>{a}</p></div>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  useScrollReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ════════ NAVBAR ════════ */}
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-inner">
          <a href="#" className="navbar-logo">
            <div className="logo-icon">🐱</div>
            BreedLink
          </a>
          <div className="navbar-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#ai-assistant">AI Assistant</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="navbar-cta">
            <a href="http://localhost:8081/login" className="btn btn-primary">Get Started</a>
          </div>
          <button className="navbar-mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ════════ HERO ════════ */}
      <section className="hero" id="home">
        <div className="container">
          <div className="hero-inner">
            <div className="hero-content">
              <div className="hero-badge">
                <span className="badge-dot" />
                Trusted by 2,400+ Cat Breeders in Malaysia
              </div>
              <h1>
                Find <span className="highlight">Verified Breeding Partners</span> For Your Cat
              </h1>
              <p className="hero-desc">
                Connect with verified breeders, discover compatible cats nearby, upload health certifications, and manage breeding agreements — all in one secure platform.
              </p>
              <div className="hero-buttons">
                <a href="http://localhost:8081/login" className="btn btn-primary btn-lg">Get Started Free →</a>
                <a href="#how-it-works" className="btn btn-secondary btn-lg">Explore Platform</a>
              </div>
              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="hero-stat-value">2,400+</div>
                  <div className="hero-stat-label">Verified Breeders</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-value">8,500+</div>
                  <div className="hero-stat-label">Cat Profiles</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-value">98%</div>
                  <div className="hero-stat-label">Success Rate</div>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <img src="/assets/hero-dashboard.png" alt="BreedLink Dashboard Preview" />
              <div className="hero-float float-1">
                <div className="float-icon green">✓</div>
                <div><strong>Verified</strong><br /><span style={{ fontSize: 11, color: "#9CA3AF" }}>Admin approved</span></div>
              </div>
              <div className="hero-float float-2">
                <div className="float-icon orange">🐾</div>
                <div><strong>New Match!</strong><br /><span style={{ fontSize: 11, color: "#9CA3AF" }}>95% compatible</span></div>
              </div>
              <div className="hero-float float-3">
                <div className="float-icon blue">💬</div>
                <div><strong>AI Chat</strong><br /><span style={{ fontSize: 11, color: "#9CA3AF" }}>Ask anything</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ PROBLEM ════════ */}
      <section className="section problem" id="problem">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">The Problem</span>
            <h2 className="section-title">Breeding Cats Shouldn&apos;t Be Risky</h2>
            <p className="section-subtitle">Cat breeding communities face serious challenges that put both cats and owners at risk.</p>
          </div>
          <div className="problem-grid">
            {[
              { icon: "🚫", title: "No Trusted Networks", desc: "Finding reliable, ethical breeders is nearly impossible without personal connections." },
              { icon: "📋", title: "Unverified Health Records", desc: "Most platforms don't verify vaccination certificates, putting kittens at serious health risk." },
              { icon: "💬", title: "Poor Communication", desc: "Fragmented messaging tools make it difficult to coordinate breeding arrangements." },
              { icon: "📝", title: "No Formal Agreements", desc: "Breeding deals happen informally with no legal protection for either party." },
              { icon: "⚠️", title: "Unethical Practices", desc: "Without oversight, irresponsible breeding practices continue unchecked." },
            ].map((item, i) => (
              <div key={i} className="problem-card animate-on-scroll" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="card-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ SOLUTION / FEATURES ════════ */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">The Solution</span>
            <h2 className="section-title">Breed Smarter With BreedLink</h2>
            <p className="section-subtitle">Everything you need to breed cats responsibly, verify health records, and connect with trusted partners.</p>
          </div>
          <div className="solution-grid">
            {[
              { icon: "🐱", title: "Verified Cat Profiles", desc: "Create detailed profiles with breed info, photos, and health records — all admin-verified." },
              { icon: "🤖", title: "AI Smart Matching", desc: "Our AI analyzes breed compatibility, health history, and location to find the perfect partner." },
              { icon: "💉", title: "Health Certification", desc: "Upload vaccination records and health certificates for transparent, verified breeding." },
              { icon: "💬", title: "Secure Messaging", desc: "Built-in encrypted chat system to communicate safely with potential breeding partners." },
              { icon: "📑", title: "Digital Agreements", desc: "Sign legally-binding breeding agreements digitally with full terms and conditions." },
              { icon: "📊", title: "Breeding History", desc: "Track complete breeding lineage and history for responsible, informed breeding decisions." },
            ].map((item, i) => (
              <div key={i} className="solution-card animate-on-scroll" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="card-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ HOW IT WORKS ════════ */}
      <section className="section how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">How It Works</span>
            <h2 className="section-title">Simple Steps to Responsible Breeding</h2>
            <p className="section-subtitle">From registration to a successful match — here&apos;s how BreedLink works.</p>
          </div>
          <div className="steps-timeline">
            {[
              { step: 1, title: "Create Your Account", desc: "Register as a cat owner or professional breeder in under 2 minutes." },
              { step: 2, title: "Register Your Cat", desc: "Add detailed profiles with breed, age, photos, and temperament info." },
              { step: 3, title: "Upload Health Certificate", desc: "Provide vaccination records and health documentation for verification." },
              { step: 4, title: "Admin Verification", desc: "Our team reviews and verifies all health records and cat profiles." },
              { step: 5, title: "Discover Matches", desc: "Browse AI-recommended compatible breeding partners in your area." },
              { step: 6, title: "Chat & Agree Terms", desc: "Message potential partners and sign a digital breeding agreement." },
              { step: 7, title: "Successful Match", desc: "Complete the breeding process with full documentation and support." },
            ].map((item, i) => (
              <div key={i} className="step-item animate-on-scroll" style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="step-number">{item.step}</div>
                <div className="step-content">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ AI ASSISTANT ════════ */}
      <section className="section ai-section" id="ai-assistant">
        <div className="container">
          <div className="ai-inner">
            <div>
              <div className="animate-on-scroll">
                <span className="section-label">AI-Powered</span>
                <h2 className="section-title">Your AI Cat Breeding Expert</h2>
                <p className="section-subtitle">Get instant, expert-level guidance on cat breeding, health, nutrition, and responsible ownership.</p>
              </div>
              <div className="ai-features" style={{ marginTop: 36 }}>
                {[
                  { icon: "🧬", title: "Ethical Breeding Guidance", desc: "AI-powered recommendations for responsible breeding practices." },
                  { icon: "🥗", title: "Nutrition Recommendations", desc: "Personalized diet plans based on breed, age, and health conditions." },
                  { icon: "🧠", title: "Behavior Advice", desc: "Understand your cat's behavior and get expert training tips." },
                  { icon: "❤️", title: "Health Education", desc: "Learn about common diseases, vaccinations, and preventive care." },
                ].map((item, i) => (
                  <div key={i} className="ai-feature animate-on-scroll" style={{ transitionDelay: `${i * 0.1}s` }}>
                    <div className="feat-icon">{item.icon}</div>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ai-mockup animate-on-scroll">
              <img src="/assets/ai-chat.png" alt="BreedLink AI Assistant Preview" />
            </div>
          </div>
        </div>
      </section>

      {/* ════════ TRUST & SAFETY ════════ */}
      <section className="section" id="trust">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">Trust & Safety</span>
            <h2 className="section-title">Built Around Trust</h2>
            <p className="section-subtitle">Every layer of BreedLink is designed to protect both cats and their owners.</p>
          </div>
          <div className="trust-grid">
            {[
              { icon: "🛡️", title: "Admin Verification", desc: "Every profile and certificate is manually reviewed by our team." },
              { icon: "📋", title: "Health Certificate Review", desc: "Vaccination records are verified before any match can proceed." },
              { icon: "✓", title: "Verified Profiles", desc: "Only verified users can access the matching and chat features." },
              { icon: "🔒", title: "Secure Data Storage", desc: "All data is encrypted and stored securely with Supabase." },
              { icon: "📖", title: "Responsible Guidelines", desc: "Clear breeding guidelines ensure ethical practices across the platform." },
            ].map((item, i) => (
              <div key={i} className="trust-card animate-on-scroll" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="trust-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ WHO IT'S FOR ════════ */}
      <section className="section audience" id="audience">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">Who It&apos;s For</span>
            <h2 className="section-title">Built For Everyone Who Loves Cats</h2>
          </div>
          <div className="audience-grid">
            {[
              { icon: "🏠", title: "Cat Owners", desc: "Find trusted partners for your beloved cat with full transparency." },
              { icon: "🏆", title: "Professional Breeders", desc: "Manage your cattery, track lineage, and grow your reputation." },
              { icon: "🏥", title: "Veterinary Clinics", desc: "Verify health records and support responsible breeding in your area." },
              { icon: "🌍", title: "Animal Organizations", desc: "Promote ethical breeding standards and animal welfare." },
            ].map((item, i) => (
              <div key={i} className="audience-card animate-on-scroll" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="aud-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ TESTIMONIALS ════════ */}
      <section className="section" id="testimonials">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">Testimonials</span>
            <h2 className="section-title">Loved By Cat Lovers Everywhere</h2>
            <p className="section-subtitle">Real stories from breeders and cat owners who trust BreedLink.</p>
          </div>
          <div className="testimonials-grid">
            {[
              { name: "Sarah A.", role: "Cat Owner, Kuala Lumpur", text: "BreedLink made finding a verified breeder so easy. The AI matching found a perfect partner for my Persian cat within days!", initial: "S", stars: 5 },
              { name: "Dr. Amir H.", role: "Veterinary Partner", text: "As a vet, I love that BreedLink verifies health certificates. It ensures every kitten comes from a healthy, well-documented lineage.", initial: "A", stars: 5 },
              { name: "Fatimah Z.", role: "Professional Breeder, Johor", text: "The digital agreements and chat system saved me hours of back-and-forth. Finally, a platform built for serious breeders.", initial: "F", stars: 5 },
            ].map((item, i) => (
              <div key={i} className="testimonial-card animate-on-scroll" style={{ transitionDelay: `${i * 0.15}s` }}>
                <div className="testimonial-stars">{"★".repeat(item.stars)}</div>
                <p className="testimonial-text">&ldquo;{item.text}&rdquo;</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{item.initial}</div>
                  <div>
                    <div className="testimonial-name">{item.name}</div>
                    <div className="testimonial-role">{item.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ SHOWCASE ════════ */}
      <section className="section" style={{ background: "var(--bg-white)" }}>
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">Platform Preview</span>
            <h2 className="section-title">See BreedLink In Action</h2>
            <p className="section-subtitle">A preview of the full BreedLink mobile and web experience.</p>
          </div>
          <div className="animate-on-scroll" style={{ textAlign: "center" }}>
            <img src="/assets/platform-showcase.png" alt="BreedLink Platform Showcase" style={{ borderRadius: 24, boxShadow: "0 16px 48px rgba(0,0,0,0.12)", maxWidth: 900, width: "100%", margin: "0 auto" }} />
          </div>
        </div>
      </section>

      {/* ════════ FAQ ════════ */}
      <section className="section faq" id="faq">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">FAQ</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          <div className="faq-list">
            <FAQItem q="How does verification work?" a="When you register a cat profile and upload health certificates, our admin team manually reviews all documents. Once approved, your profile receives a verified badge visible to all users." />
            <FAQItem q="Can I use BreedLink for adoption?" a="While BreedLink is primarily designed for ethical cat breeding, many users also find loving homes for kittens through our platform's connected community." />
            <FAQItem q="How does the AI assistant help?" a="Our AI assistant provides personalized breeding advice, nutrition recommendations, behavior guidance, and general health education based on your cat's breed and profile." />
            <FAQItem q="Are vaccination records checked?" a="Yes! All vaccination certificates are reviewed by our admin team before a profile can be verified. This ensures every cat on the platform has legitimate health documentation." />
            <FAQItem q="How are matches approved?" a="Matches are suggested by our AI based on breed compatibility, location, and health status. Both parties must agree and sign a digital breeding agreement before proceeding." />
          </div>
        </div>
      </section>

      {/* ════════ FINAL CTA ════════ */}
      <section className="final-cta" id="cta">
        <div className="container">
          <div className="animate-on-scroll">
            <h2 className="section-title">Ready To Find The Perfect Match?</h2>
            <p className="section-subtitle">Join thousands of responsible cat owners and breeders on BreedLink today.</p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="http://localhost:8081/create-account" className="btn btn-primary btn-lg">Create Free Account →</a>
              <a href="http://localhost:8081/login" className="btn btn-secondary btn-lg">Login</a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-brand">
              <a href="#" className="navbar-logo" style={{ color: "#fff" }}>
                <div className="logo-icon">🐱</div>
                BreedLink
              </a>
              <p>The trusted platform for ethical cat breeding, adoption, and care. Connecting cat lovers responsibly.</p>
            </div>
            <div className="footer-col">
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#ai-assistant">AI Assistant</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Contact</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 BreedLink. All rights reserved.</span>
            <span>Built with ❤️ for cat lovers</span>
          </div>
        </div>
      </footer>
    </>
  );
}
