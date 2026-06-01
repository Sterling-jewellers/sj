export interface JournalArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  image: string;
  date: string;
}

export const articles: JournalArticle[] = [
  {
    slug: '4-cs-of-diamonds',
    title: 'The 4 Cs of Diamonds Explained',
    excerpt: "Cut, Colour, Clarity and Carat — a plain-English guide to the grading system that determines a diamond's beauty and value. Everything you need to know before you buy.",
    category: 'Diamond Guide',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=800&h=500&fit=crop',
    date: 'May 2026',
  },
  {
    slug: 'how-to-measure-ring-size',
    title: 'How to Measure Ring Size at Home',
    excerpt: 'An accurate ring size is essential — especially for a surprise proposal. Our step-by-step guide covers three reliable methods, plus a printable ring sizer you can use right now.',
    category: 'Buying Guide',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=500&fit=crop',
    date: 'May 2026',
  },
  {
    slug: 'lab-grown-vs-natural-diamonds',
    title: 'Lab-Grown vs Natural Diamonds: An Honest Comparison',
    excerpt: 'Are lab-grown diamonds "real"? Are they worth buying? We compare the two honestly — covering chemistry, certification, resale value, and which is right for your budget.',
    category: 'Diamond Guide',
    readTime: '10 min read',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=500&fit=crop',
    date: 'May 2026',
  },
  {
    slug: 'how-to-plan-a-proposal',
    title: 'The Ultimate Proposal Planning Guide',
    excerpt: 'From choosing the ring to setting the scene — a practical, romantic guide to planning a proposal your partner will never forget.',
    category: 'Inspiration',
    readTime: '12 min read',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&h=500&fit=crop',
    date: 'May 2026',
  },
];
