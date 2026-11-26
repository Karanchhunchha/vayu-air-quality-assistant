import { useState } from "react";
import PropTypes from "prop-types";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "../../lib/utils";

/*
 * Adapted from Aceternity UI — Card Spotlight
 * (https://ui.aceternity.com/components/card-spotlight)
 *
 * Aceternity's wrapper tracks the mouse with Framer Motion values
 * (useMotionValue) and reveals an effect layer while hovering. Their stock
 * effect layer is a three.js canvas (CanvasRevealEffect); per Vayu's
 * dependency-light constraint this adaptation keeps the same mouse-tracking
 * wrapper but renders the reveal as a radial-gradient highlight via
 * useMotionTemplate — no three.js, no canvas.
 *
 * Drop-in replacement for the shared <Card> section: same surface classes,
 * plus a soft spotlight that follows the cursor. The overlay sits above the
 * card background but below the content, and is pointer-events-none.
 */
export const CardSpotlight = ({
  children,
  className,
  radius = 340,
  color = "rgba(14, 124, 134, 0.09)",
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovering, setIsHovering] = useState(false);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const spotlight = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, ${color}, transparent 80%)`;

  return (
    <section
      className={cn(
        "group relative overflow-hidden rounded-3xl bg-white p-5 shadow-card ring-1 ring-slate-900/5 sm:p-7",
        className,
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {isHovering && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-0"
          style={{ background: spotlight }}
          aria-hidden="true"
        />
      )}
      <div className="relative z-10">{children}</div>
    </section>
  );
};

export default CardSpotlight;

CardSpotlight.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  /** Radius (px) of the cursor spotlight gradient. */
  radius: PropTypes.number,
  /** Spotlight gradient colour. */
  color: PropTypes.string,
};
