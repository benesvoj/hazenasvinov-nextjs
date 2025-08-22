'use client';

import { useClubConfig } from "@/hooks/useClubConfig";
import { Button } from "@heroui/button";
import Link from "@/components/Link";
import { Image } from "@heroui/image";
import { translations } from "@/lib/translations";

export default function HeroSectionV2() {
    const { clubConfig, loading: configLoading } = useClubConfig();

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={clubConfig?.hero_image_url || undefined}
                    alt="TJ Sokol Svinov - Házená"
                    fill
                    className="object-cover"
                    priority
                />
                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 container mx-auto px-4 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen">
                    {/* Left Side - Text Content */}
                    <div className="space-y-8 text-white">
                        {/* Main Title with Dynamic Typography */}
                        <div className="space-y-4">
                            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                                <span className="block text-blue-300">TJ SOKOL</span>
                                <span className="block text-6xl lg:text-8xl text-white">SVINOV</span>
                            </h1>
                            <div className="w-24 h-1 bg-yellow-400 rounded-full"></div>
                        </div>

                        {/* Subtitle */}
                        <p className="text-xl lg:text-2xl text-gray-200 leading-relaxed max-w-2xl">
                            {clubConfig?.hero_subtitle || "Tradiční házenkářský klub s bohatou historií a úspěchy"}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-6">
                            <Button
                                as={Link}
                                href={clubConfig?.hero_button_link || "/matches"}
                                color="primary"
                                size="lg"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
                            >
                                {clubConfig?.hero_button_text || "Program zápasů"}
                            </Button>
                            <Button
                                as={Link}
                                href="/contact"
                                variant="bordered"
                                size="lg"
                                className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg font-semibold rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
                            >
                                Kontaktujte nás
                            </Button>
                        </div>

                        {/* Club Stats */}
                        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/20">
                            <div className="text-center group">
                                <div className="text-3xl lg:text-4xl font-bold text-yellow-400 transition-all duration-300 group-hover:scale-110">
                                    {clubConfig?.founded_year ? `${new Date().getFullYear() - clubConfig.founded_year}+` : '90+'}
                                </div>
                                <div className="text-sm text-gray-300 uppercase tracking-wider">Let tradice</div>
                            </div>
                            <div className="text-center group">
                                <div className="text-3xl lg:text-4xl font-bold text-green-400 transition-all duration-300 group-hover:scale-110">10</div>
                                <div className="text-sm text-gray-300 uppercase tracking-wider">Týmových kategorií</div>
                            </div>
                            <div className="text-center group">
                                <div className="text-3xl lg:text-4xl font-bold text-purple-400 transition-all duration-300 group-hover:scale-110">2</div>
                                <div className="text-sm text-gray-300 uppercase tracking-wider">Sezóny ročně</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Dynamic Visual Element */}
                    <div className="relative hidden lg:block">
                        {/* Floating Action Shot Container */}
                        <div className="relative group">
                            {/* Glow Effect */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out"></div>
                            
                            {/* Main Image Container */}
                            <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 transition-all duration-500 ease-out group-hover:bg-white/20 group-hover:border-white/40 group-hover:shadow-2xl">
                                <div className="relative w-96 h-96 mx-auto">
                                    <Image
                                        src={clubConfig?.hero_image_url || undefined}
                                        alt="Házenkářský akční snímek"
                                        fill
                                        className="object-cover rounded-2xl shadow-2xl transition-all duration-700 ease-out group-hover:scale-105 group-hover:shadow-blue-500/25"
                                    />
                                    
                                    {/* Dynamic Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                </div>
                            </div>

                            {/* Floating Badge */}
                            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-2xl transform rotate-12 group-hover:rotate-0 transition-all duration-500 ease-out">
                                <span className="font-bold text-lg">HÁZENÁ</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Animated Background Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                {/* Floating Particles */}
                <div className="absolute top-20 left-20 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <div className="absolute top-40 right-32 w-1 h-1 bg-blue-400 rounded-full animate-ping"></div>
                <div className="absolute bottom-32 left-32 w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
                
                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[size:40px_40px] animate-float"></div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
                <div className="flex flex-col items-center space-y-2 text-white/60 animate-bounce">
                    <span className="text-sm uppercase tracking-wider">Scroll</span>
                    <div className="w-0.5 h-8 bg-white/60 rounded-full"></div>
                </div>
            </div>
        </section>
    );
}
