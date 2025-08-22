import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import Link from "@/components/Link";

export default function SponsorsSection() {
  return (
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
                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                  M
                </span>
              </div>
              <h4 className="font-semibold">Město Ostrava</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hlavní partner
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                  S
                </span>
              </div>
              <h4 className="font-semibold">Sportovní hala Svinov</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Partner zázemí
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-yellow-600 dark:text-yellow-400 font-bold text-lg">
                  Č
                </span>
              </div>
              <h4 className="font-semibold">Český svaz házené</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sportovní partner
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400 font-bold text-lg">
                  T
                </span>
              </div>
              <h4 className="font-semibold">TJ Sokol</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Organizační partner
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Business Partners */}
      <Card className="mb-8">
        <CardHeader>
          <h3 className="text-xl font-semibold text-center">
            Obchodní partneři
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center">
            <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 font-bold">
                  A
                </span>
              </div>
              <h4 className="font-semibold">Auto Servis Svinov</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Dopravní partner
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  R
                </span>
              </div>
              <h4 className="font-semibold">Restaurace U Sokolů</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gastronomický partner
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-pink-600 dark:text-pink-400 font-bold">
                  F
                </span>
              </div>
              <h4 className="font-semibold">Fitness Centrum Svinov</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Kondiční partner
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Media Partners */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold text-center">
            Mediální partneři
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center">
            <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 font-bold">
                  N
                </span>
              </div>
              <h4 className="font-semibold">Novojičínský deník</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tiskový partner
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-teal-600 dark:text-teal-400 font-bold">
                  P
                </span>
              </div>
              <h4 className="font-semibold">Polar TV</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Televizní partner
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                  R
                </span>
              </div>
              <h4 className="font-semibold">Radio Ostrava</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rozhlasový partner
              </p>
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
              Podpořte národní házenou a staňte se součástí našeho úspěšného
              týmu. Nabízíme různé možnosti spolupráce a partnerství.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button as={Link} href="/contact" color="primary" size="lg">
                Kontaktovat nás
              </Button>
              <Button as={Link} href="/about" variant="bordered" size="lg">
                Více informací
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
