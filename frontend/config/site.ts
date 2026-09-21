export const siteConfig = {
  name: "Verve & Weave",
  shortName: "Verve",
  description:
    "Premium ready-to-wear and fully custom clothing. Design your own garment with real-time preview, or shop our curated collections.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og-image.svg",
  keywords: [
    "custom clothing",
    "custom apparel",
    "garment customizer",
    "custom t-shirts",
    "custom embroidery",
    "premium fabrics",
  ],
  links: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    pinterest: "https://pinterest.com",
  },
  contactEmail: "hello@verveandweave.com",
  contactPhone: "+91 98765 43210",
  supportHours: "Mon–Sat, 10am–7pm IST",
};

export const mainNav = [
  { label: "Shop", href: "/shop" },
  { label: "Customize", href: "/customize" },
  { label: "Fabrics", href: "/fabrics" },
  { label: "Collections", href: "/collections" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "About", href: "/about" },
];

export const footerNav = {
  shop: [
    { label: "All Products", href: "/shop" },
    { label: "Customize a Garment", href: "/customize" },
    { label: "Fabrics", href: "/fabrics" },
    { label: "Collections", href: "/collections" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
  ],
  account: [
    { label: "My Account", href: "/account" },
    { label: "Order History", href: "/account/orders" },
    { label: "Saved Designs", href: "/account/designs" },
    { label: "Wishlist", href: "/account/wishlist" },
  ],
};

export const ANNOUNCEMENT_MESSAGES = [
  "Free shipping across India on orders above ₹2,999",
  "New: Design your own garment with live preview — try the Customizer",
  "Use code WELCOME10 for 10% off your first order",
];
