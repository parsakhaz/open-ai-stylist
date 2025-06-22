'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AuroraBackground } from '@/components/aceternity/aurora-background';
import { TypewriterEffectSmooth } from '@/components/aceternity/typewriter-effect';
import { motion } from 'framer-motion';
import { Sparkles, Heart, ShoppingBag, Star, Zap, MessageCircle } from 'lucide-react';

export default function HomePage() {
  const words = [
    { text: "Discover" },
    { text: "real" },
    { text: "fashion" },
    { text: "with", className: "text-gray-700 dark:text-gray-300" },
    { text: "AI", className: "text-black dark:text-white" },
  ];

  const features = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Chat with your StyleList",
      description: "Your AI fashion stylist understands natural language"
    },
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      title: "Real Amazon Products",
      description: "Live prices, ratings, and Prime delivery"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Beautiful Mood Boards",
      description: "AI creates stunning collections for you"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal geometric background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 border border-gray-100 rounded-full opacity-30"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-gray-50 rounded-full opacity-50"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-px h-64 bg-gray-200 opacity-30"></div>
      </div>

      <div className="relative">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0.0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="text-center max-w-6xl mx-auto"
          >
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 border border-gray-200 mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Sparkles className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Now with Real-Time Amazon Integration</span>
            </motion.div>
            
            {/* Main Heading */}
            <div className="mb-6">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-black tracking-tight leading-tight">
                AI Fashion Stylist
              </h1>
            </div>
            
            {/* Typewriter Effect */}
            <div className="mb-8">
              <TypewriterEffectSmooth words={words} />
            </div>
            
            {/* Description */}
            <motion.p 
              className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              Chat naturally about your style, get instant access to real Amazon products with live pricing, and create stunning mood boards that make shopping effortless.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <Link href="/onboarding">
                <Button 
                  size="lg" 
                  className="bg-black hover:bg-gray-800 text-white border-0 px-8 py-4 text-lg h-auto rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Start Your Style Journey
                </Button>
              </Link>
              
              <Link href="/chat">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg h-auto rounded-lg transition-all duration-300"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat with StyleList
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24 px-4">
          <motion.div 
            className="max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-gray-50 rounded-xl p-8 border border-gray-200 text-center hover:bg-gray-100 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  viewport={{ once: true }}
                >
                  <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-black flex items-center justify-center text-white">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-medium text-black mb-3">{feature.title}</h3>
                  <p className="text-gray-600 font-light leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="py-16 lg:py-20 px-4">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
              <div className="bg-gray-50 rounded-xl px-8 py-6 border border-gray-200 text-center">
                <div className="text-3xl lg:text-4xl font-light text-black mb-2">1M+</div>
                <div className="text-gray-600 font-medium">Fashion Items</div>
              </div>
              <div className="bg-gray-50 rounded-xl px-8 py-6 border border-gray-200 text-center">
                <div className="flex items-center justify-center gap-2 text-3xl lg:text-4xl font-light text-black mb-2">
                  <Star className="w-6 h-6 text-gray-600 fill-gray-600" />
                  Live
                </div>
                <div className="text-gray-600 font-medium">Amazon Pricing</div>
              </div>
              <div className="bg-gray-50 rounded-xl px-8 py-6 border border-gray-200 text-center">
                <div className="text-2xl lg:text-3xl font-light text-black mb-2">AI-Powered</div>
                <div className="text-gray-600 font-medium">Style Discovery</div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-gray-100">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-500 mb-4">
              No account needed • Start styling in seconds • Real Amazon products
            </p>
            <div className="flex items-center justify-center gap-3 text-gray-400 text-sm">
              <span>Powered by</span>
              <div className="flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                <span>AI</span>
              </div>
              <span>•</span>
              <span>Amazon API</span>
              <span>•</span>
              <span>Next.js</span>
            </div>
          </motion.div>
        </footer>
      </div>
    </div>
  );
}
