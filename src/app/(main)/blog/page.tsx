'use client';

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import Link from "@/components/Link";
import { 
  CalendarIcon, 
  UserIcon, 
  TagIcon,
  ArrowRightIcon 
} from "@heroicons/react/24/outline";

// Sample blog data - in a real app, this would come from a database
const blogPosts = [
  {
    id: 1,
    title: "Úspěšný start sezóny pro mužský tým",
    excerpt: "Mužský tým TJ Sokol Svinov zahájil novou sezónu v 1. lize národní házené výbornými výsledky. V prvních třech zápasech získali maximum bodů a ukázali, že patří mezi favority soutěže.",
    author: "Trenér Jan Novák",
    date: "2024-09-15",
    category: "Muži",
    slug: "uspesny-start-sezony-pro-muzsky-tym",
    image: "/logo.png"
  },
  {
    id: 2,
    title: "Dorostenci vyhráli turnaj v Ostravě",
    excerpt: "Náš dorostenecký tým se zúčastnil mezinárodního turnaje v Ostravě a po skvělých výkonech získal první místo. Hráči ukázali výbornou techniku a týmového ducha.",
    author: "Trenérka Marie Svobodová",
    date: "2024-09-10",
    category: "Dorostenci",
    slug: "dorostenci-vyhráli-turnaj-v-ostrave",
    image: "/logo.png"
  },
  {
    id: 3,
    title: "Přípravka zahájila tréninky pro novou sezónu",
    excerpt: "Děti z přípravky se vrátily z prázdnin a začaly s pravidelnými tréninky. Noví zájemci jsou vítáni - přijďte si vyzkoušet národní házenou každé úterý a čtvrtek od 16:00.",
    author: "Trenér Petr Dvořák",
    date: "2024-09-05",
    category: "Přípravka",
    slug: "pripravka-zahajila-treninky-pro-novou-sezonu",
    image: "/logo.png"
  },
  {
    id: 4,
    title: "Ženy se připravují na oblastní ligu",
    excerpt: "Ženský tým intenzivně trénuje před startem oblastní ligy. Nové posily z mládežnických kategorií přinášejí do týmu čerstvý vítr a ambice na úspěšnou sezónu.",
    author: "Kapitánka týmu Anna Černá",
    date: "2024-08-28",
    category: "Ženy",
    slug: "zeny-se-pripravuji-na-oblastni-ligu",
    image: "/logo.png"
  },
  {
    id: 5,
    title: "Letní soustředění mládeže v Beskydech",
    excerpt: "Třicet mladých hráčů a hráček se zúčastnilo týdenního soustředění v Beskydech. Kromě intenzivního tréninku si užili i turistiku a týmové aktivity.",
    author: "Vedoucí mládeže Tomáš Veselý",
    date: "2024-08-20",
    category: "Mládež",
    slug: "letni-soustredeni-mladeze-v-beskydech",
    image: "/logo.png"
  },
  {
    id: 6,
    title: "Historický úspěch - 90 let TJ Sokol Svinov",
    excerpt: "Letos slavíme 90 let od založení oddílu národní házené TJ Sokol Svinov. Připravujeme řadu akcí na oslavu tohoto významného výročí včetně přátelských zápasů a výstavy.",
    author: "Předseda oddílu Josef Malý",
    date: "2024-08-15",
    category: "Historie",
    slug: "historicky-uspech-90-let-tj-sokol-svinov",
    image: "/logo.png"
  }
];

const categories = [
  "Všechny",
  "Muži", 
  "Ženy",
  "Dorostenci",
  "Dorostenky",
  "Mládež",
  "Přípravka",
  "Historie"
];

export default function BlogPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Novinky a články
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Sledujte nejnovější události, výsledky a příběhy z našeho oddílu národní házené
        </p>
      </div>

      {/* Categories Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => (
          <Button
            key={category}
            size="sm"
            variant="bordered"
            className="text-sm"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogPosts.map((post) => (
          <Card key={post.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2 mb-2">
                <TagIcon className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {post.category}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white line-clamp-2">
                {post.title}
              </h2>
            </CardHeader>
            <CardBody>
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-1">
                  <UserIcon className="w-4 h-4" />
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{new Date(post.date).toLocaleDateString('cs-CZ')}</span>
                </div>
              </div>

              <Button 
                as={Link} 
                href={`/blog/${post.slug}`}
                size="sm" 
                color="primary"
                endContent={<ArrowRightIcon className="w-4 h-4" />}
              >
                Přečíst více
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Newsletter Signup */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardBody className="text-center">
          <h3 className="text-2xl font-bold mb-2">
            Nechte si posílat novinky
          </h3>
          <p className="text-blue-100 mb-4">
            Přihlaste se k odběru novinek a buďte první, kdo se dozví o důležitých událostech v našem oddílu.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Váš email"
              className="flex-1 px-4 py-2 rounded-md text-gray-900"
            />
            <Button color="primary" className="bg-white text-blue-600 hover:bg-blue-50">
              Přihlásit
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 