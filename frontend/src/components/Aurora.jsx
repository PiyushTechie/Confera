import React from "react";
import { motion } from "framer-motion";

export const Aurora = ({ children }) => {
  return (
    <div className="relative flex flex-col min-h-screen items-center justify-center bg-[#030014] text-slate-50 overflow-hidden">
      
      {/* Background Animated Orbs */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            y: [0, -50, 0],
            x: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-purple-600/30 rounded-full blur-[120px] mix-blend-screen"
        />
        <motion.div
          animate={{
            y: [0, 50, 0],
            x: [0, -40, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-1/4 right-1/4 w-[45vw] h-[45vw] bg-blue-600/20 rounded-full blur-[130px] mix-blend-screen"
        />
        <motion.div
          animate={{
            y: [0, -30, 0],
            x: [0, 50, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] bg-indigo-500/20 rounded-full blur-[140px] mix-blend-screen"
        />
        
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dzl9yxixg/image/upload/v1714558602/grid_n83bzz.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
};
