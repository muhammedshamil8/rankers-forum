'use client';

import Image from 'next/image';
import './floating.css'

export function ComingSoon() {
    return (
        <div className="h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden text-center">
            {/* Background Illustration */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/bgIllustraction.png"
                    alt="Background Illustration"
                    fill
                    className="object-cover opacity-5 pointer-events-none"
                    priority
                />
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60 z-0"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60 z-0"></div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center max-w-2xl py-8">
                {/* Logo */}
                <div className="mb-8 animate-fade-in">
                    <Image
                        src="/logoBlue.svg"
                        alt="Rankers Forum Logo"
                        width={200}
                        height={60}
                        className="h-12 w-auto"
                        priority
                    />
                </div>

                {/* Hero Image Container */}
                <div className="relative mb-8">
                    {/* Pulsing light behind image */}
                    <div className="absolute inset-0 bg-blue-400 rounded-full blur-[60px] opacity-20 animate-pulse"></div>

                    <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-2xl overflow-hidden border-4 border-white shadow-[0_15px_35px_rgba(59,130,246,0.15)] animate-float transform rotate-3">
                        <Image
                            src="/doctor.webp"
                            alt="Medical Professional"
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* Decorative Badge over image */}
                    <div className="absolute -bottom-2 -right-2 bg-white px-3 py-1.5 rounded-lg shadow-lg border border-blue-50 flex items-center gap-2 animate-bounce-slow">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Coming Soon</span>
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4 px-4">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                        <span className="text-[#3B82F6]">Map Your Medical</span>
                        <br />
                        <span className="text-[#2F129B]">Career Soon.</span>
                    </h1>

                    <p className="text-base md:text-lg text-slate-600 font-medium max-w-lg mx-auto leading-relaxed">
                        We're refining our predictive engine to analyze seat quotas and domicile rules with total confidence. The clarity you need is arriving shortly.
                    </p>
                </div>

                {/* Custom Progress Bar - just for aesthetics */}
                <div className="mt-8 w-full max-w-xs bg-slate-100 h-1.5 rounded-full overflow-hidden p-px border border-slate-200">
                    <div className="h-full bg-linear-to-r from-[#2F129B] to-[#3B82F6] rounded-full w-[70%] animate-loading-bar"></div>
                </div>
                <p className="mt-2 text-[10px] font-semibold text-[#3B82F6] uppercase tracking-[0.2em] animate-pulse">Preparing for Launch</p>
            </div>

            {/* Custom Styles */}
            {/* <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(3deg); }
          50% { transform: translateY(-20px) rotate(1deg); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes loading-bar {
            0% { width: 0%; }
            100% { width: 75%; }
        }
        .animate-loading-bar {
            animation: loading-bar 3s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }
        @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
            animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style> */}
        </div>
    );
}
