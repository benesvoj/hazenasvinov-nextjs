'use client';

import {Button} from '@heroui/button';
import {Image} from '@heroui/image';

import Link from '@/components/ui/link/Link';

import {useFetchClubConfig} from "@/hooks";
import {translations} from '@/lib';

export default function HeroSection() {
  const {data: clubConfig} = useFetchClubConfig();

  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-2xl overflow-hidden">
      <div className="p-8 lg:p-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text Content */}
          <div className="space-y-6 animate-fade-in-up">
            <div className="space-y-4">
              <p className="text-lg lg:text-xl text-blue-100 leading-relaxed max-w-2xl animate-slide-in-left animation-delay-200">
                {clubConfig?.hero_subtitle || translations.heroSection.fallbackSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 animate-slide-in-left animation-delay-400">
              <Button
                as={Link}
                href={clubConfig?.hero_button_link || '/matches'}
                color="primary"
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-500 ease-out transform hover:scale-105 hover:-translate-y-1"
              >
                {clubConfig?.hero_button_text || 'Program zápasů'}
              </Button>
              <Button
                as={Link}
                href="/contact"
                variant="bordered"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-blue-600 shadow-lg hover:shadow-xl transition-all duration-500 ease-out transform hover:scale-105 hover:-translate-y-1"
              >
                Kontaktujte nás
              </Button>
            </div>

            {/* Club Stats */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-blue-500/30 animate-fade-in animation-delay-600">
              <div className="text-center group">
                <div className="text-2xl lg:text-3xl font-bold text-yellow-300 transition-all duration-300 group-hover:scale-110">
                  {clubConfig?.founded_year
                    ? `${new Date().getFullYear() - clubConfig.founded_year}+`
                    : '90+'}
                </div>
                <div className="text-sm text-blue-200 transition-colors duration-300 group-hover:text-yellow-200">
                  Let tradice
                </div>
              </div>
              <div className="text-center group">
                <div className="text-2xl lg:text-3xl font-bold text-green-300 transition-all duration-300 group-hover:scale-110">
                  10
                </div>
                <div className="text-sm text-blue-200 transition-colors duration-300 group-hover:text-green-200">
                  Týmových kategorií
                </div>
              </div>
              <div className="text-center group">
                <div className="text-2xl lg:text-3xl font-bold text-purple-300 transition-all duration-300 group-hover:scale-110">
                  2
                </div>
                <div className="text-sm text-blue-200 transition-colors duration-300 group-hover:text-purple-200">
                  Sezóny ročně
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Image with Smooth Transitions */}
          <div className="relative animate-fade-in-right">
            <div className="relative group">
              {/* Subtle Glow Effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out"></div>

              {/* Image Container */}
              <div className="relative bg-white/10 rounded-2xl p-4 border border-white/20 transition-all duration-500 ease-out group-hover:bg-white/15 group-hover:border-white/30 group-hover:shadow-2xl">
                <Image
                  src={clubConfig?.hero_image_url || undefined}
                  alt="TJ Sokol Svinov - Házená"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover rounded-xl shadow-xl transition-all duration-700 ease-out group-hover:scale-105 group-hover:shadow-2xl"
                  sizes="(max-width: 768px) 100vw, 600px"
                />

                {/* Subtle Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Background Pattern with Animation */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[size:20px_20px] animate-float"></div>
      </div>
    </section>
  );
}
