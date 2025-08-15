'use client';

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spacer } from "@heroui/spacer";
import { CustomTable } from "@/components/CustomTable";
import MatchSchedule from "@/components/MatchSchedule";
import BlogPostCard, { BlogPostCardSkeleton } from "@/components/BlogPostCard";
import { URL_men } from "@/data/params";
import { translations } from "@/lib/translations";
import { texts } from "@/utils/texts";
import Link from "@/components/Link";
import Image from "next/image";
import { 
  TrophyIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  TagIcon,
  ArrowRightIcon,
  PhotoIcon
} from "@heroicons/react/24/outline";
import { useFetchBlogPosts } from "@/hooks/useFetchBlogPosts";
import { useClubConfig } from "@/hooks/useClubConfig";

export default function Page() {
  // Fetch latest blog posts
  const { posts: latestPosts, loading: postsLoading, error: postsError } = useFetchBlogPosts(3);
  
  // Fetch club configuration
  const { clubConfig, loading: configLoading } = useClubConfig();

  // Debug logging
  console.log('Landing page debug:', {
    latestPosts,
    postsLoading,
    postsError,
    postsCount: latestPosts?.length || 0
  });

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-2xl overflow-hidden">
        <div className="p-8 lg:p-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="space-y-6 animate-fade-in-up">
              <div className="space-y-4">
                <h1 className="text-3xl lg:text-5xl font-bold leading-tight animate-slide-in-left">
                  {clubConfig?.hero_title || 'Tradice národní házené už více než 90 let'}
                </h1>
                <p className="text-lg lg:text-xl text-blue-100 leading-relaxed max-w-2xl animate-slide-in-left animation-delay-200">
                  {clubConfig?.hero_subtitle || 'V TJ Sokol Svinov žijeme národní házenou – sportem s ryze českými kořeny a bohatou historií. Už přes 90 let jsme součástí českého sportovního prostředí a během této doby jsme nasbírali řadu úspěchů v soutěžích dospělých i mládeže.'}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4 animate-slide-in-left animation-delay-400">
                <Button 
                  as={Link} 
                  href={clubConfig?.hero_button_link || "/matches"} 
                  color="primary" 
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-500 ease-out transform hover:scale-105 hover:-translate-y-1"
                >
                  {clubConfig?.hero_button_text || "Program zápasů"}
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
                    {clubConfig?.founded_year ? `${new Date().getFullYear() - clubConfig.founded_year}+` : '90+'}
                  </div>
                  <div className="text-sm text-blue-200 transition-colors duration-300 group-hover:text-yellow-200">Let tradice</div>
                </div>
                <div className="text-center group">
                  <div className="text-2xl lg:text-3xl font-bold text-green-300 transition-all duration-300 group-hover:scale-110">10</div>
                  <div className="text-sm text-blue-200 transition-colors duration-300 group-hover:text-green-200">Týmových kategorií</div>
                </div>
                <div className="text-center group">
                  <div className="text-2xl lg:text-3xl font-bold text-purple-300 transition-all duration-300 group-hover:scale-110">2</div>
                  <div className="text-sm text-blue-200 transition-colors duration-300 group-hover:text-purple-200">Sezóny ročně</div>
                </div>
              </div>
            </div>

            {/* Right Side - Image with Smooth Transitions */}
            <div className="relative animate-fade-in-right">
              {clubConfig?.hero_image_url ? (
                <div className="relative group">
                  {/* Subtle Glow Effect */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out"></div>
                  
                  {/* Image Container */}
                  <div className="relative bg-white/10 rounded-2xl p-4 border border-white/20 transition-all duration-500 ease-out group-hover:bg-white/15 group-hover:border-white/30 group-hover:shadow-2xl">
                    <Image 
                      src={clubConfig.hero_image_url} 
                      alt="TJ Sokol Svinov - Házená" 
                      width={600} 
                      height={400}
                      className="w-full h-auto object-cover rounded-xl shadow-xl transition-all duration-700 ease-out group-hover:scale-105 group-hover:shadow-2xl"
                      priority
                      sizes="(max-width: 768px) 100vw, 600px"
                    />
                    
                    {/* Subtle Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out"></div>
                  <div className="bg-white/10 rounded-2xl p-8 border border-white/20 transition-all duration-500 ease-out group-hover:bg-white/15 group-hover:border-white/30 group-hover:shadow-2xl">
                    <div className="w-full h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-105">
                      <div className="text-center text-white">
                        <TrophyIcon className="w-16 h-16 mx-auto mb-4 text-yellow-300 transition-transform duration-500 group-hover:scale-110" />
                        <p className="text-lg font-semibold">Přidejte hero obrázek</p>
                        <p className="text-sm text-blue-100">V admin panelu</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subtle Background Pattern with Animation */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[size:20px_20px] animate-float"></div>
        </div>
      </section>

      {/* Match Schedule & Results */}
      <MatchSchedule />

      {/* Latest News - Modern Design */}
      <section className="relative">
        {/* Section Header with enhanced styling */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Nejnovější novinky
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Sledujte nejdůležitější události a informace z našeho klubu
          </p>
        </div>

        {/* Enhanced Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {postsLoading ? (
            // Enhanced Loading State with background image skeletons
            <>
              {[1, 2, 3].map((i) => (
                <BlogPostCardSkeleton key={i} />
              ))}
            </>
          ) : postsError ? (
            // Enhanced Error State
            <div className="col-span-full">
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 overflow-hidden">
                <CardBody className="text-center p-8">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TagIcon className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                    Chyba při načítání novinek
                  </h3>
                  <p className="text-red-600 dark:text-red-400 mb-4 max-w-md mx-auto">
                    {postsError}
                  </p>
                  <Button 
                    color="primary" 
                    variant="bordered"
                    onPress={() => window.location.reload()}
                    className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Zkusit znovu
                  </Button>
                </CardBody>
              </Card>
            </div>
          ) : latestPosts && latestPosts.length > 0 ? (
            // Enhanced Success State - Background Image Cards with Overlay Text
            latestPosts.map((post, index) => (
              <BlogPostCard 
                key={post.id} 
                post={post} 
                index={index}
                variant="landing"
              />
            ))
          ) : (
            // Enhanced No Posts State
            <div className="col-span-full">
              <Card className="border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 overflow-hidden">
                <CardBody className="text-center p-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TagIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Zatím žádné novinky
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-lg mx-auto">
                    První články se objeví, jakmile budou publikovány v administraci.
                  </p>
                  <Button 
                    as={Link} 
                    href="/blog" 
                    color="primary"
                    variant="bordered"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  >
                    Procházet blog
                  </Button>
                </CardBody>
              </Card>
            </div>
          )}
        </div>

        {/* Enhanced View All Button */}
        {latestPosts && latestPosts.length > 0 && (
          <div className="text-center mt-8">
            <Button 
              as={Link} 
              href="/blog" 
              size="md"
              color="primary"
              variant="bordered"
              className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
              endContent={<ArrowRightIcon className="w-4 h-4" />}
            >
              Zobrazit všechny novinky
            </Button>
          </div>
        )}
      </section>

      {/* Club Highlights */}
      <section className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">O našem oddílu</h2>
          </CardHeader>
          <CardBody>
            <p className="text-gray-600 mb-4">
              Jsme sportovní oddíl s bohatou tradicí sahající až do počátku 20. století. Již více než devět dekád reprezentujeme český sport Národní házená – ryze českou kolektivní hru s hlubokými kořeny.
            </p>
            <p className="text-gray-600 mb-4">
              Na kontě máme řadu úspěchů v soutěžích dospělých i mládeže. Naším cílem však není jen vítězit – především chceme přivádět děti, mládež i dospělé ke sportu, fair play a aktivnímu životnímu stylu.
            </p>
            <p className="text-gray-600 mb-4">
              V době, kdy pohyb často ustupuje obrazovkám, nabízíme smysluplné trávení volného času, sportovní průpravu a pevné zázemí v přátelském kolektivu.
            </p>
            <p>
              Přijďte si vyzkoušet národní házenou a staňte se součástí naší sportovní rodiny!
            </p>
            <Button 
              as={Link} 
              href="/about" 
              color="primary"
            >
              Více o nás
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Kontakt</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">Svinov, Ostrava</span>
              </div>
              <div className="flex items-center gap-3">
                <PhoneIcon className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">+420 XXX XXX XXX</span>
              </div>
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">info@tjsokolsvinov.cz</span>
              </div>
            </div>
            <Spacer y={4} />
            <Button 
              as={Link} 
              href="/contact" 
              color="primary"
            >
              Kontaktujte nás
            </Button>
          </CardBody>
        </Card>
      </section>

      {/* Sponsors Section */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Naši partneři a sponzoři
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Děkujeme našim partnerům za podporu a spolupráci
          </p>
        </div>

        {/* Main Sponsors */}
        <Card className="mb-8">
          <CardHeader>
            <h3 className="text-xl font-semibold text-center">Hlavní partneři</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
              <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">M</span>
                </div>
                <h4 className="font-semibold">Město Ostrava</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Hlavní partner</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 font-bold text-lg">S</span>
                </div>
                <h4 className="font-semibold">Sportovní hala Svinov</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Partner zázemí</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-yellow-600 dark:text-yellow-400 font-bold text-lg">Č</span>
                </div>
                <h4 className="font-semibold">Český svaz házené</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sportovní partner</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400 font-bold text-lg">T</span>
                </div>
                <h4 className="font-semibold">TJ Sokol</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Organizační partner</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Business Partners */}
        <Card className="mb-8">
          <CardHeader>
            <h3 className="text-xl font-semibold text-center">Obchodní partneři</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center">
              <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">A</span>
                </div>
                <h4 className="font-semibold">Auto Servis Svinov</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dopravní partner</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">R</span>
                </div>
                <h4 className="font-semibold">Restaurace U Sokolů</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gastronomický partner</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-pink-600 dark:text-pink-400 font-bold">F</span>
                </div>
                <h4 className="font-semibold">Fitness Centrum Svinov</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Kondiční partner</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Media Partners */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold text-center">Mediální partneři</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center">
              <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 font-bold">N</span>
                </div>
                <h4 className="font-semibold">Novojičínský deník</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tiskový partner</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-teal-600 dark:text-teal-400 font-bold">P</span>
                </div>
                <h4 className="font-semibold">Polar TV</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Televizní partner</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">R</span>
                </div>
                <h4 className="font-semibold">Radio Ostrava</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rozhlasový partner</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Become a Sponsor */}
        <div className="text-center mt-8">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900">
            <CardBody className="py-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Chcete se stát naším partnerem?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                Podpořte národní házenou a staňte se součástí našeho úspěšného týmu. 
                Nabízíme různé možnosti spolupráce a partnerství.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  as={Link} 
                  href="/contact" 
                  color="primary"
                  size="lg"
                >
                  Kontaktovat nás
                </Button>
                <Button 
                  as={Link} 
                  href="/about" 
                  variant="bordered"
                  size="lg"
                >
                  Více informací
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-linear-to-r from-green-600 to-green-700 text-white rounded-xl p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Chcete se připojit k našemu týmu?</h2>
        <p className="text-xl mb-6 text-green-100">
          Přijďte si vyzkoušet národní házenou a stát se součástí naší tradiční rodiny!
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            as={Link} 
            href="/contact" 
            size="lg"
            className="bg-white text-green-600 hover:bg-green-50"
          >
            Přihlásit se
          </Button>
          <Button 
            as={Link} 
            href="/about" 
            variant="bordered" 
            size="lg"
            className="border-white text-white hover:bg-white hover:text-green-600"
          >
            Zjistit více
          </Button>
        </div>
      </section>
    </div>
  );
}