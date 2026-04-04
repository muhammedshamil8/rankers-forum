'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
    { question: 'Is the college prediction accurate?', answer: 'Our predictions are based on historical data and trends. While they provide a good estimate, actual cutoffs may vary.' },
    { question: 'Is this platform free to use?', answer: 'Yes, you can check your eligible colleges up to 2 times completely free.' },
    { question: 'What rank should I enter?', answer: 'Enter your NEET All India Rank (AIR) for the most accurate predictions.' },
    { question: 'Can I see colleges from previous years?', answer: 'Yes, after viewing your eligible colleges, you can access previous year data for comparison.' },
    { question: 'Will someone guide me if I\'m confused?', answer: 'Yes! You can request a callback and our counsellors will guide you through the process.' },
];

export function FAQ() {
    const [activeAccordion, setActiveAccordion] = useState<number | null>(null);

    return (
        <section className="py-5 md:py-24 bg-white font-sans" id="faq">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-7 md:mb-16">
                    <h2 className="text-3xl sm:text-5xl font-bold text-[#2D119A] mb-3 md:mb-6">Frequently Asked Questions</h2>
                    <p className="text-slate-600 text-sm md:text-lg">Answers to common questions from NEET aspirants.</p>
                </div>

                <div className="space-y-4 max-w-4xl mx-auto">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-[#F9FAFB] rounded-xl overflow-hidden transition-all duration-200"
                        >
                            <button
                                className="w-full flex items-center justify-between p-6 text-left"
                                onClick={() => setActiveAccordion(activeAccordion === index ? null : index)}
                            >
                                <span className="text-sm md:text-lg font-medium text-slate-900">{faq.question}</span>
                                <div className="shrink-0 ml-4">
                                    {activeAccordion === index ? (
                                        <Minus className="w-5 h-5 text-slate-500" />
                                    ) : (
                                        <Plus className="w-5 h-5 text-slate-500" />
                                    )}
                                </div>
                            </button>
                            <div
                                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${activeAccordion === index ? 'max-h-96 pb-6' : 'max-h-0'}`}
                            >
                                <p className="text-slate-600 text-sm md:text-lg leading-relaxed">
                                    {faq.answer}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
