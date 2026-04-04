'use client';

import Image from 'next/image';

const steps = [
    {
        number: '1',
        title: 'Enter Your Rank & Details',
        description: 'Enter your rank, category, and domicile. Our engine prepares the seat matrix relevant to you.',
    },
    {
        number: '2',
        title: 'Set Your Preferences.',
        description: 'Pick your top 3 preferred states. We prioritize these regions to find your best-fit matches.',
    },
    {
        number: '3',
        title: 'View Eligible Colleges Instantly',
        description: 'See medical colleges where you have a chance based on your rank.',
    },
];

export function HowItWorks() {
    return (
        <section className="py-6 lg:py-24 bg-white font-sans overflow-hidden">
            <div className="max-w-7xl flex flex-col lg:flex-row  gap-x-20 mx-auto px-4 sm:px-6 lg:px-8">

                <div className='flex-1  flex flex-col  items-center '>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2F129B] mb-2  leading-tight">
                        How it Works!
                    </h2>
                    <p className="text-[#4B5563] font-medium text-center md:text-left text-sm md:text-base lg:text-lg max-w-2xl lg:mx-0 mx-auto">
                        Find your eligible medical colleges in just a few simple steps.
                    </p>
                    <div className='  mt-10 flex flex-col   gap-y-6 min-w-[85%] items-end '>
                        {
                            steps.map((step, index) => (
                                <div key={index} className='relative flex items-center justify-center min-h-[100px] lg:min-h-[120px] rounded-r-md bg-[#2F129B] w-[90%]'>

                                    <div className='pl-10 w-[95%] md:w-[85%]  pr-6 py-4 -translate-x-6   flex flex-col items-center'>
                                        <h3 className=' text-sm md:text-lg font-medium text-white mb-2 text-center'>{step.title}</h3>
                                        <p className='text-white  text-[11px]  md:text-sm text-center'>{step.description}</p>
                                    </div>
                                    {/* right cuttings  */}
                                    <div className='absolute -right-20 top-1/2 -translate-y-1/2 aspect-square h-full bg-white flex items-center justify-center rotate-45'>
                                    </div>
                                    {/* left cuttings  */}
                                    <div className='absolute -left-20 top-1/2 -translate-y-1/2 aspect-square h-full bg-white flex items-center justify-center overflow-hidden '>
                                        <div className='w-full relative h-full bg-[#2F129B] rotate-45 translate-x-18 '>
                                            <div className='absolute top-[90%] left-[10%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full w-[55%] md:w-[70%] h-[55%] md:h-[70%] bg-white'>

                                                <div className='border-[1.5px] border-[#2F129B] flex items-center justify-center -rotate-45 rounded-full w-[76%] h-[76%]'>
                                                    <div className='w-[76%] h-[76%] flex items-center justify-center text-white bg-gradi bg-linear-to-r from-[#2F129B] to-[#3B82F6] rounded-full'>
                                                        {index + 1}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
                <div className='flex-1 '>
                    <div className="relative aspect-square  max-h-160 w-full  flex items-center justify-center">
                        <Image
                            src="/howItWork.png"
                            alt="How it works illustration"
                            width={800}
                            height={800}
                            className="object-contain w-2/4 lg:w-full"
                            priority
                        />

                    </div>
                </div>

            </div>
        </section>
    );
}
