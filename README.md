# FinTrack — Modern Personal Finance Dashboard

FinTrack is a premium, high-performance financial management application built with React, Vite, and Supabase. It features real-time synchronization, enterprise-grade security (RLS), and a world-class UI/UX.

## Core Features
- **Secure Authentication**: Email/Password and Google OAuth integration via Supabase.
- **Data Isolation**: Row Level Security (RLS) ensures your financial data is accessible only by you.
- **Optimistic UI**: Instant feedback on transactions with background sync and retry logic.
- **Accessibility**: WCAG 2.1 compliant interface with semantic HTML and ARIA support.
- **Multi-lingual**: Full support for English and Bengali (BN).

## Requirements
- **Node.js**: v18.0.0 or higher
- **Supabase**: An active Supabase project
- **Google Cloud**: A project with OAuth 2.0 configured

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/redwan2003-bot/FinTrack.git
   cd FinTrack
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Initialize Database**:
   - Copy the contents of `supabase/schema.sql`.
   - Paste them into the **Supabase SQL Editor** and click **Run**.
   - This will create the necessary tables and enable security policies.

5. **Run the development server**:
   ```bash
   npm run dev
   ```

## Google OAuth Configuration

To enable "Continue with Google":
1. Enable the Google Provider in **Supabase > Authentication > Providers**.
2. Create OAuth credentials in the [Google Cloud Console](https://console.cloud.google.com/).
3. Add the Supabase Callback URL to Google's "Authorized redirect URIs".
4. Set the **Site URL** in Supabase to `https://redwan2003-bot.github.io/FinTrack/`.

## Running Tests

FinTrack uses **Vitest** for automated testing of store logic and business rules.

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui
```

## Architecture
- **State Management**: Zustand (modular stores for Auth, Transactions, Budgets).
- **Styling**: Vanilla CSS with modern Design Tokens and Framer Motion.
- **Icons**: Lucide React.
- **Testing**: Vitest + React Testing Library.

## Contributing
1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit your changes: `git commit -m 'Add amazing feature'`
3. Push to the branch: `git push origin feature/amazing-feature`
4. Open a Pull Request.
