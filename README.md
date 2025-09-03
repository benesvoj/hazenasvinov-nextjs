# 🏐 TJ Sokol Svinov - Club Management System

A comprehensive web application for managing TJ Sokol Svinov, a traditional Czech handball club with over 100 years of history. Built with Next.js 15, Supabase, and modern web technologies.

## 🌟 Features

### 🏠 Public Website
- **Landing Page**: Modern, responsive homepage with club information
- **Match Schedule**: Live results and upcoming matches
- **Photo Gallery**: Club photos and events
- **Blog Posts**: News and announcements
- **Team Information**: Player rosters and team details
- **Standings**: League tables and statistics

### 👨‍💼 Admin Portal
- **User Management**: Invite users, manage roles, track login history
- **Content Management**: Create and edit blog posts, manage categories
- **Match Management**: Add matches, import from Excel, generate standings
- **Team Management**: Organize teams, assign players, manage seasons
- **Member Management**: Club member database with functions and roles
- **Photo Gallery**: Upload and organize club photos
- **Video Management**: Training videos and materials
- **Club Configuration**: Customize club settings and visibility

### 🏃‍♂️ Coach Portal
- **Dashboard**: Overview of assigned teams and responsibilities
- **Team Management**: Manage your teams and players
- **Training Materials**: Access to training videos and resources
- **Match Reports**: Submit match results and statistics

### 🔐 Authentication & Security
- **Email Invitations**: Secure user invitation system
- **Password Management**: Secure password reset and creation
- **Role-Based Access**: Admin, Coach, and Head Coach roles
- **Login Logging**: Track user access and security events

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: HeroUI (NextUI)
- **Styling**: Tailwind CSS with dark mode support
- **Icons**: Heroicons
- **Language**: TypeScript
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hazenasvinov_nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Database Setup**
   - Run the SQL scripts in the `scripts/` directory to set up your database
   - Start with `create_tables.sql` and follow the setup instructions in the `docs/` folder

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (main)/            # Public website pages
│   ├── admin/             # Admin portal pages
│   ├── coaches/           # Coach portal pages
│   ├── login/             # Authentication pages
│   └── api/               # API routes
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── types/                 # TypeScript type definitions
├── utils/                 # Helper functions
└── constants/             # Application constants

docs/                      # Documentation and setup guides
scripts/                   # Database setup scripts
email-templates/           # Email template files
```

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Authentication Setup](docs/AUTHENTICATION_SETUP.md)** - User management and roles
- **[Blog Posts Setup](docs/BLOG_POSTS_SETUP.md)** - Content management
- **[Club Management Setup](docs/CLUB_MANAGEMENT_SETUP.md)** - Club configuration
- **[Coaches Portal Setup](docs/COACHES_PORTAL_SETUP.md)** - Coach portal configuration
- **[Email Templates Setup](docs/EMAIL_TEMPLATES_SETUP.md)** - Email customization
- **[Navigation Setup](docs/README_navigation.md)** - Menu configuration
- **[User Roles System](docs/USER_ROLES_SYSTEM.md)** - Role-based access control

## 🎨 UI/UX Features

- **Dark Mode Support**: Full dark/light theme switching
- **Responsive Design**: Mobile-first approach
- **Modern UI**: Clean, professional interface using HeroUI
- **Accessibility**: WCAG compliant components
- **Toast Notifications**: User-friendly feedback system
- **Loading States**: Smooth loading experiences

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with Next.js rules
- **Prettier**: Code formatting
- **Conventional Commits**: Standardized commit messages

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software for TJ Sokol Svinov. All rights reserved.

## 🏆 About TJ Sokol Svinov

TJ Sokol Svinov is a traditional Czech handball club with over 100 years of history. We are part of the Czech sports environment and have achieved numerous successes in adult and youth competitions.

## 📞 Support

For technical support or questions:
- **Email**: web@hazenasvinov.cz
- **Website**: [hazenasvinov.cz](https://hazenasvinov.cz)

---

**Built with ❤️ for TJ Sokol Svinov**