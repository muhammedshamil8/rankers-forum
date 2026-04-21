'use client';

import { ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface HeroProps {
    onCheckColleges: () => void;
}

export function Hero({ onCheckColleges }: HeroProps) {
    return (
        <section className="relative pt-24 lg:pt-32 md:h-[980px] lg:h-screen h-screen overflow-hidden">
            <div className="max-w-7xl  relative z-20 h-full  mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative  h-full ">
                    <div className="text-center max-w-4xl mx-auto space-y-4 relative z-10">
                        <div className="absolute top-80 lg:-top-4 right-0    lg:-right-48  bot lg:block animate-float">

                            <div className="flex gap-2 px-4 py-3 bg-[#3A7BF00A] rounded-lg rounded-2xl shadow-lg border border-[#3B82F6]/20">
                                <div className=' min-h-full flex items-end'>
                                    <div className="md:w-4 md:h-4 w-2 h-2 border-2 border-[#3B82F6] rounded-full"></div>

                                </div>
                                <span className="md:text-[15px] text-[12px] text-[#2F129B] font-medium">Built for medical <br /> aspirants</span>
                            </div>
                        </div>

                        <h1 className="text-3xl  sm:text-5xl font-bold leading-tight">
                            <span className="text-[#3B82F6]">Map Your Medical Career with</span>
                            <br />
                            <span className="text-[#3B82F6]">Surgical Precision.</span>
                        </h1>

                        <p className="text-sm md:text-base sm:text-lg text-[#4B5563] font-medium max-w-5xl mx-auto leading-relaxed">
                            Cut through the chaos of counselling forums. Our predictive engine analyzes every seat quota and
                            domicile rule to give you the clarity you need to finalize your choices with total confidence.
                        </p>

                        <div className=" mt-7 md:mt-12">
                            <Button
                                size="lg"
                                className="text-base h-14 px-8 font-normal bg-linear-to-r from-[#2F129B] to-[#3B82F6] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                                onClick={onCheckColleges}
                            >
                                Predict My College Now
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="absolute left-5 md:left-32 lg:left-66 top-78 lg:block animate-float-delayed lg:w-32 lg:h-32 md:w-24 md:h-24 w-12 h-12 rounded-[16px] overflow-hidden">
                        <Image src="/doctor2.webp" alt="Hero Background"
                            width={480}
                            height={480}
                            quality={75}
                            className="object-cover object-right w-full h-full scale-x-[-1]"
                        />
                    </div>

                    <div className="absolute left-10 md:left-0 lg:left-10 top-108 md:top-auto bottom-80 lg:top-44  lg:block animate-float">
                        <div className="flex items-start gap-2 px-4 py-4 bg-[#3A7BF00A] rounded-lg border border-[#3B82F6]/20">
                            <div className="w-2 h-2 md:w-4 md:h-4 border-2 border-[#3B82F6] rounded-full"></div>

                            <div className="text-left">
                                <p className="text-[10px] md:text-[15px] text-[#2F129B] font-medium leading-tight">Based on historical</p>
                                <p className="text-[10px] md:text-[15px] text-[#2F129B] font-medium leading-tight">NEET cut-off data</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute left-0 md:left-10 lg:left-36 top-132 md:top-auto bottom-40 lg:top-118  lg:block animate-float">
                        <div className="flex items-start gap-2 px-4 py-4 bg-[#3A7BF00A] rounded-lg border border-[#3B82F6]/20">
                            <div className="w-2 h-2 md:w-4 md:h-4 border-2 border-[#3B82F6] rounded-full"></div>

                            <div className="text-center">
                                <p className=" text-[10px] md:text-[15px] text-[#2F129B] font-medium leading-tight">Uses counselling trends, </p>
                                <p className=" text-[10px] md:text-[15px] text-[#2F129B] font-medium leading-tight">not guesswork</p>
                            </div>
                        </div>
                    </div>



                    <div className="absolute right-0 bottom-0  lg:block">
                        <Image src="/doctor.webp" alt="Hero Background"
                            width={480}
                            height={480}
                            quality={75}
                            className="object-cover w-[210px] h-[210px] md:w-[520px] md:h-[520px] lg:w-[400px] lg:h-[400px]"
                        />
                    </div>
                </div>
            </div>


            <Image src="/bgIllustraction.png" alt="Hero Background"
                width={1000}
                height={1000}
                className="object-fill absolute top-0 left-0 w-full h-full z-10 opacity-5" />
        </section>
    );
}
