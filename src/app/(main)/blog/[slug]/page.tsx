'use client';

import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import Link from "@/components/Link";
import Image from "next/image";
import { 
  CalendarIcon, 
  UserIcon, 
  TagIcon,
  ArrowLeftIcon,
  ShareIcon,
  BookmarkIcon
} from "@heroicons/react/24/outline";

// Sample blog post data - in a real app, this would come from a database
const blogPost = {
  id: 1,
  title: "Úspěšný start sezóny pro mužský tým",
  content: `
    <p>Mužský tým TJ Sokol Svinov zahájil novou sezónu v 1. lize národní házené výbornými výsledky. V prvních třech zápasech získali maximum bodů a ukázali, že patří mezi favority soutěže.</p>
    
    <h2>První zápas: TJ Sokol Svinov vs. TJ Sokol Ostrava</h2>
    <p>V úvodním zápase sezóny jsme doma přivítali tradičního rivala z Ostravy. Zápas byl velmi vyrovnaný a skončil výsledkem 15:12 ve prospěch našeho týmu. Klíčovou roli sehrál kapitán týmu Petr Novák, který vstřelil 8 branek.</p>
    
    <h2>Druhý zápas: TJ Sokol Svinov vs. TJ Sokol Frýdek-Místek</h2>
    <p>Druhý zápas sezóny přinesl ještě přesvědčivější vítězství. Naše mužstvo dominovalo po celý zápas a zvítězilo 18:10. Výborně se předvedl mladý útočník Martin Svoboda, který vstřelil 6 branek.</p>
    
    <h2>Třetí zápas: TJ Sokol Svinov vs. TJ Sokol Karviná</h2>
    <p>V třetím kole jsme vyhráli 16:14 v těsném zápase proti Karviné. Tým ukázal výbornou mentální odolnost a dokázal udržet vedení i v závěrečných minutách.</p>
    
    <h2>Co nás čeká dál?</h2>
    <p>V příštích týdnech nás čekají další důležité zápasy. Trenérský tým je s dosavadními výsledky spokojen, ale víme, že sezóna je dlouhá a musíme zůstat soustředění.</p>
    
    <h2>Statistiky po třech kolech:</h2>
    <ul>
      <li>Zápasy: 3</li>
      <li>Výhry: 3</li>
      <li>Prohry: 0</li>
      <li>Skóre: 49:36</li>
      <li>Body: 6</li>
    </ul>
    
    <p>Celý tým se těší na další zápasy a věříme, že budeme pokračovat v úspěšné sérii. Děkujeme všem fanouškům za podporu a těšíme se na vás na dalších zápasech!</p>
  `,
  author: "Trenér Jan Novák",
  date: "2024-09-15",
  category: "Muži",
  slug: "uspesny-start-sezony-pro-muzsky-tym",
  image: "/logo.png",
  readTime: "5 min",
  tags: ["Muži", "1. liga", "Sezóna 2024/25"]
};

const relatedPosts = [
  {
    id: 2,
    title: "Dorostenci vyhráli turnaj v Ostravě",
    excerpt: "Náš dorostenecký tým se zúčastnil mezinárodního turnaje v Ostravě...",
    date: "2024-09-10",
    category: "Dorostenci",
    slug: "dorostenci-vyhráli-turnaj-v-ostrave"
  },
  {
    id: 3,
    title: "Přípravka zahájila tréninky pro novou sezónu",
    excerpt: "Děti z přípravky se vrátily z prázdnin a začaly s pravidelnými tréninky...",
    date: "2024-09-05",
    category: "Přípravka",
    slug: "pripravka-zahajila-treninky-pro-novou-sezonu"
  }
];

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <div>
        <Button 
          as={Link} 
          href="/blog"
          variant="bordered"
          startContent={<ArrowLeftIcon className="w-4 h-4" />}
        >
          Zpět na novinky
        </Button>
      </div>

      {/* Article Header */}
      <article>
        <header className="space-y-4">
          <div className="flex items-center gap-2">
            <TagIcon className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {blogPost.category}
            </span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
            {blogPost.title}
          </h1>
          
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <UserIcon className="w-4 h-4" />
              <span>{blogPost.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              <span>{new Date(blogPost.date).toLocaleDateString('cs-CZ')}</span>
            </div>
            <span>Čtení: {blogPost.readTime}</span>
          </div>
        </header>

        {/* Featured Image */}
        <div className="my-8">
          <Image 
            src={blogPost.image} 
            alt={blogPost.title}
            width={800}
            height={400}
            className="w-full h-64 lg:h-80 object-cover rounded-lg"
          />
        </div>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: blogPost.content }} />
        </div>

        {/* Tags */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tagy:</span>
            {blogPost.tags.map((tag) => (
              <span 
                key={tag}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Share and Bookmark */}
        <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Button 
              variant="bordered" 
              size="sm"
              startContent={<ShareIcon className="w-4 h-4" />}
            >
              Sdílet
            </Button>
            <Button 
              variant="bordered" 
              size="sm"
              startContent={<BookmarkIcon className="w-4 h-4" />}
            >
              Uložit
            </Button>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Související články
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {relatedPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardBody>
                <div className="flex items-center gap-2 mb-2">
                  <TagIcon className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    {post.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {post.title}
                </h3>
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