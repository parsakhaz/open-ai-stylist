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
      title: "Chat with Chad",
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

      <div className="relative min-h-screen flex flex-col">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="flex-1 flex flex-col gap-8 items-center justify-center px-4 pt-20"
        >
          {/* Main Heading */}
          <div className="text-center space-y-6">
            <motion.div 
              className="inline-flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 border border-gray-200"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Sparkles className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Now with Real-Time Amazon Integration</span>
            </motion.div>
            
            <div className="text-4xl md:text-8xl font-light text-black text-center tracking-tight">
              AI Fashion Stylist
            </div>
            
            <TypewriterEffectSmooth words={words} />
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              Chat naturally about your style, get instant access to real Amazon products with live pricing, and create stunning mood boards that make shopping effortless.
            </motion.p>
          </div>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 items-center"
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
                Chat with Chad
              </Button>
            </Link>
          </motion.div>

          {/* Feature Showcase */}
          <motion.div 
            className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center hover:bg-gray-100 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + index * 0.1 }}
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-black flex items-center justify-center text-white">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-medium text-black mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm font-light">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats Section */}
          <motion.div 
            className="flex flex-wrap justify-center gap-8 mt-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
          >
            <div className="bg-gray-50 rounded-lg px-6 py-3 border border-gray-200">
              <div className="text-2xl font-light text-black">1M+</div>
              <div className="text-gray-600 text-sm">Fashion Items</div>
            </div>
            <div className="bg-gray-50 rounded-lg px-6 py-3 border border-gray-200">
              <div className="flex items-center justify-center gap-1 text-2xl font-light text-black">
                <Star className="w-5 h-5 text-gray-600 fill-gray-600" />
                Live
              </div>
              <div className="text-gray-600 text-sm">Amazon Pricing</div>
            </div>
            <div className="bg-gray-50 rounded-lg px-6 py-3 border border-gray-200">
              <div className="text-2xl font-light text-black">AI-Powered</div>
              <div className="text-gray-600 text-sm">Style Discovery</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          className="text-center pb-12 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          <p className="text-gray-500 text-sm mb-4">
            No account needed • Start styling in seconds • Real Amazon products
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
            <span>Powered by</span>
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>AI</span>
            </div>
            <span>•</span>
            <span>Amazon API</span>
            <span>•</span>
            <span>Next.js</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
