import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useInView } from "framer-motion";
import { useRef } from "react";

interface ScrollAnimationProps {
    children: ReactNode;
    delay?: number;
    className?: string;
}

export function ScrollAnimation({ children, delay = 0, className = "" }: ScrollAnimationProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, ease: "easeOut", delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
