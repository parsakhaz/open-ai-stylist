'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Palette, Scissors, ShirtIcon } from 'lucide-react';

const fashionFacts = [
  "Coco Chanel invented the little black dress in 1926",
  "The first fashion magazine was published in 1586",
  "Blue jeans were originally created for gold miners",
  "Haute couture pieces can take 700+ hours to create",
  "The fashion industry employs over 75 million people worldwide",
  "Sneakers were called 'sneakers' because they're silent when walking",
  "The zipper was invented in 1893 but not used in fashion until 1930",
  "Fashion Week started in New York City in 1943",
  "The average person owns 120 pieces of clothing",
  "Stiletto heels were inspired by weapons",
  "The color purple was once reserved only for royalty",
  "Vintage fashion refers to clothing 20+ years old",
  "The fashion cycle typically lasts 5-7 years",
  "Tweed fabric originated in Scotland in the 1800s",
  "The handbag industry is worth over $30 billion globally",
];

const icons = [Sparkles, Palette, Scissors, ShirtIcon];

export function FashionLoading() {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [currentIconIndex, setCurrentIconIndex] = useState(0);

  useEffect(() => {
    const factInterval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % fashionFacts.length);
    }, 3000);

    const iconInterval = setInterval(() => {
      setCurrentIconIndex((prev) => (prev + 1) % icons.length);
    }, 2000);

    return () => {
      clearInterval(factInterval);
      clearInterval(iconInterval);
    };
  }, []);

  const CurrentIcon = icons[currentIconIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-100">
        
        {/* Animated Icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            key={currentIconIndex}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-16 h-16 bg-black rounded-full flex items-center justify-center"
          >
            <CurrentIcon className="w-8 h-8 text-white" />
          </motion.div>
        </div>

        {/* Loading Text */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-light text-black mb-2">Creating Your Style</h2>
          
          {/* Animated Dots */}
          <div className="flex justify-center items-center gap-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  backgroundColor: ["#9CA3AF", "#000000", "#9CA3AF"],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
              />
            ))}
          </div>
        </div>

        {/* Fashion Fact */}
        <div className="text-center min-h-[3rem] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentFactIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-gray-600 text-sm leading-relaxed italic"
            >
              💡 {fashionFacts[currentFactIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
            <motion.div
              className="h-full bg-black rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: 8,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 