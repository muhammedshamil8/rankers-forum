'use client';

import { Button } from '@/components/ui/button';

interface CTAProps {
    onAction: () => void;
}

export function CTA({ onAction }: CTAProps) {
    return (
        <section className="py-6 md:py-20 bg-linear-to-r from-[#2F129B] to-[#3B82F6]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                    Still confused about your options?
                </h2>
                <p className="text-indigo-100 text-sm md:text-lg mb-8 max-w-2xl mx-auto">
                    Get clarity on your medical college options based on your rank with guidance.
                </p>
                <Button
                    size="lg"
                    variant="outline"
                    className="bg-white text-[#3B82F6] border-white rounded-full hover:bg-indigo-50 h-14 px-8 text-base shadow-lg hover:shadow-xl transition-all"
                    onClick={onAction}
                >
                    Request a Callback
                </Button>
            </div>
        </section>
    );
}
