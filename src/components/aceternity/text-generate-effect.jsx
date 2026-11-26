import { useEffect } from 'react';
import { motion, stagger, useAnimate, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

/*
 * Adapted from Aceternity UI — Text Generate Effect
 * (https://ui.aceternity.com/components/text-generate-effect)
 *
 * Adaptations for Vayu:
 *  - Imports from "framer-motion" (the registry build targets motion/react;
 *    this project uses framer-motion 12, which exports the same
 *    useAnimate/stagger APIs). "use client" stripped — plain Vite React.
 *  - Words re-animate when the `words` prop changes (new city / category),
 *    not only on mount.
 *  - Extra `staggerDelay` prop: the stock 0.2s step makes a full health
 *    sentence take ~5s, so the hero passes a snappier step.
 *  - Respects prefers-reduced-motion: renders the text plainly, no blur or
 *    stagger, when the user prefers reduced motion.
 */
export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
  staggerDelay = 0.2,
}) => {
  const [scope, animate] = useAnimate();
  const reduce = useReducedMotion();
  const wordsArray = words.split(' ');

  useEffect(() => {
    if (reduce || !scope.current) return undefined;
    const controls = animate(
      'span',
      { opacity: 1, filter: filter ? 'blur(0px)' : 'none' },
      { duration: duration || 1, delay: stagger(staggerDelay) }
    );
    return () => { if (controls && controls.stop) controls.stop(); };
  }, [words, reduce, animate, filter, duration, staggerDelay, scope]);

  if (reduce) {
    return <div className={cn(className)}>{words}</div>;
  }

  return (
    <div className={cn(className)}>
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => (
          <motion.span
            key={`${word}-${idx}`}
            className="opacity-0"
            style={{ filter: filter ? 'blur(10px)' : 'none' }}
          >
            {word}{' '}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
};

export default TextGenerateEffect;
