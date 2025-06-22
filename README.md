# StyleList - AI Fashion Stylist

An AI-powered fashion styling application that provides personalized clothing recommendations using computer vision and natural language processing. Users can upload photos and receive styling advice focused on tops and bottoms, with integrated product search capabilities.

## Features

### Core Functionality
- **AI Fashion Stylist**: Conversational interface powered by Llama-4-Maverick-17B model
- **Image Analysis**: Upload photos to receive personalized styling recommendations
- **Product Search**: Integration with Amazon product catalog via RapidAPI
- **Moodboard Creation**: Visual collections of selected clothing items
- **Multi-Modal Chat**: Support for both text and image inputs in conversations

### Technical Capabilities
- **Streaming AI Responses**: Real-time conversation with markdown formatting
- **Image Validation**: AI-powered photo quality assessment
- **Persistent State**: Cross-session data storage using Zustand
- **Responsive Design**: Mobile and desktop optimized interface

## Technology Stack

### Frontend
- **Next.js 15** with App Router and TypeScript
- **React 18** with server and client components
- **Tailwind CSS** for styling and responsive design
- **Zustand** for state management with persistence
- **React Markdown** for formatted AI responses
- **Lucide Icons** for UI iconography

### Backend & APIs
- **Vercel AI SDK** for streaming AI interactions
- **Amazon Product API** via RapidAPI for product data
- **Custom API routes** for chat, image validation, and moodboard generation
- **Server actions** for form handling and data processing

### AI Integration
- **Llama-4-Maverick-17B-128E-Instruct-FP8** model for fashion expertise
- **Vision capabilities** for image analysis and styling recommendations
- **Tool calling** for product search integration
- **Custom system prompts** optimized for fashion styling

## Getting Started

### Prerequisites
- Node.js 18.0 or later
- npm or yarn package manager
- RapidAPI account for Amazon product access

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd open-ai-stylist
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env.local` file with the following:
```env
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=real-time-amazon-data.p.rapidapi.com
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Initial Setup
1. Navigate to the onboarding page to upload approved model photos
2. Photos are validated using AI for styling suitability
3. Approved photos are stored for use in styling conversations

### Styling Conversations
1. Start a new chat session
2. Upload a photo or describe your styling needs
3. Receive personalized recommendations for tops and bottoms
4. Browse suggested products with real-time Amazon pricing
5. Select items to create moodboards

### Moodboard Management
1. Select products during conversations
2. Create themed collections with AI-generated titles
3. View products in responsive grid layouts
4. Access direct purchase links for selected items

## API Endpoints

### `/api/chat`
Main chat interface supporting both text and image inputs
- **Method**: POST
- **Input**: Message array with text/image content
- **Output**: Streaming AI responses with tool calls
- **Features**: Context awareness, product search integration

### `/api/validate-image`
Image quality validation for styling purposes
- **Method**: POST  
- **Input**: Base64 encoded image data
- **Output**: Validation result with feedback
- **AI Model**: Vision-enabled analysis

### `/api/generate-moodboard`
Moodboard creation and product categorization
- **Method**: POST
- **Input**: Selected products and user preferences
- **Output**: Categorized collections with metadata

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   ├── chat/              # Chat interface pages
│   ├── gallery/           # Moodboard gallery
│   ├── onboarding/        # Photo upload flow
│   └── store/             # Zustand state management
├── components/            # Reusable React components
│   ├── aceternity/        # Third-party UI components
│   └── ui/                # Custom UI components
└── lib/                   # Utility functions and services
```

## Configuration

### Environment Variables
- `RAPIDAPI_KEY`: Authentication key for Amazon product API
- `RAPIDAPI_HOST`: API host endpoint for product search

### Model Configuration
The application uses Llama-4-Maverick-17B-128E-Instruct-FP8 with custom system prompts optimized for:
- Fashion styling expertise
- Focus on tops and bottoms (excluding accessories)
- Professional styling advice
- Product recommendation workflow

## Development

### Code Quality
- TypeScript for type safety
- ESLint configuration for code standards
- Component-based architecture
- Error boundary implementation

### State Management
- Zustand store with persistence
- Modular state slices for different features
- Cross-component state sharing
- Local storage integration

### Styling System
- Tailwind CSS utility classes
- Custom component styling
- Responsive design patterns
- Dark/light theme support

## Deployment

### Vercel (Recommended)
The application is optimized for Vercel deployment:

```bash
vercel --prod
```

### Environment Setup
Ensure all environment variables are configured in your deployment platform:
- `RAPIDAPI_KEY`
- `RAPIDAPI_HOST`

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

Please ensure code follows the existing style and includes appropriate documentation.
