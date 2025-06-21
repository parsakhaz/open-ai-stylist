# AI Fashion Stylist 🤖👗

An intelligent fashion discovery platform that uses AI to help users create personalized mood boards with virtual try-on capabilities.

## 🎯 Project Overview

This application demonstrates an end-to-end AI-powered fashion experience where users can:
- Upload photos for AI validation and virtual try-on
- Chat with an AI stylist to discover clothing items
- Select products and generate personalized mood boards
- View curated collections with simulated try-on results

## ✨ Features Implemented

### 🏠 **Core User Journey**
- **Welcome Page** - Clean landing page with navigation
- **Onboarding** - Photo upload with AI validation
- **AI Chat** - Conversational product discovery
- **Product Selection** - Interactive catalog browsing
- **Mood Board Generation** - AI-powered categorization
- **Gallery** - Personalized collections display

### 🧠 **AI Integration**
- **Image Validation** - AI analyzes photos for try-on suitability
- **Conversational Search** - Natural language product discovery
- **Smart Categorization** - AI decides mood board organization
- **Fashion Expertise** - AI stylist with fashion knowledge

### 💾 **Data Management**
- **Persistent State** - User data saved across sessions
- **Product Catalog** - Searchable fashion item database
- **Mood Board Storage** - Collection management
- **Image Management** - Photo validation and storage

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management

### **AI & APIs**
- **Vercel AI SDK** - Streaming AI interactions
- **OpenAI-Compatible APIs** - LLM integration (Groq, Together.ai, etc.)
- **Llama 3.1** - Vision and text models
- **Fashn.ai** - Virtual try-on (planned integration)

### **Architecture**
- **API Routes** - Serverless backend functions
- **Client Components** - Interactive React components
- **Middleware** - Request/response handling
- **File System** - Static asset management

## 🚀 Current Status

### ✅ **Completed Features**
- [x] Complete project structure and navigation
- [x] State management with Zustand + persistence
- [x] Product catalog with JSON data
- [x] AI chat interface (ready for API keys)
- [x] Product selection and mood board creation
- [x] Gallery display system
- [x] Responsive design
- [x] Error handling and user feedback

### 🔄 **In Progress**
- [ ] AI model integration (requires API keys)
- [ ] Virtual try-on implementation
- [ ] Enhanced product search algorithms
- [ ] Image optimization

### 📋 **Next Steps**
- [ ] Real product image integration
- [ ] User authentication system
- [ ] Advanced filtering and recommendations
- [ ] Social sharing features
- [ ] Mobile app development

## 🔧 Setup Instructions

### **Prerequisites**
- Node.js 18+ 
- npm/yarn/pnpm
- AI API access (Groq, Together.ai, etc.)

### **Installation**

1. **Clone the repository**
```bash
git clone <repository-url>
cd open-ai-stylist
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Create .env.local file
cp .env.example .env.local
```

4. **Add your API keys to `.env.local`**
```env
# Required for AI features
LLAMA_API_KEY="your_llama_api_key_here"
LLAMA_API_BASE_URL="https://api.groq.com/openai/v1"

# Optional for virtual try-on
FASHN_AI_API_KEY="your_fashn_api_key_here"
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**
Visit [http://localhost:3000](http://localhost:3000)

### **API Key Setup**

#### **Groq (Recommended - Free Tier)**
1. Sign up at [console.groq.com](https://console.groq.com/)
2. Create an API key
3. Use `https://api.groq.com/openai/v1` as base URL
4. Available models: `llama-3.1-70b-versatile`, `llama-3.1-8b-instant`

#### **Together.ai (Alternative)**
1. Sign up at [api.together.xyz](https://api.together.xyz/)
2. Create an API key
3. Use `https://api.together.xyz/v1` as base URL

## 🏗️ Architecture Overview

```
📦 AI Fashion Stylist
├── 🎨 Frontend (Next.js + React)
│   ├── Pages (App Router)
│   ├── Components (UI Elements)
│   └── State (Zustand Store)
├── 🔌 API Layer (Next.js API Routes)
│   ├── /api/chat (AI Stylist)
│   ├── /api/validate-image (Photo Validation)
│   └── /api/generate-moodboard (AI Categorization)
├── 🤖 AI Integration (Vercel AI SDK)
│   ├── Text Generation (Chat)
│   ├── Image Analysis (Validation)
│   └── Tool Usage (Product Search)
└── 💾 Data Layer
    ├── Product Catalog (JSON)
    ├── User State (LocalStorage)
    └── Static Assets (Images)
```

## 🔍 API Endpoints

### **POST /api/chat**
- **Purpose**: AI stylist conversation with product search
- **Input**: User messages
- **Output**: AI responses with product recommendations
- **Features**: Tool usage, streaming responses

### **POST /api/validate-image**
- **Purpose**: Validate uploaded photos for try-on suitability
- **Input**: Base64 image data
- **Output**: Approval status and feedback
- **AI Model**: Llama 3.1 Vision

### **POST /api/generate-moodboard**
- **Purpose**: Generate mood boards from selected products
- **Input**: Selected products, user photos, existing boards
- **Output**: Categorized mood board with try-on URLs
- **Features**: AI categorization, virtual try-on simulation

## 🎨 User Interface

### **Design System**
- **Colors**: Indigo primary, gray neutrals
- **Typography**: Inter font family
- **Layout**: Responsive grid system
- **Interactions**: Hover states, transitions

### **Component Library**
- Navigation bar with active states
- Product cards with selection
- Chat interface with message bubbles
- Loading states and error handling
- Modal dialogs and form elements

## 🐛 Known Issues

### **Tailwind CSS Warnings**
```
Error: Cannot apply unknown utility class `bg-gray-50`
```
- **Cause**: Tailwind CSS v4 compatibility
- **Status**: Non-blocking, app functions normally
- **Solution**: Update to stable Tailwind configuration

### **API Key Requirements**
- AI features require valid API keys
- Mock responses available for testing
- Full functionality needs Groq/Together.ai access

## 🚀 Deployment

### **Vercel (Recommended)**
1. Connect GitHub repository
2. Add environment variables
3. Deploy with one click

### **Environment Variables for Production**
```env
LLAMA_API_KEY=your_production_key
LLAMA_API_BASE_URL=your_provider_url
FASHN_AI_API_KEY=your_fashn_key
```

## 🤝 Contributing

### **Development Workflow**
1. Create feature branch
2. Implement changes
3. Test thoroughly
4. Submit pull request

### **Code Style**
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Component documentation

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com/)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Next.js Team** - Amazing React framework
- **Vercel** - AI SDK and hosting platform
- **Meta** - Llama 3.1 models
- **Fashion Industry** - Inspiration and domain knowledge

---

Built with ❤️ using Next.js, AI, and modern web technologies.
