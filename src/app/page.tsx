'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AuroraBackground } from '@/components/aceternity/aurora-background';
import { TypewriterEffectSmooth } from '@/components/aceternity/typewriter-effect';
import { motion } from 'framer-motion';

export default function HomePage() {
  const words = [
    { text: "Discover" },
    { text: "your" },
    { text: "next" },
    { text: "style," },
    { text: "instantly.", className: "text-blue-500 dark:text-blue-500" },
  ];

  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-center px-4 h-screen"
      >
        <div className="text-3xl md:text-7xl font-bold dark:text-white text-center">
          AI Fashion Studio
        </div>
        <TypewriterEffectSmooth words={words} />
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4">
          <Link href="/onboarding">
            <Button size="lg" className="w-40 h-12">
              Start Styling
            </Button>
          </Link>
        </div>
      </motion.div>
    </AuroraBackground>
  );
}
