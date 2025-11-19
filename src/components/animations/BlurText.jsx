import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

export default function BlurText({
  text = '',
  animateBy = 'words',
  direction = 'top',
  delay = 200,
  stepDuration = 0.35,
  threshold = 0.1,
  rootMargin = '0px',
  onAnimationComplete,
  className = ''
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold, rootMargin, once: true });
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (isInView && !animated) {
      setAnimated(true);
    }
  }, [isInView, animated]);

  const words = text.split(' ');
  const letters = text.split('');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: animateBy === 'words' ? delay / 1000 : delay / 1000 / letters.length,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      filter: 'blur(10px)',
      y: direction === 'top' ? -20 : 20,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        duration: stepDuration,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  useEffect(() => {
    if (animated && onAnimationComplete) {
      const totalDuration = animateBy === 'words' 
        ? words.length * (delay / 1000) + stepDuration * 1000
        : letters.length * (delay / 1000 / letters.length) + stepDuration * 1000;
      setTimeout(() => {
        onAnimationComplete();
      }, totalDuration);
    }
  }, [animated, words.length, letters.length, delay, stepDuration, animateBy, onAnimationComplete]);

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={animated ? 'visible' : 'hidden'}
      className={className}
      style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.25em' }}
    >
      {animateBy === 'words'
        ? words.map((word, index) => (
            <motion.span
              key={index}
              variants={itemVariants}
              style={{ display: 'inline-block', marginRight: '0.1em' }}
            >
              {word}
            </motion.span>
          ))
        : letters.map((letter, index) => (
            <motion.span
              key={index}
              variants={itemVariants}
              style={{ display: 'inline-block' }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </motion.span>
          ))}
    </motion.div>
  );
}

