import React, { useEffect, useRef } from 'react';

const AmbientGlow = () => {
  const glowRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!glowRef.current) return;
      const { clientX, clientY } = e;
      // Offset by half the width/height to center the glow on the cursor
      glowRef.current.animate({
        left: `${clientX - 400}px`,
        top: `${clientY - 400}px`
      }, { duration: 2500, fill: "forwards", easing: "ease-out" }); // Soft easing for premium follow effect
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed z-0 w-[800px] h-[800px] rounded-full opacity-0 dark:opacity-[0.15] transition-opacity duration-700"
      style={{
        background: 'radial-gradient(circle, rgba(168,85,247, 1) 0%, rgba(168,85,247, 0) 60%)',
        filter: 'blur(80px)',
        transform: 'translateZ(0)', // Force GPU acceleration
        willChange: 'left, top'
      }}
    />
  );
};

export default AmbientGlow;
