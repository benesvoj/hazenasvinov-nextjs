'use client';

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spacer } from "@heroui/spacer";
import { CustomTable } from "@/components/CustomTable";
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
  ArrowRightIcon
} from "@heroicons/react/24/outline";

// Sample latest blog posts for homepage
const latestPosts = [
  {
    id: 1,
    title: "Úspěšný start sezóny pro mužský tým",
    excerpt: "Mužský tým TJ Sokol Svinov zahájil novou sezónu v 1. lize národní házené výbornými výsledky...",
    date: "2024-09-15",
    category: "Muži",
    slug: "uspesny-start-sezony-pro-muzsky-tym"
  },
  {
    id: 2,
    title: "Dorostenci vyhráli turnaj v Ostravě",
    excerpt: "Náš dorostenecký tým se zúčastnil mezinárodního turnaje v Ostravě a po skvělých výkonech...",
    date: "2024-09-10",
    category: "Dorostenci",
    slug: "dorostenci-vyhráli-turnaj-v-ostrave"
  },
  {
    id: 3,
    title: "Přípravka zahájila tréninky pro novou sezónu",
    excerpt: "Děti z přípravky se vrátily z prázdnin a začaly s pravidelnými tréninky. Noví zájemci jsou vítáni...",
    date: "2024-09-05",
    category: "Přípravka",
    slug: "pripravka-zahajila-treninky-pro-novou-sezonu"
  }
];

export default function Page() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative bg-linear-to-r from-blue-600 to-blue-800 text-white rounded-xl p-8 lg:p-12">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className='text-xl lg:text-2xl font-bold mb-4'>
              Tradice národní házené už více než 90 let
            </h1>
            <p className="text-l mb-6 text-blue-100">
              V TJ Sokol Svinov žijeme národní házenou – sportem s ryze českými kořeny a bohatou historií. Už přes 90 let jsme součástí českého sportovního prostředí a během této doby jsme nasbírali řadu úspěchů v soutěžích dospělých i mládeže.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                as={Link} 
                href="/categories/men" 
                color="primary" 
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                Aktuální výsledky
              </Button>
              <Button 
                as={Link} 
                href="/contact" 
                variant="bordered" 
                size="lg"
                className="border-white text-white hover:bg-white hover:text-blue-600"
              >
                Kontaktujte nás
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <Image 
              src="/logo.png" 
              alt="TJ Sokol Svinov" 
              width={200} 
              height={200}
              className="rounded-full shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
          <CardBody className='flex flex-col items-center'>
            <TrophyIcon className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <h3 className="text-2xl font-bold">90+</h3>
            <p className="text-gray-600">Let tradice</p>
          </CardBody>
        </Card>
        <Card className="text-center">
          <CardBody className='flex flex-col items-center'>
            <UserGroupIcon className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <h3 className="text-2xl font-bold">10</h3>
            <p className="text-gray-600">Týmových kategorií</p>
          </CardBody>
        </Card>
        <Card className="text-center">
          <CardBody className='flex flex-col items-center'>
            <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <h3 className="text-2xl font-bold">2</h3>
            <p className="text-gray-600">Sezóny ročně</p>
          </CardBody>
        </Card>
        <Card className="text-center">
          <CardBody className='flex flex-col items-center'>
            <MapPinIcon className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <h3 className="text-2xl font-bold">SM</h3>
            <p className="text-gray-600">Oblastní soutěže</p>
          </CardBody>
        </Card>
      </section>

      {/* Latest News */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Nejnovější novinky</h2>
          <Button 
            as={Link} 
            href="/blog" 
            variant="bordered" 
            endContent={<ArrowRightIcon className="w-4 h-4" />}
          >
            Všechny novinky
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-0">
                <div className="flex items-center gap-2 mb-2">
                  <TagIcon className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    {post.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {post.title}
                </h3>
              </CardHeader>
              <CardBody>
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(post.date).toLocaleDateString('cs-CZ')}
                  </span>
                  <Button 
                    as={Link} 
                    href={`/blog/${post.slug}`}
                    size="sm" 
                    color="primary"
                  >
                    Přečíst
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Latest Results - Men's Team */}
      <section>
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Aktuální výsledky - Muži</h2>
            <p className="text-gray-600">Nejnovější výsledky našeho mužského týmu</p>
          </CardHeader>
          <CardBody>
            <CustomTable 
              csvData={URL_men} 
              tableTitle="" 
              isStrippedAllowed={true}
            />
            <div className="mt-4 text-center">
              <Button 
                as={Link} 
                href="/categories/men" 
                color="primary"
              >
                Zobrazit všechny výsledky
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>

      {/* Team Categories */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-center">Naše týmy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Youngest Kids */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardBody>
              <h3 className="text-xl font-semibold mb-2">Kuřátka</h3>
              <p className="text-gray-600 mb-4">Nejmladší se zájmem o pohyb</p>
              <Button 
                as={Link} 
                href="/categories/youngest-kids" 
                size="sm" 
                color="primary"
              >
                Zobrazit tým
              </Button>
            </CardBody>
          </Card>

          {/* Prep Kids */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardBody>
              <h3 className="text-xl font-semibold mb-2">Přípravka</h3>
              <p className="text-gray-600 mb-4">Děti 5-10 let, turnajové kategorie</p>
              <Button 
                as={Link} 
                href="/categories/prep-kids" 
                size="sm" 
                color="primary"
              >
                Zobrazit tým
              </Button>
            </CardBody>
          </Card>

          {/* Younger Boys */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardBody>
              <h3 className="text-xl font-semibold mb-2">Mladší žáci</h3>
              <p className="text-gray-600 mb-4">Kluci 9-12 let, SM oblast</p>
              <Button 
                as={Link} 
                href="/categories/younger-boys" 
                size="sm" 
                color="primary"
              >
                Zobrazit tým
              </Button>
            </CardBody>
          </Card>

          {/* Younger Girls */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardBody>
              <h3 className="text-xl font-semibold mb-2">Mladší žáčky</h3>
              <p className="text-gray-600 mb-4">Devčata 9-12 let, SM oblast</p>
              <Button 
                as={Link} 
                href="/categories/younger-girls" 
                size="sm" 
                color="primary"
              >
                Zobrazit tým
              </Button>
            </CardBody>
          </Card>

          {/* Older Boys */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardBody>
              <h3 className="text-xl font-semibold mb-2">Starší žáci</h3>
              <p className="text-gray-600 mb-4">Kluci 12-15 let, SM oblast</p>
              <Button 
                as={Link} 
                href="/categories/older-boys" 
                size="sm" 
                color="primary"
              >
                Zobrazit tým
              </Button>
            </CardBody>
          </Card>

          {/* Older Girls */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardBody>
              <h3 className="text-xl font-semibold mb-2">Starší žáčky</h3>
              <p className="text-gray-600 mb-4">Devčata 12-15 let, SM oblast</p>
              <Button 
                as={Link} 
                href="/categories/older-girls" 
                size="sm" 
                color="primary"
              >
                Zobrazit tým
              </Button>
            </CardBody>
          </Card>

          {/* Junior Boys */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardBody>
              <h3 className="text-xl font-semibold mb-2">Dorostenci</h3>
              <p className="text-gray-600 mb-4">Junioři 15-18 let, SM oblast</p>
              <Button 
                as={Link} 
                href="/categories/junior-boys" 
                size="sm" 
                color="primary"
              >
                Zobrazit tým
              </Button>
            </CardBody>
          </Card>

          {/* Junior Girls */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardBody>
              <h3 className="text-xl font-semibold mb-2">Dorostenky</h3>
              <p className="text-gray-600 mb-4">Juniorky 15-18 let, SM oblast</p>
              <Button 
                as={Link} 
                href="/categories/junior-girls" 
                size="sm" 
                color="primary"
              >
                Zobrazit tým
              </Button>
            </CardBody>
          </Card>

          {/* Men */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardBody>
              <h3 className="text-xl font-semibold mb-2">Muži</h3>
              <p className="text-gray-600 mb-4">1.liga mužů, SM oblast</p>
              <Button 
                as={Link} 
                href="/categories/men" 
                size="sm" 
                color="primary"
              >
                Zobrazit tým
              </Button>
            </CardBody>
          </Card>

          {/* Women */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardBody>
              <h3 className="text-xl font-semibold mb-2">Ženy</h3>
              <p className="text-gray-600 mb-4">Oblastní liga žen, SM oblast</p>
              <Button 
                as={Link} 
                href="/categories/women" 
                size="sm" 
                color="primary"
              >
                Zobrazit tým
              </Button>
            </CardBody>
          </Card>
        </div>
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