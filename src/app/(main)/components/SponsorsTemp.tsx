'use client';

import {Card, CardBody, Image} from '@heroui/react';

export const SponsorsTemp = () => {
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
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
            <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
              <Image
                title="Město Ostrava"
                aria-label="Město Ostrava"
                src="/mesto-ostrava.png"
                alt="Město Ostrava logo"
                width={200}
                className="mx-auto mb-3"
              />
              <h4 className="font-semibold">Město Ostrava</h4>
            </div>

            <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
              <Image
                title="MSK"
                aria-label="MSK"
                src="/msk.jpeg"
                alt="MSK logo"
                width={200}
                className="mx-auto mb-3"
              />
              <h4 className="font-semibold">Moravskoslezský kraj</h4>
            </div>

            <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
              <Image
                title="NSA"
                aria-label="NSA"
                src="/nsa.png"
                alt="NSA logo"
                width={200}
                className="mx-auto mb-3"
              />
              <h4 className="font-semibold">NSA</h4>
            </div>

            <div className="text-center p-4 border rounded-lg hover:shadow-lg transition-shadow">
              <Image
                title="Sportovní hala Svinov"
                aria-label="Sportovní hala Svinov"
                src="/svinov.jpeg"
                alt="Svinov logo"
                width={200}
                className="mx-auto mb-3"
              />
              <h4 className="font-semibold">Úmob Svinov</h4>
            </div>
          </div>
        </CardBody>
      </Card>
    </section>
  );
};
