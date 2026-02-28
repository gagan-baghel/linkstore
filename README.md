# LinkStore 🛍️

> **Your Personal E-Commerce Storefront for Affiliate Links.**

LinkStore is a dedicated platform designed specifically for influencers, content creators, and affiliate marketers. It solves the common problem of "link-in-bio" limitations by providing users with a beautiful, customizable landing page that functions as their own personal e-commerce store. 

Instead of sharing messy individual affiliate links, creators can share a single LinkStore profile link. 

## ✨ The Problem It Solves
Social media platforms often limit users to a single "link in bio", making it difficult for influencers to promote multiple affiliate products simultaneously. Current solutions are often just plain lists of links, lacking the visual appeal needed to drive conversions.

## 🚀 Key Features

*   **User Accounts & Profiles:** Creators can seamlessly sign up, customize their profiles, and launch their own branded store landing page.
*   **One-Click Product Import:** Simply paste an affiliate/referral link, and LinkStore automatically fetches the necessary product metadata (images, title, description, price).
*   **E-Commerce Aesthetic:** Products are displayed in a clean, modern grid—just like a real online store, providing a better shopping experience for the creator's audience.
*   **Easy Sharing:** Creators get a single, clean URL (e.g., `linkstore.io/username`) to put in their social media bios, directing followers to their entire curated product catalog.
*   **Analytics Dashboard (Planned):** Track clicks, views, and conversions to understand which products are performing best.

## 🛠️ Tech Stack

*   **Frontend:** Next.js (React), Tailwind CSS, Framer Motion (for smooth animations)
*   **Backend:** Next.js API Routes + Convex functions
*   **Database:** Convex
*   **Link Scraping/Metadata Fetching:** Cheerio or Puppeteer (to extract Open Graph tags from affiliate links)
*   **Authentication:** NextAuth.js or Clerk
*   **Hosting:** Vercel (Frontend) & Supabase/Neon (Database)

## 🏗️ How It Works (User Flow)

1.  **Sign Up:** An influencer creates an account on LinkStore.
2.  **Add a Link:** They paste a product affiliate link (e.g., from Amazon, LTK, or an independent brand) into their dashboard.
3.  **Auto-Fetch:** The backend scrapes the target URL to grab the product image, title, and description.
4.  **Publish:** The product is instantly added to their public-facing LinkStore profile.
5.  **Share:** The influencer shares their LinkStore URL with their followers, driving traffic and earning commissions.

## 💻 Getting Started (Development)

```bash
# Clone the repository
git clone https://github.com/yourusername/linkstore.git

# Navigate to directory
cd linkstore

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Set your Convex deployment URL in .env.local
# CONVEX_URL=...
# NEXT_PUBLIC_CONVEX_URL=...

# Start the development server
npm run dev
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📄 License
This project is licensed under the [MIT License](LICENSE).
