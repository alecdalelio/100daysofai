# #100DaysOfAI

A comprehensive AI-native web application documenting a 100-day journey of learning, building, and sharing insights about AI development. Built with modern React, TypeScript, and powered by Supabase with integrated AI functionality.

## 🚀 Live Demo

**URL**: [https://100daysofai.vercel.app](https://100daysofai.vercel.app)

## 📋 Overview

#100DaysOfAI is a sophisticated learning platform that combines daily logging, AI-powered content enhancement, personalized learning paths, and progress tracking. It serves as both a personal learning journal and a public showcase of AI development insights.

### Core Features

**🤖 AI-Powered Log Composition**
- Conversational AI interface for creating daily learning entries
- Multi-modal input support (text, voice, file uploads)
- Intelligent content enhancement and summarization
- Real-time AI assistance with partial response handling

**📚 Personalized Learning System**
- Conversational onboarding with AI learning coach
- Dynamic syllabus generation based on user goals and experience
- Progress tracking with milestone celebrations
- Adaptive content recommendations

**📊 Progress Analytics**
- Visual progress tracking with day counters
- Milestone achievements and celebrations
- Learning insights and pattern recognition
- LinkedIn integration for professional sharing

**👤 Rich User Profiles**
- Customizable avatars with gradient designs
- Professional information and social links
- Timezone-aware content organization
- Account management with real-time updates

**🎨 Modern UI/UX**
- Dark/light theme support with system preference detection
- Responsive design optimized for all devices
- Advanced animations and micro-interactions
- Accessibility-first component design

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with functional components and hooks
- **TypeScript** - Type-safe development with strict configuration
- **Vite** - Fast build tooling and development server
- **React Router DOM** - Client-side routing with protected routes
- **Tailwind CSS** - Utility-first styling with custom design system
- **shadcn/ui** - High-quality, accessible component library
- **Zustand** - Lightweight state management
- **React Query** - Server state management and caching

### Backend & AI
- **Supabase** - Backend-as-a-Service with PostgreSQL database
- **Supabase Edge Functions** - Serverless functions for AI integration
- **OpenAI API** - GPT-powered content enhancement and generation
- **Anthropic Claude** - Conversational AI and analysis
- **Whisper API** - Voice transcription and processing

### Development & Deployment
- **ESLint** - Code linting with React and TypeScript rules
- **Vitest** - Fast unit testing framework
- **Vercel** - Production deployment and hosting
- **GitHub Actions** - CI/CD pipeline automation

## 🎯 Key Features Breakdown

### AI-Powered Content Creation
```typescript
// Conversational log composition with AI assistance
const LogComposer = () => {
  // Real-time AI content enhancement
  // Voice input with automatic transcription
  // Multi-modal content support
  // Intelligent content summarization
}
```

### Intelligent Onboarding
```typescript
// AI Learning Coach guides users through setup
const ConversationalOnboarding = () => {
  // Natural language experience assessment
  // Goal identification and path planning
  // Personalized syllabus generation
  // Adaptive learning recommendations
}
```

### Advanced User Experience
```typescript
// Theme-aware, responsive design
const ThemeProvider = () => {
  // System preference detection
  // Smooth theme transitions
  // Persistent user preferences
}
```

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── onboarding/      # Multi-step onboarding flow
│   └── ...              # Feature-specific components
├── pages/               # Route components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and integrations
├── auth/                # Authentication logic
├── stores/              # State management
└── theme/               # Theme configuration

supabase/
├── functions/           # Edge functions for AI integration
├── migrations/          # Database schema versions
└── config.toml         # Supabase configuration
```

## 🔧 Development Setup

### Prerequisites
- **Node.js 18+** - [Install with nvm](https://github.com/nvm-sh/nvm)
- **Supabase Account** - [Create account](https://supabase.com)
- **OpenAI API Key** - [Get API key](https://openai.com/api)

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Service Keys (for Edge Functions)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/100daysofai.git
cd 100daysofai

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Type checking
npm run typecheck

# Lint code
npm run lint
```

### Database Setup

```bash
# Start Supabase locally (optional)
npx supabase start

# Push schema to remote database
npx supabase db push

# Generate TypeScript types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add all required environment variables
3. **Deploy**: Automatic deployments on push to main branch

### Manual Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to your preferred hosting platform
npm run build && cp -r dist/* /your/deployment/path/
```

## 📖 API Documentation

### Supabase Edge Functions

- **`conversational_onboarding`** - AI-powered user onboarding
- **`conversational_log_composer`** - AI-assisted content creation
- **`ai_enhance`** - Content enhancement and improvement
- **`ai_summarize`** - Intelligent content summarization
- **`generate_syllabus`** - Personalized learning path creation
- **`whisper_transcribe`** - Voice-to-text transcription

### Database Schema

```sql
-- Core tables
profiles              -- User profiles and preferences
log_entries          -- Daily learning entries
syllabi              -- Generated learning plans
conversations        -- AI conversation history
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test src/components/__tests__/Header.test.tsx
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with tests
4. **Run the test suite**: `npm test`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines

- **TypeScript**: Maintain strict type safety
- **Testing**: Write tests for new features
- **UI Components**: Use shadcn/ui primitives when possible
- **Styling**: Follow Tailwind CSS best practices
- **AI Integration**: Test AI functions thoroughly

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** - Backend infrastructure and real-time features
- **shadcn/ui** - Beautiful, accessible component library
- **OpenAI & Anthropic** - AI capabilities and language models
- **Vercel** - Seamless deployment and hosting
- **Lovable** - Initial project scaffolding and development platform

---

**Built with ❤️ and AI during #100DaysOfAI**

Follow the journey: [#100DaysOfAI](https://100daysofai.vercel.app)
