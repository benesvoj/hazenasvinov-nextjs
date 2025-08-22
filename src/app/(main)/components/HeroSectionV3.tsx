'use client';

import { useClubConfig } from "@/hooks/useClubConfig";
import { Button } from "@heroui/button";
import Link from "@/components/Link";
import { Image } from "@heroui/image";
import { translations } from "@/lib/translations";

export default function HeroSectionV3() {
    const { clubConfig, loading: configLoading } = useClubConfig();

    return (
        <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[size:30px_30px]"></div>
            </div>

            <div className="container mx-auto px-4 lg:px-8 py-16">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-full px-8 py-4 border border-white/20">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-lg font-semibold text-green-300">LIVE - Sezóna 2024/25</span>
                    </div>
                    
                    <h1 className="text-6xl lg:text-8xl font-bold mt-8 mb-4">
                        <span className="block text-blue-200">TJ SOKOL</span>
                        <span className="block text-white">SVINOV</span>
                    </h1>
                    
                    <p className="text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                        {clubConfig?.hero_subtitle || "Tradiční házenkářský klub s bohatou historií a úspěchy v české házené"}
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-8 mb-16">
                    {/* Left Column - Next Match */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-yellow-300 mb-4">NÁSTUPNÍ ZÁPAS</h3>
                            
                            {/* Match Info */}
                            <div className="space-y-4">
                                <div className="text-sm text-blue-200 uppercase tracking-wider">
                                    {clubConfig?.next_match_competition || "1. Liga - 6. kolo"}
                                </div>
                                
                                <div className="text-lg font-semibold text-blue-100">
                                    {clubConfig?.next_match_date || "So, 23.08.2025 - 18:00"}
                                </div>
                                
                                {/* Teams */}
                                <div className="flex items-center justify-center space-x-6 my-6">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                                            <span className="text-white font-bold text-lg">TJ</span>
                                        </div>
                                        <div className="text-sm font-semibold">Svinov</div>
                                    </div>
                                    
                                    <div className="text-3xl font-bold text-yellow-400">VS</div>
                                    
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-2">
                                            <span className="text-white font-bold text-lg">OP</span>
                                        </div>
                                        <div className="text-sm font-semibold">Ostrava</div>
                                    </div>
                                </div>
                                
                                <Button
                                    as={Link}
                                    href="/matches"
                                    color="primary"
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl"
                                >
                                    K zápasu
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Center Column - Hero Image & Stats */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Hero Image */}
                        <div className="relative group">
                            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 overflow-hidden">
                                <Image
                                    src={clubConfig?.hero_image_url || undefined}
                                    alt="TJ Sokol Svinov - Házená"
                                    width={800}
                                    height={400}
                                    className="w-full h-64 lg:h-80 object-cover rounded-xl shadow-2xl transition-all duration-500 ease-out group-hover:scale-105"
                                />
                                
                                {/* Overlay with club motto */}
                                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-transparent to-transparent rounded-xl flex items-end">
                                    <div className="p-6 text-center w-full">
                                        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                                            {clubConfig?.club_motto || "VELKÁ LÁSKA. VELKÝ SPORT."}
                                        </h2>
                                        <p className="text-blue-200 text-lg">
                                            {clubConfig?.hero_button_text || "Program zápasů"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 hover:bg-white/15 transition-all duration-300">
                                <div className="text-2xl lg:text-3xl font-bold text-yellow-400 mb-1">
                                    {clubConfig?.founded_year ? `${new Date().getFullYear() - clubConfig.founded_year}+` : '90+'}
                                </div>
                                <div className="text-sm text-blue-200 uppercase tracking-wider">Let tradice</div>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 hover:bg-white/15 transition-all duration-300">
                                <div className="text-2xl lg:text-3xl font-bold text-green-400 mb-1">10</div>
                                <div className="text-sm text-blue-200 uppercase tracking-wider">Týmových kategorií</div>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 hover:bg-white/15 transition-all duration-300">
                                <div className="text-2xl lg:text-3xl font-bold text-purple-400 mb-1">2</div>
                                <div className="text-sm text-blue-200 uppercase tracking-wider">Sezóny ročně</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section - News & Actions */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* News Highlights */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <h3 className="text-2xl font-bold text-yellow-300 mb-4">AKTUÁLNÍ NOVINKY</h3>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300">
                                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                                <div>
                                    <div className="text-sm text-blue-200">23.08.2025</div>
                                    <div className="text-white font-medium">Sezóna začíná! První zápas už tento víkend</div>
                                </div>
                            </div>
                            
                            <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                                <div>
                                    <div className="text-sm text-blue-200">20.08.2025</div>
                                    <div className="text-white font-medium">Nové dresy pro sezónu 2024/25</div>
                                </div>
                            </div>
                            
                            <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300">
                                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                                <div>
                                    <div className="text-sm text-blue-200">18.08.2025</div>
                                    <div className="text-white font-medium">Tréninkový kemp pro juniory</div>
                                </div>
                            </div>
                        </div>
                        
                        <Button
                            as={Link}
                            href="/blog"
                            variant="bordered"
                            size="lg"
                            className="w-full mt-4 border-white/30 text-white hover:bg-white hover:text-blue-900 rounded-xl"
                        >
                            Všechny novinky
                        </Button>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <h3 className="text-2xl font-bold text-yellow-300 mb-4">RYCHLÉ AKCE</h3>
                        <div className="space-y-4">
                            <Button
                                as={Link}
                                href="/matches"
                                color="primary"
                                size="lg"
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl"
                            >
                                Program zápasů
                            </Button>
                            
                            <Button
                                as={Link}
                                href="/contact"
                                variant="bordered"
                                size="lg"
                                className="w-full border-white/30 text-white hover:bg-white hover:text-blue-900 rounded-xl"
                            >
                                Kontaktujte nás
                            </Button>
                            
                            <Button
                                as={Link}
                                href="/about"
                                variant="bordered"
                                size="lg"
                                className="w-full border-white/30 text-white hover:bg-white hover:text-blue-900 rounded-xl"
                            >
                                O klubu
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
