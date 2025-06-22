# AI Fashion Stylist 🤖✨

A real-time AI-powered fashion discovery platform that connects users with Amazon's vast clothing catalog through intelligent conversation and creates stunning mood boards with rich product data.

## 🎯 What This Is

Transform the way you discover fashion with our AI stylist "Chad" - chat naturally about what you're looking for, get instant access to real Amazon products with live pricing, ratings, and Prime status, then create beautiful mood boards to curate your style.

**🔥 Now Featuring Real-Time Amazon Integration!**

## ✨ Live Features

### 🛍️ **Real-Time Amazon Search**
- **Live Product Data** - Real prices, ratings, Prime status, and availability
- **Intelligent Search** - AI understands "Korean minimal black jacket" or "streetwear oversized hoodie"  
- **Rich Product Cards** - See prices, star ratings, review counts, and Prime badges
- **Direct Purchase** - Click through to buy on Amazon instantly

### 🤖 **AI Fashion Stylist "Chad"**
- **Natural Conversation** - "I need something casual for weekend brunch"
- **Context Awareness** - Remembers your style preferences throughout the chat
- **Smart Recommendations** - Gets more specific when you're too vague
- **Visual Search Results** - See products instantly as you chat

### 📸 **Smart Photo Validation**
- **AI Photo Analysis** - Upload photos for virtual try-on suitability
- **Instant Feedback** - Get immediate approval or suggestions for better shots
- **Quality Assessment** - AI ensures photos work well with fashion recommendations

### 🎨 **Intelligent Mood Boards**
- **AI Categorization** - Automatically organizes products into themed collections
- **Beautiful Layouts** - Pinterest-style grids with hover effects
- **Purchase Integration** - Direct links to buy any item
- **Collection Management** - Build multiple mood boards for different styles

### 💾 **Persistent Experience**
- **Cross-Session Memory** - Your selections and conversations are saved
- **Multi-Chat Support** - Manage multiple style conversations
- **Real-Time Sync** - Seamlessly switch between devices

## 🛠️ Tech Stack

### **Frontend Excellence**
- **Next.js 15** - React framework with App Router and TypeScript
- **Tailwind CSS** - Beautiful, responsive design system
- **Zustand** - Lightweight, persistent state management
- **Lucide Icons** - Modern icon system
- **Aceternity UI** - Premium component library

### **AI & Real-Time APIs**
- **Vercel AI SDK** - Streaming AI conversations with tool usage
- **Amazon Product API** - Live product data via RapidAPI
- **Llama 3.1** - Advanced language model for fashion expertise
- **Axios** - Reliable API communication

### **Modern Architecture**
- **Serverless Functions** - Fast, scalable API routes
- **Real-Time Streaming** - Instant AI responses
- **Type Safety** - Full TypeScript coverage
- **Error Boundaries** - Graceful failure handling

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+
- Amazon Product API access (included in setup)

### **5-Minute Setup**

1. **Clone & Install**
```bash
git clone https://github.com/your-username/open-ai-stylist.git
cd open-ai-stylist
npm install
```

2. **Configure APIs**
Create `.env.local`:
```env
# Real-Time Amazon Data API (RapidAPI)
RAPIDAPI_KEY=01111002ebmsh49690c753d958adp179715jsnc34e9fcbbfac
RAPIDAPI_HOST=real-time-amazon-data.p.rapidapi.com
```

3. **Launch**
```bash
npm run dev
```

4. **Start Shopping**
Visit [http://localhost:3000](http://localhost:3000) and start chatting with Chad!

## 🌟 User Journey

### **1. Upload Your Photo** 📷
- Take or upload a clear photo of yourself
- AI validates it's suitable for fashion recommendations
- Get instant feedback and suggestions

### **2. Chat with Chad** 💬
- "Find me a Korean minimal black jacket under $100"
- "I need streetwear for a casual date"
- "Show me work outfits that are comfortable"

### **3. Discover Real Products** 🛍️
- See live Amazon products with real prices
- Check star ratings and review counts
- Spot Prime delivery options
- Select items you love

### **4. Create Mood Boards** 🎨
- AI automatically categorizes your selections
- Beautiful grid layouts with hover effects
- Direct purchase links for each item
- Build multiple themed collections

### **5. Shop & Style** ✨
- Click through to Amazon for instant purchase
- Share mood boards with friends
- Build your personal style library

## 🎨 What Makes This Special

### **🧠 Intelligent Conversations**
Unlike simple search, Chad understands context:
- "Korean minimal" + "winter jacket" = finds the perfect aesthetic
- Remembers you mentioned "work appropriate" earlier in the chat
- Asks clarifying questions when you're too vague

### **🛍️ Real Shopping Data**
Every product shows:
- ✅ Current Amazon price
- ⭐ Star rating and review count  
- 📦 Prime delivery status
- 🔗 Direct purchase link

### **🎨 Beautiful Mood Boards**
- Pinterest-style responsive grids
- Hover animations and smooth transitions
- AI-generated titles and descriptions
- Seamless shopping integration

### **⚡ Performance & UX**
- Instant loading with smart caching
- Real-time AI streaming
- Responsive on all devices
- Elegant error handling

## 🏗️ Technical Architecture

```
🎯 Frontend Layer (Next.js + TypeScript)
├── 🏠 Pages (App Router with dynamic routes)
├── 🎨 Components (Reusable UI with Tailwind)
├── 💾 State (Zustand with persistence)
└── 🔧 Utils (Type-safe helpers)

🔌 API Layer (Serverless Functions)
├── 💬 /api/chat (AI stylist with real-time tools)
├── 📷 /api/validate-image (AI photo analysis)
├── 🎨 /api/generate-moodboard (Smart categorization)
└── 🛍️ Amazon Product Service (Live data integration)

🤖 AI Integration (Vercel AI SDK)
├── 🧠 Conversational AI (Context-aware fashion advice)
├── 🔧 Tool Usage (Real-time product search)
├── 📊 Streaming (Instant response rendering)
└── 💡 Smart Prompting (Fashion domain expertise)

🛍️ Amazon Integration (RapidAPI)
├── 🔍 Product Search (Live catalog access)
├── 💰 Pricing Data (Real-time prices)
├── ⭐ Reviews & Ratings (Social proof)
└── 📦 Prime Status (Delivery information)
```

## 📊 API Endpoints

### **POST /api/chat**
Real-time AI fashion stylist with tool usage
- **Input**: Conversation messages
- **Output**: Streaming AI responses with live Amazon products
- **Features**: Context memory, tool integration, error handling

### **POST /api/validate-image** 
AI-powered photo validation for fashion recommendations
- **Input**: Base64 encoded image
- **Output**: Validation status with feedback
- **AI**: Llama 3.1 Vision analysis

### **POST /api/generate-moodboard**
Intelligent mood board creation and categorization
- **Input**: Selected products, user preferences
- **Output**: Categorized collections with AI-generated metadata
- **Features**: Smart grouping, title generation, duplicate detection

## 🎨 Design System

### **Visual Identity**
- **Primary**: Indigo gradients with modern depth
- **Secondary**: Warm grays with perfect contrast
- **Accents**: Amazon orange, Prime blue, rating gold
- **Typography**: Inter font family with optical sizing

### **Component Philosophy**
- **Cards**: Elevated surfaces with subtle shadows
- **Interactions**: Smooth micro-animations
- **Layouts**: Responsive grids that adapt beautifully
- **Loading**: Skeleton states and smooth transitions

### **Mood Board Aesthetics**
- **Backgrounds**: Subtle gradients and textures
- **Grids**: Masonry-style layouts with smart spacing
- **Images**: Optimized loading with elegant hover states
- **Purchase**: Clear call-to-action integration

## 🚀 Deployment Options

### **Vercel (Recommended)**
```bash
npm i -g vercel
vercel --prod
```
- Automatic SSL and global CDN
- Environment variable management
- Zero-configuration deployment

### **Environment Variables**
```env
# Production Configuration
RAPIDAPI_KEY=your_production_key
RAPIDAPI_HOST=real-time-amazon-data.p.rapidapi.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 📈 Performance & Scale

### **Optimization Features**
- ⚡ Serverless API routes for instant scaling
- 🖼️ Optimized image loading with Next.js Image
- 💾 Smart caching for Amazon product data
- 📱 Responsive design for all screen sizes
- 🧠 AI response streaming for perceived speed

### **Production Ready**
- 🛡️ Error boundaries and graceful fallbacks
- 📊 Built-in analytics hooks
- 🔒 Secure API key management
- 🌍 Global CDN deployment
- 📈 Auto-scaling serverless infrastructure

## 🤝 Contributing

### **Development Setup**
```bash
git clone <repo>
cd open-ai-stylist
npm install
cp .env.example .env.local
npm run dev
```

### **Code Quality**
- TypeScript strict mode
- ESLint + Prettier configuration
- Component-driven development
- Comprehensive error handling

## 🔗 Links & Resources

- **[Live Demo](https://your-demo-url.com)** - Try it now!
- **[API Documentation](./docs/api.md)** - Technical details
- **[Design System](./docs/design.md)** - UI guidelines
- **[Deployment Guide](./docs/deployment.md)** - Go live steps

## 📄 License

MIT License - Build something amazing! 

## 🙏 Special Thanks

- **Amazon** - For the incredible product catalog API
- **Vercel** - For the amazing AI SDK and hosting
- **Next.js Team** - For the best React framework
- **Fashion Community** - For inspiration and feedback

---

**Built with ❤️ for fashion lovers who want AI-powered discovery and real shopping integration.**

🎯 **Ready to revolutionize how you discover fashion? [Get started now!](http://localhost:3000)**
