import Link from 'next/link'
import { HERO_SLIDES } from '@/data/products'
import { getFeaturedProducts } from '@/lib/sanity'
import ScrollReveal from '@/components/ScrollReveal'
import QuickAddButton from '@/components/QuickAddButton'
import styles from './page.module.css'

export const revalidate = 0

export default async function Home() {
  const latestDropProducts = await getFeaturedProducts()

  return (
    <div className={styles.homeContainer}>
      {/* Hero Section Banner */}
      <section className={styles.heroSection}>
        {HERO_SLIDES.map((slide) => (
          <div
            key={slide.id}
            className={`${styles.heroSlide} ${styles.activeSlide}`}
          >
            <div
              className={styles.heroBg}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            <div className={styles.heroOverlay} />
            <div className={styles.heroContent}>
              <ScrollReveal direction="up" delay={0.1}>
                <h1 className="font-display text-stroke">{slide.title}</h1>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={0.25}>
                <p className={styles.heroSubtitle}>{slide.subtitle}</p>
              </ScrollReveal>
              <ScrollReveal direction="scale" delay={0.4}>
                <Link href={slide.link || '/collections/all'} className="btn-primary">
                  SHOP NOW →
                </Link>
              </ScrollReveal>
            </div>
          </div>
        ))}
      </section>

      {/* Marquee Bar */}
      <div className={styles.marqueeSection}>
        <div className="animate-marquee">
          <span className={styles.marqueeItem}>★ SUPERIOR PRODUCT LINE ★</span>
          <span className={styles.marqueeItem}>UPTO 70% OFF ON CLEARANCE SALE</span>
          <span className={styles.marqueeItem}>★ OFFICIAL REPLICA KITS ★</span>
          <span className={styles.marqueeItem}>FAST SHIPPING ACROSS INDIA</span>
          <span className={styles.marqueeItem}>★ SUPERIOR PRODUCT LINE ★</span>
          <span className={styles.marqueeItem}>UPTO 70% OFF ON CLEARANCE SALE</span>
          <span className={styles.marqueeItem}>★ OFFICIAL REPLICA KITS ★</span>
          <span className={styles.marqueeItem}>FAST SHIPPING ACROSS INDIA</span>
        </div>
      </div>

      {/* Video Section */}
      <section className={styles.videoSection}>
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className={styles.videoBackground}
        >
          <source src="/football.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className={styles.videoOverlay} />
        <div className={styles.videoContent}>
          <ScrollReveal direction="up" delay={0.1}>
            <h2 className={`font-display text-stroke ${styles.videoTitle}`}>FEEL THE GAME</h2>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.3}>
            <p className={styles.videoSubtitle}>Experience football like never before</p>
          </ScrollReveal>
          <ScrollReveal direction="scale" delay={0.5}>
            <Link href="/collections/all" className="btn-primary">
              EXPLORE GEAR →
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Latest Drop */}
      <section className={`${styles.section} ${styles.darkBg}`}>
        <div className="container">
          <ScrollReveal direction="up">
            <h2 className={`font-display title-underline ${styles.sectionTitle}`}>LATEST DROP</h2>
          </ScrollReveal>

          <div className={styles.productGrid}>
            {latestDropProducts.map((product, idx) => (
              <ScrollReveal key={product.id || product._id || idx} direction="scale" delay={idx * 0.12}>
                <div className={`product-card ${styles.productCard}`}>
                  <Link href={`/products/${product.slug}`} className={styles.productImgWrapper}>
                    <div
                      className={`product-card-img ${styles.cardBg}`}
                      style={{ backgroundImage: `url(${product.image})` }}
                    />
                    <span className={styles.newBadge}>NEW</span>
                    <QuickAddButton product={product} />
                  </Link>
                  <div className={styles.productMeta}>
                    <Link href={`/products/${product.slug}`}>
                      <h3 className={styles.productTitle}>{product.title || product.name}</h3>
                    </Link>
                    <div className={styles.priceRow}>
                      <span className={styles.price}>₹{product.price}</span>
                      {product.originalPrice && (
                        <span className={styles.originalPrice}>₹{product.originalPrice}</span>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story & Stats Section */}
      <section className={`${styles.section} ${styles.brandSection}`}>
        <div className={`container ${styles.brandContainer}`}>
          <div className={styles.brandBox}>
            <ScrollReveal direction="up">
              <h2 className="font-display text-stroke">DUALTURF</h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.15}>
              <p className={styles.brandParagraph}>
                Football is more than just a sport — it's a passion, a community, and a way of life.
                At DualTurf, we bring fans across India the highest quality jerseys and matchwear so you can wear your passion with pride.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about-us" className={`${styles.section} ${styles.aboutSection}`}>
        <div className={`container ${styles.aboutContainer}`}>
          <ScrollReveal direction="up">
            <h2 className={`font-display title-underline ${styles.sectionTitle}`}>ABOUT DUAL TURF</h2>
          </ScrollReveal>

          <div className={styles.aboutGrid}>
            <div className={styles.aboutStory}>
              <ScrollReveal direction="up" delay={0.2}>
                <p className={styles.aboutText}>
                  Dual Turf is a small business started by three college friends with a shared passion for sports and a vision to make quality jerseys more accessible.
                </p>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={0.3}>
                <p className={styles.aboutText}>
                  We offer a growing collection of sports jerseys at convenient and reasonable prices, bringing options for fans of different sports, including football and cricket. From popular teams and players to different styles and versions, we aim to provide something for every sports enthusiast.
                </p>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={0.4}>
                <p className={styles.aboutText}>
                  We are committed to maintaining good quality, fair pricing, and a reliable buying experience for our customers. With shipping available across India, Dual Turf is built around a simple idea — making it easier for fans to wear what they love.
                </p>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={0.5}>
                <p className={styles.aboutTagline}>Dual Turf — For Fans, By Fans</p>
              </ScrollReveal>
            </div>

            <div className={styles.aboutTeam}>
              <ScrollReveal direction="scale" delay={0.2}>
                <div className={styles.aboutLogoWrapper}>
                  <img src="/images/logo.png" alt="Dual Turf" className={styles.aboutLogo} />
                </div>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={0.3}>
                <p className={styles.teamIntro}>With love from the team behind the vision and journey of Dual Turf</p>
              </ScrollReveal>
              <div className={styles.foundersList}>
                <ScrollReveal direction="up" delay={0.4}>
                  <a href="https://www.instagram.com/deepankar.018?stkn=MThpZm5reTBvOWR5OA==" target="_blank" rel="noopener noreferrer" className={styles.founderCard}>
                    <div>
                      <h4 className={styles.founderName}>Deepankar Rout</h4>
                      <span className={styles.founderRole}>Co-founder</span>
                    </div>
                  </a>
                </ScrollReveal>
                <ScrollReveal direction="up" delay={0.5}>
                  <a href="https://www.instagram.com/machine__ak_47?stkn=YTQ1OXNuMDR3Ymwx" target="_blank" rel="noopener noreferrer" className={styles.founderCard}>
                    <div>
                      <h4 className={styles.founderName}>Omm Shree Chandan</h4>
                      <span className={styles.founderRole}>Co-founder</span>
                    </div>
                  </a>
                </ScrollReveal>
                <ScrollReveal direction="up" delay={0.6}>
                  <a href="https://www.instagram.com/_asiezz_?stkn=N2UzM2NxZnAxaXJt" target="_blank" rel="noopener noreferrer" className={styles.founderCard}>
                    <div>
                      <h4 className={styles.founderName}>Asish Kumar Sahoo</h4>
                      <span className={styles.founderRole}>Co-founder</span>
                    </div>
                  </a>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
