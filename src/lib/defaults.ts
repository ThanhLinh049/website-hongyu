/**
 * Centralized demo / fallback content.
 *
 * Every page component falls back to these datasets when WordPress returns
 * nothing (no backend connection) — so the site always renders its complete,
 * responsive "default layout". Keep all demo content here (one place to polish),
 * and reference bundled images under /demo/* (see public/demo) so the default
 * layout works fully offline.
 */

/* ----------------------------- Home page ----------------------------- */

export const HOME_HERO_SLIDES = [
  {
    badgeText: 'Custom Manufacturing',
    heading: 'Custom Badges, Patches & Metal Products Made for Your Brand',
    subheading: 'High-precision manufacturing for elite organizations. From 3D PVC patches to premium metal badges, we deliver industrial-grade custom products globally.',
    backgroundImage: { node: { sourceUrl: '/demo/demo-05.png' } },
    primaryCtaLabel: 'Get Your Free Design Proof',
    primaryCtaUrl: '/contact',
    secondaryCtaLabel: 'Explore Materials',
    secondaryCtaUrl: '/products'
  },
  {
    badgeText: 'Flexible PVC Patches',
    heading: 'Durable PVC Patches Built for Color, Shape & Daily Wear',
    subheading: 'Create dimensional, weather-resistant patches with crisp edges, custom colors, and reliable backing options for uniforms, gear, and branded merchandise.',
    backgroundImage: { node: { sourceUrl: '/demo/demo-16.png' } },
    primaryCtaLabel: 'Request PVC Quote',
    primaryCtaUrl: '/contact',
    secondaryCtaLabel: 'View PVC Options',
    secondaryCtaUrl: '/products#pvc-deep-dive'
  },
  {
    badgeText: 'Premium Metal Products',
    heading: 'Premium Metal Badges & Emblems for High-End Brand Programs',
    subheading: 'Elevate uniforms, packaging, vehicles, and accessories with refined metal finishes, precise tooling, and production-ready quality control.',
    backgroundImage: { node: { sourceUrl: '/demo/demo-04.png' } },
    primaryCtaLabel: 'Start Metal Project',
    primaryCtaUrl: '/contact',
    secondaryCtaLabel: 'See Portfolio',
    secondaryCtaUrl: '/portfolio'
  }
];

export const HOME_TRUST_BAR = [
  { icon: 'design_services', label: 'Free Proof' },
  { icon: 'payments', label: 'No Hidden Costs' },
  { icon: 'rocket_launch', label: 'Fast Turnaround' },
  { icon: 'public', label: 'Worldwide Shipping' },
  { icon: 'verified', label: 'Quality Control' }
];

export const HOME_SPECIALTIES = [
  { image: { node: { sourceUrl: '/demo/demo-04.png' } }, title: 'Flex Badges', description: 'High-resolution textured finish with 4-way stretch material.', linkLabel: 'Explore Flex', linkUrl: '/products/flex' },
  { image: { node: { sourceUrl: '/demo/demo-23.png' } }, title: 'Embroidery', description: 'Classic premium stitch quality with up to 12 vibrant colors.', linkLabel: 'Explore Embroidery', linkUrl: '/products/embroidery' },
  { image: { node: { sourceUrl: '/demo/demo-19.png' } }, title: 'PVC Patches', description: 'Tactical-grade 3D layering, 100% waterproof and fade resistant.', linkLabel: 'Explore PVC', linkUrl: '/products/pvc' },
  { image: { node: { sourceUrl: '/demo/demo-14.png' } }, title: 'Metal Products', description: 'Die-struck lapel pins and badges with custom metal finishes.', linkLabel: 'Explore Metal', linkUrl: '/products/metal' }
];

export const HOME_ADVANTAGES = [
  {
    icon: 'precision_manufacturing',
    title: 'Massive Production Capacity',
    description: 'Our facilities handle orders from 50 to 500,000 units with consistent precision across the entire run. We scale with your growth.',
    isHighlight: false,
    stats: [
      { value: '24/7', label: 'Manufacturing' },
      { value: '0.01mm', label: 'Tolerance' },
      { value: '100%', label: 'Custom' }
    ]
  },
  {
    icon: 'verified_user',
    title: 'ISO 9001 Certified',
    description: 'Every batch undergoes a rigorous 12-point inspection before it leaves our facility. Zero compromise on brand integrity.',
    isHighlight: true
  },
  {
    icon: 'palette',
    title: 'Pantone Matching',
    description: 'We ensure your brand colors are accurate to within 1% variance using professional matching systems.',
    isHighlight: false
  },
  {
    icon: 'inventory',
    title: 'White Label Shipping',
    description: 'For resellers and agencies, we offer fully anonymous blind shipping directly to your clients.',
    isHighlight: false
  },
  {
    icon: 'bolt',
    title: 'Priority Rush Lane',
    description: 'Urgent deadline? Our rush manufacturing can deliver finished custom products in as little as 5-7 business days.',
    isHighlight: true
  }
];

export const HOME_PROCESS = [
  { icon: 'lightbulb', title: '1. Idea & Artwork', description: 'Upload a logo or simple sketch. Our design team creates your production-ready vector file for free.' },
  { icon: 'fact_check', title: '2. Digital Proof', description: 'Review a high-resolution mock-up in 24 hours. Request unlimited revisions until it\'s perfect.' },
  { icon: 'local_shipping', title: '3. Manufacturing', description: 'Once approved, we manufacture and ship worldwide. Track your order in real-time to your door.' }
];

export const HOME_CAPABILITIES = [
  { title: 'Sizing', description: 'From 0.5" micro-pins to 18" large patches.' },
  { title: 'Backing', description: 'Iron-on, Velcro, Adhesive, or Magnetic.' },
  { title: 'Dimensions', description: 'Standard flat 2D or sculpted 3D layers.' },
  { title: 'Materials', description: 'TPU, Silicone, Brass, Zinc, and Eco-Felt.' }
];

export const HOME_PORTFOLIOS = [
  {
    title: 'Elite Tactical Badge', slug: 'elite-tactical-badge',
    featuredImage: { node: { sourceUrl: '/demo/demo-24.png' } },
    portfolioCategories: { nodes: [{ name: 'Flex Badges' }] }
  },
  {
    title: 'Heritage Airline Crest', slug: 'heritage-airline-crest',
    featuredImage: { node: { sourceUrl: '/demo/demo-06.png' } },
    portfolioCategories: { nodes: [{ name: 'Embroidery' }] }
  },
  {
    title: 'Maritime Service Coin', slug: 'maritime-service-coin',
    featuredImage: { node: { sourceUrl: '/demo/demo-08.png' } },
    portfolioCategories: { nodes: [{ name: 'Metal Products' }] }
  },
  {
    title: 'Luxury Automotive Badge', slug: 'luxury-automotive-badge',
    featuredImage: { node: { sourceUrl: '/demo/demo-17.png' } },
    portfolioCategories: { nodes: [{ name: 'Metal Products' }] }
  }
];

export const HOME_POSTS = [
  {
    title: 'PVC vs. Embroidery: Choosing for Performance',
    slug: 'pvc-vs-embroidery',
    excerpt: 'Detailed comparison of durability and design fidelity for tactical gear.',
    featuredImage: { node: { sourceUrl: '/demo/demo-22.png' } },
    categories: { nodes: [{ name: 'Tech Trends' }] }
  },
  {
    title: 'Understanding Bleeds & Borders for CNC Milling',
    slug: 'understanding-bleeds-borders',
    excerpt: 'Crucial artwork guidelines for creating metallic pins with enamel color separation.',
    featuredImage: { node: { sourceUrl: '/demo/demo-20.png' } },
    categories: { nodes: [{ name: 'Ordering Guide' }] }
  },
  {
    title: 'What are Flex Badges? The Modern Standard',
    slug: 'what-are-flex-badges',
    excerpt: 'Discover the texture, feel, and weight advantages of our patented metallic-polymer badges.',
    featuredImage: { node: { sourceUrl: '/demo/demo-07.png' } },
    categories: { nodes: [{ name: 'Material Spec' }] }
  }
];

/* ----------------------------- Blog page ----------------------------- */

export const BLOG_POSTS = [
  {
    title: 'How to Choose the Right Custom Badge Material for Industrial Use',
    slug: 'how-to-choose-badge-material',
    excerpt: 'Navigating the complexities of flex badges versus traditional metal can be challenging. We break down durability, cost-efficiency, and brand impact for high-volume corporate orders.',
    date: '2023-10-24T00:00:00',
    featuredImage: { node: { sourceUrl: '/demo/demo-18.png' } },
    categories: { nodes: [{ name: 'Design Tips', slug: 'design-tips' }] }
  },
  {
    title: 'Optimizing Logo Files for Flex Badge Production',
    slug: 'optimizing-logo-files',
    excerpt: 'Learn the essential file types and vector requirements to ensure your custom badges maintain perfect fidelity during the extrusion process.',
    date: '2023-10-24T00:00:00',
    featuredImage: { node: { sourceUrl: '/demo/demo-13.png' } },
    categories: { nodes: [{ name: 'Design Tips', slug: 'design-tips' }] }
  },
  {
    title: 'The Science of Durability: PVC vs. TPU Materials',
    slug: 'pvc-vs-tpu-materials',
    excerpt: 'A technical comparison of polymer performance under extreme heat and chemical exposure in industrial workwear environments.',
    date: '2023-10-18T00:00:00',
    featuredImage: { node: { sourceUrl: '/demo/demo-12.png' } },
    categories: { nodes: [{ name: 'Manufacturing', slug: 'manufacturing' }] }
  },
  {
    title: 'Reducing Lead Times for High-Volume Orders',
    slug: 'reducing-lead-times',
    excerpt: 'Strategies for supply chain management and proof approval to shave weeks off your custom manufacturing timeline.',
    date: '2023-10-12T00:00:00',
    featuredImage: { node: { sourceUrl: '/demo/demo-25.png' } },
    categories: { nodes: [{ name: 'Ordering Guide', slug: 'ordering-guide' }] }
  }
];

/* --------------------------- Products page --------------------------- */

export const PRODUCTS_CATEGORIES = [
  { name: 'Flex Badges', slug: 'flex', count: 3, categoryFields: { catTagline: 'Metallic Polymers', catHeroImage: { node: { sourceUrl: '/demo/demo-04.png' } } } },
  { name: 'Embroidery', slug: 'embroidery', count: 3, categoryFields: { catTagline: 'High-Density Thread', catHeroImage: { node: { sourceUrl: '/demo/demo-23.png' } } } },
  { name: 'PVC Patches', slug: 'pvc', count: 3, categoryFields: { catTagline: '3D Tactical Polymer', catHeroImage: { node: { sourceUrl: '/demo/demo-19.png' } } } },
  { name: 'Metal Products', slug: 'metal', count: 3, categoryFields: { catTagline: 'Die-Cast Alloys', catHeroImage: { node: { sourceUrl: '/demo/demo-14.png' } } } }
];

// Demo product grid shown on the Products page when offline (12 items across the
// 4 categories so the category filter has results). Links resolve to the SSR
// product-detail fallback.
const demoProd = (title: string, slug: string, cat: string, catSlug: string, img: string) => ({
  title, slug, date: '2026-01-01T00:00:00',
  featuredImage: { node: { sourceUrl: img } },
  productCategories: { nodes: [{ name: cat, slug: catSlug }] },
  finishes: { nodes: [] }, backings: { nodes: [] },
});
export const PRODUCTS_LIST = [
  demoProd('Tactical Flex Badge', 'tactical-flex-badge', 'Flex Badges', 'flex', '/demo/demo-04.png'),
  demoProd('Corporate Flex Emblem', 'corporate-flex-emblem', 'Flex Badges', 'flex', '/demo/demo-05.png'),
  demoProd('Sport Team Flex Patch', 'sport-team-flex-patch', 'Flex Badges', 'flex', '/demo/demo-06.png'),
  demoProd('Heritage Embroidered Crest', 'heritage-embroidered-crest', 'Embroidery', 'embroidery', '/demo/demo-07.png'),
  demoProd('Military Bullion Patch', 'military-bullion-patch', 'Embroidery', 'embroidery', '/demo/demo-08.png'),
  demoProd('Custom Logo Embroidery', 'custom-logo-embroidery', 'Embroidery', 'embroidery', '/demo/demo-09.png'),
  demoProd('3D PVC Morale Patch', '3d-pvc-morale-patch', 'PVC Patches', 'pvc', '/demo/demo-12.png'),
  demoProd('Glow PVC Tactical Badge', 'glow-pvc-tactical-badge', 'PVC Patches', 'pvc', '/demo/demo-13.png'),
  demoProd('Waterproof PVC Label', 'waterproof-pvc-label', 'PVC Patches', 'pvc', '/demo/demo-16.png'),
  demoProd('Die-Struck Lapel Pin', 'die-struck-lapel-pin', 'Metal Products', 'metal', '/demo/demo-17.png'),
  demoProd('Antique Brass Coin', 'antique-brass-coin', 'Metal Products', 'metal', '/demo/demo-18.png'),
  demoProd('Enamel Metal Badge', 'enamel-metal-badge', 'Metal Products', 'metal', '/demo/demo-24.png'),
];

export const PRODUCTS_TEXTURES = [
  { textureName: 'Matte', swatchImage: { node: { sourceUrl: '/demo/demo-09.png' } } },
  { textureName: 'Shiny', swatchImage: { node: { sourceUrl: '/demo/demo-12.png' } } },
  { textureName: 'Brushed', swatchImage: { node: { sourceUrl: '/demo/demo-13.png' } } },
  { textureName: 'Textured', swatchImage: { node: { sourceUrl: '/demo/demo-22.png' } } }
];

export const PRODUCTS_BACKINGS = [
  { label: 'Industrial Adhesive' }, { label: 'Velcro Hook/Loop' }, { label: 'Magnetic Clutch' }, { label: 'Safety Pin' }
];

/* --------------------------- Portfolio page -------------------------- */

export const PORTFOLIO_PROJECTS = [
  { title: 'Elite Tactical Badge', slug: 'elite-tactical-badge', featuredImage: { node: { sourceUrl: '/demo/demo-05.png' } }, portfolioFields: { specs: [{ label: 'Material', value: '3D Flexible PVC' }, { label: 'Finish', value: 'Matte Non-Reflective' }] }, portfolioCategories: { nodes: [{ name: 'Flex Badges', slug: 'flex' }] } },
  { title: 'Heritage Airline Crest', slug: 'heritage-airline-crest', featuredImage: { node: { sourceUrl: '/demo/demo-01.png' } }, portfolioFields: { specs: [{ label: 'Material', value: 'Gold Metallic Thread' }, { label: 'Finish', value: 'High-Density Satin' }] }, portfolioCategories: { nodes: [{ name: 'Embroidery', slug: 'embroidery' }] } },
  { title: 'Maritime Service Coin', slug: 'maritime-service-coin', featuredImage: { node: { sourceUrl: '/demo/demo-02.png' } }, portfolioFields: { specs: [{ label: 'Material', value: 'Antique Bronze' }, { label: 'Finish', value: '3D Die-Struck Relief' }] }, portfolioCategories: { nodes: [{ name: 'Metal Products', slug: 'metal' }] } }
];

export const PORTFOLIO_CATEGORIES = [
  { name: 'Flex Badges', slug: 'flex' },
  { name: 'Embroidery', slug: 'embroidery' },
  { name: 'PVC Patches', slug: 'pvc' },
  { name: 'Metal Products', slug: 'metal' }
];
