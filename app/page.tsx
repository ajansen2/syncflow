'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [scrollY, setScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({})
  const refs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Redirect to dashboard if loaded as embedded app
  useEffect(() => {
    const isEmbedded = window.self !== window.top
    if (isEmbedded) {
      const urlParams = new URLSearchParams(window.location.search)
      const shop = urlParams.get('shop')
      if (shop) {
        window.location.href = `/dashboard?${urlParams.toString()}`
      } else {
        window.location.href = '/dashboard'
      }
    }
  }, [router])

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Intersection Observer for fade-in animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }))
          }
        })
      },
      { threshold: 0.1 }
    )

    Object.values(refs.current).forEach(ref => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .gradient-text {
          background: linear-gradient(-45deg, #06b6d4, #3b82f6, #06b6d4, #3b82f6);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient 3s ease infinite;
        }

        .glow-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .glow-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(6, 182, 212, 0.4);
        }

        .glow-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }

        .glow-button:hover::before {
          left: 100%;
        }

        .fade-in {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease;
        }

        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .floating {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        overflowX: 'hidden'
      }}>

        {/* Navigation */}
        <nav style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: scrollY > 50 ? 'rgba(10,10,10,0.95)' : 'transparent',
          backdropFilter: scrollY > 50 ? 'blur(10px)' : 'none',
          transition: 'all 0.3s ease',
          padding: '20px 40px',
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
              }}
              onClick={() => window.scrollTo(0, 0)}
            >
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                S
              </div>
              <span style={{
                fontSize: '28px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                SyncFlow
              </span>
            </div>
            <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
              {[
                { href: '#features', label: 'Features' },
                { href: '#how-it-works', label: 'How It Works' },
                { href: '#pricing', label: 'Pricing' }
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    color: '#ccc',
                    textDecoration: 'none',
                    transition: 'all 0.3s',
                    borderBottom: '2px solid transparent',
                    paddingBottom: '2px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#06b6d4'
                    e.currentTarget.style.borderBottom = '2px solid #06b6d4'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#ccc'
                    e.currentTarget.style.borderBottom = '2px solid transparent'
                  }}
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(6, 182, 212, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                Install App
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '20px'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 20% 50%, rgba(6,182,212,0.1) 0%, transparent 50%),
                         radial-gradient(circle at 80% 80%, rgba(59,130,246,0.1) 0%, transparent 50%)`,
            transform: `translateY(${scrollY * 0.5}px)`,
          }} />

          <div style={{
            textAlign: 'center',
            zIndex: 1,
            transform: `translateY(${scrollY * -0.2}px)`
          }}>
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.2))',
              border: '1px solid rgba(6,182,212,0.4)',
              borderRadius: '50px',
              padding: '8px 20px',
              marginBottom: '30px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#06b6d4'
            }}>
              Multi-Channel Order Sync for Shopify
            </div>

            <h1 className="gradient-text" style={{
              fontSize: 'clamp(48px, 8vw, 96px)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '30px'
            }}>
              All Your Channels.<br/>One Dashboard.
            </h1>
            <p style={{
              fontSize: 'clamp(20px, 3vw, 32px)',
              color: '#ccc',
              marginBottom: '20px',
              fontWeight: 300
            }}>
              Sync orders from Amazon, Etsy & Shopify
            </p>
            <p style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: '#888',
              marginBottom: '50px',
              maxWidth: '700px',
              margin: '0 auto 50px'
            }}>
              Stop juggling spreadsheets. SyncFlow pulls all your multi-channel orders into one place for accurate bookkeeping, reconciliation, and profit tracking.
            </p>
            <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="glow-button"
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  border: 'none',
                  padding: '18px 48px',
                  borderRadius: '12px',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Start Free Trial
              </button>

              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  background: 'transparent',
                  border: '2px solid #06b6d4',
                  padding: '18px 48px',
                  borderRadius: '12px',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#06b6d4',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(6,182,212,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                See How It Works
              </button>
            </div>

            <div style={{ marginTop: '30px', color: '#888', fontSize: '14px' }}>
              14-day free trial - $29/month - 2-minute setup
            </div>
          </div>

          <div style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'float 2s ease-in-out infinite'
          }}>
            <div style={{ color: '#666', fontSize: '12px' }}>SCROLL</div>
          </div>
        </section>

        {/* Stats Section */}
        <section style={{ padding: '80px 20px', background: '#0f0f0f' }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
            textAlign: 'center'
          }}>
            {[
              { number: '63%', label: 'Of Sellers Use Multiple Channels' },
              { number: '10hrs', label: 'Saved Weekly on Reconciliation' },
              { number: '$57', label: 'A2X Costs for 3 Channels' },
              { number: '$29', label: 'SyncFlow for All Channels' }
            ].map((stat, i) => (
              <div key={i}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '10px'
                }}>
                  {stat.number}
                </div>
                <div style={{ color: '#888', fontSize: '16px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" style={{ padding: '100px 20px' }}>
          <div
            ref={(el) => { refs.current.features = el }}
            id="features-section"
            className={`fade-in ${isVisible['features-section'] ? 'visible' : ''}`}
            style={{ maxWidth: '1400px', margin: '0 auto' }}
          >
            <h2 style={{
              fontSize: '48px',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              Why Choose SyncFlow?
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#888',
              fontSize: '20px',
              marginBottom: '60px',
              maxWidth: '700px',
              margin: '0 auto 60px'
            }}>
              The affordable way to manage multi-channel e-commerce finances
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '40px'
            }}>
              {[
                {
                  icon: '🔗',
                  title: 'Connect All Channels',
                  desc: 'Link Amazon, Etsy, and Shopify in minutes. OAuth-based connections mean no API keys to manage. Just authorize and go.'
                },
                {
                  icon: '📦',
                  title: 'Unified Order View',
                  desc: 'See all your orders in one dashboard. Filter by channel, date, or status. No more switching between seller portals.'
                },
                {
                  icon: '💰',
                  title: 'Fee Tracking',
                  desc: 'Automatically track platform fees, shipping costs, and payment processing. Know your true profit per order and per channel.'
                },
                {
                  icon: '📊',
                  title: 'Payout Reconciliation',
                  desc: 'Match platform payouts to individual orders. Reconcile your bank deposits with ease. Never wonder where money came from.'
                },
                {
                  icon: '📈',
                  title: 'Channel Analytics',
                  desc: 'Compare performance across channels. See which platform drives the most profit, not just revenue.'
                },
                {
                  icon: '🏷️',
                  title: 'Half the Price of A2X',
                  desc: 'A2X charges $19/month per channel ($57 for Amazon + Shopify + Etsy). SyncFlow: $29/month for everything.'
                }
              ].map((item, i) => (
                <div
                  key={i}
                  className="floating"
                  style={{
                    background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
                    border: '1px solid #333',
                    borderRadius: '16px',
                    padding: '40px',
                    animationDelay: `${i * 0.2}s`,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-10px)'
                    e.currentTarget.style.borderColor = '#06b6d4'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = '#333'
                  }}
                >
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>{item.icon}</div>
                  <h3 style={{ fontSize: '24px', marginBottom: '15px', fontWeight: 600 }}>{item.title}</h3>
                  <p style={{ color: '#888', lineHeight: '1.6' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" style={{
          padding: '100px 20px',
          background: 'linear-gradient(180deg, transparent, #0f0f0f, transparent)'
        }}>
          <div
            ref={(el) => { refs.current.how = el }}
            id="how-section"
            className={`fade-in ${isVisible['how-section'] ? 'visible' : ''}`}
            style={{ maxWidth: '1400px', margin: '0 auto' }}
          >
            <h2 style={{
              fontSize: '48px',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              How It Works
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#888',
              fontSize: '20px',
              marginBottom: '60px',
              maxWidth: '700px',
              margin: '0 auto 60px'
            }}>
              From chaos to clarity in 4 simple steps
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
              {[
                {
                  step: '01',
                  title: 'Install from Shopify',
                  desc: 'Install SyncFlow from the Shopify App Store. Your Shopify connection is automatic.'
                },
                {
                  step: '02',
                  title: 'Connect Channels',
                  desc: 'Link your Amazon Seller Central and Etsy shop with secure OAuth. No passwords stored.'
                },
                {
                  step: '03',
                  title: 'Sync Orders',
                  desc: 'We pull orders, fees, and payouts from all channels automatically. Historical data included.'
                },
                {
                  step: '04',
                  title: 'See Everything',
                  desc: 'View unified analytics, track profitability, and reconcile payouts - all in one place.'
                }
              ].map((item, i) => (
                <div key={i} className="floating" style={{
                  textAlign: 'center',
                  animationDelay: `${i * 0.2}s`
                }}>
                  <div style={{
                    fontSize: '72px',
                    fontWeight: 800,
                    color: 'rgba(6,182,212,0.2)',
                    marginBottom: '20px'
                  }}>
                    {item.step}
                  </div>
                  <h3 style={{ fontSize: '24px', marginBottom: '15px', fontWeight: 600 }}>{item.title}</h3>
                  <p style={{ color: '#888', lineHeight: '1.6' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section style={{ padding: '100px 20px', background: '#0f0f0f' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{
              fontSize: '48px',
              fontWeight: 700,
              marginBottom: '40px'
            }}>
              SyncFlow vs. A2X
            </h2>

            <div style={{
              background: '#1a1a1a',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid #333'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#2a2a2a' }}>
                    <th style={{ padding: '20px', textAlign: 'left', color: '#888' }}>Feature</th>
                    <th style={{ padding: '20px', textAlign: 'center' }}>
                      <span style={{
                        background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 700
                      }}>SyncFlow</span>
                    </th>
                    <th style={{ padding: '20px', textAlign: 'center', color: '#888' }}>A2X</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Amazon Integration', syncflow: '$29/mo', a2x: '$19/mo' },
                    { feature: 'Shopify Integration', syncflow: 'Included', a2x: '+$19/mo' },
                    { feature: 'Etsy Integration', syncflow: 'Included', a2x: '+$19/mo' },
                    { feature: 'Total (All 3 Channels)', syncflow: '$29/mo', a2x: '$57/mo' },
                    { feature: 'Unified Dashboard', syncflow: 'Yes', a2x: 'Separate apps' },
                    { feature: 'Cross-Channel Analytics', syncflow: 'Yes', a2x: 'No' },
                    { feature: 'Free Trial', syncflow: '14 days', a2x: '14 days' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #333' }}>
                      <td style={{ padding: '16px 20px', textAlign: 'left', color: '#ccc' }}>{row.feature}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', color: '#06b6d4', fontWeight: 600 }}>{row.syncflow}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', color: '#888' }}>{row.a2x}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '40px', color: '#888' }}>
              Save <span style={{ color: '#06b6d4', fontWeight: 700, fontSize: '24px' }}>$336/year</span> with SyncFlow
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" style={{
          padding: '100px 20px',
          background: 'linear-gradient(180deg, transparent, #0f0f0f)'
        }}>
          <div
            ref={(el) => { refs.current.pricing = el }}
            id="pricing-section"
            className={`fade-in ${isVisible['pricing-section'] ? 'visible' : ''}`}
            style={{ maxWidth: '1200px', margin: '0 auto' }}
          >
            <h2 style={{
              fontSize: '48px',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              Simple Pricing
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#888',
              fontSize: '20px',
              marginBottom: '60px',
              maxWidth: '700px',
              margin: '0 auto 60px'
            }}>
              One price. All channels. No surprises.
            </p>

            <div style={{
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.2))',
                border: '3px solid #06b6d4',
                borderRadius: '20px',
                padding: '50px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: '#06b6d4',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700
                }}>
                  SAVE $336/YR
                </div>

                <div style={{ fontSize: '20px', color: '#06b6d4', marginBottom: '10px', fontWeight: 600 }}>
                  All Channels
                </div>
                <div style={{
                  fontSize: '56px',
                  fontWeight: 700,
                  marginBottom: '10px',
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  $29<span style={{ fontSize: '24px', color: '#ccc' }}>/month</span>
                </div>
                <div style={{ fontSize: '16px', color: '#888', marginBottom: '30px' }}>
                  Billed monthly - Cancel anytime
                </div>

                <div style={{
                  textAlign: 'left',
                  marginBottom: '30px'
                }}>
                  {[
                    'Amazon order sync',
                    'Shopify order sync',
                    'Etsy order sync',
                    'Unified dashboard',
                    'Fee tracking',
                    'Payout reconciliation',
                    'Channel analytics',
                    'Export to CSV',
                    '14-day free trial'
                  ].map((feature, i) => (
                    <div key={i} style={{ color: '#ccc', marginBottom: '12px', fontSize: '16px' }}>
                      <span style={{ color: '#06b6d4', marginRight: '10px' }}>✓</span>{feature}
                    </div>
                  ))}
                </div>

                <button
                  className="glow-button"
                  onClick={() => window.location.href = '/dashboard'}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                    border: 'none',
                    padding: '16px',
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Start Free Trial
                </button>

                <div style={{ marginTop: '15px', color: '#888', fontSize: '13px', textAlign: 'center' }}>
                  14-day free trial - No credit card required
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section style={{ padding: '100px 20px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{
              fontSize: '48px',
              fontWeight: 700,
              marginBottom: '20px'
            }}>
              Ready to Simplify Multi-Channel?
            </h2>
            <p style={{ fontSize: '20px', color: '#888', marginBottom: '40px' }}>
              Join sellers who save hours every week with unified order management.
            </p>
            <button
              className="glow-button"
              onClick={() => window.location.href = '/dashboard'}
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                border: 'none',
                padding: '18px 48px',
                borderRadius: '12px',
                fontSize: '20px',
                fontWeight: 600,
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Start Free Trial
            </button>
            <div style={{ marginTop: '20px', color: '#888', fontSize: '14px' }}>
              2-minute setup - $29/month - 14-day free trial
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          padding: '60px 20px',
          borderTop: '1px solid #333',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              justifyContent: 'center',
              marginBottom: '30px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                S
              </div>
              <span style={{
                fontSize: '28px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                SyncFlow
              </span>
            </div>

            <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '30px' }}>
              <a href="/privacy" style={{ color: '#666', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="/terms" style={{ color: '#666', textDecoration: 'none' }}>Terms of Service</a>
              <a href="mailto:support@syncflow.app" style={{ color: '#666', textDecoration: 'none' }}>Contact</a>
            </div>
            <div style={{ color: '#666' }}>
              © 2025 SyncFlow - Multi-Channel Order Sync for Shopify
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
