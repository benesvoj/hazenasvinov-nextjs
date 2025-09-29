'use client';
import {useState} from 'react';

import {Card, CardHeader, CardBody, Switch, Button, Spinner, Input} from '@heroui/react';

import {translations} from '@/lib/translations';

import {LoadingSpinner} from '@/components';
import {usePageVisibility} from '@/hooks';
import {PageVisibility} from '@/types';

export default function ClubPagesCard() {
  const {
    pages,
    loading,
    error,
    fetchPages,
    togglePageVisibility,
    updatePageOrder,
    updatePageRoute,
    updatePageTitle,
  } = usePageVisibility();
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingRoute, setEditingRoute] = useState<string | null>(null);
  const [routeValue, setRouteValue] = useState<string>('');
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [titleValue, setTitleValue] = useState<string>('');

  const handleToggleVisibility = async (id: string) => {
    setUpdating(id);
    try {
      await togglePageVisibility(id);
    } finally {
      setUpdating(null);
    }
  };

  const handleOrderChange = async (id: string, newOrder: number) => {
    setUpdating(id);
    try {
      await updatePageOrder(id, newOrder);
    } finally {
      setUpdating(null);
    }
  };

  const handleRouteEdit = (page: any) => {
    setEditingRoute(page.id);
    setRouteValue(page.page_route);
  };

  const handleRouteSave = async (id: string) => {
    setUpdating(id);
    try {
      await updatePageRoute(id, routeValue);
      setEditingRoute(null);
      setRouteValue('');
    } finally {
      setUpdating(null);
    }
  };

  const handleRouteCancel = () => {
    setEditingRoute(null);
    setRouteValue('');
  };

  const handleTitleEdit = (page: any) => {
    setEditingTitle(page.id);
    setTitleValue(page.page_title);
  };

  const handleTitleSave = async (id: string) => {
    setUpdating(id);
    try {
      await updatePageTitle(id, titleValue);
      setEditingTitle(null);
      setTitleValue('');
    } finally {
      setUpdating(null);
    }
  };

  const handleTitleCancel = () => {
    setEditingTitle(null);
    setTitleValue('');
  };

  const groupedPages = pages.reduce(
    (acc, page) => {
      const category = page.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(page);
      return acc;
    },
    {} as Record<string, PageVisibility[]>
  );

  const categoryLabels: Record<string, string> = {
    main: 'Hlavní stránky',
    categories: 'Kategorie týmů',
    info: 'Informační stránky',
    admin: 'Administrace',
    landing: 'Sekce hlavní stránky',
    other: 'Ostatní',
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>Stránky klubu</CardHeader>
        <CardBody className="flex justify-center py-8">
          <Spinner size="lg" />
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>Stránky klubu</CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="text-red-500 font-medium">Chyba při načítání stránek: {error}</div>

            {error.includes('Failed to fetch') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Tabulka stránek není nastavena</h4>
                <p className="text-yellow-700 text-sm mb-3">
                  Pro použití systému správy viditelnosti stránek je potřeba nejprve vytvořit
                  databázovou tabulku.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-yellow-600">
                    <strong>Možnost 1:</strong> Spusťte automatický setup:
                  </p>
                  <code className="bg-yellow-100 px-2 py-1 rounded text-xs">
                    npm run setup:page-visibility
                  </code>

                  <p className="text-yellow-600 mt-3">
                    <strong>Možnost 2:</strong> Spusťte SQL skript ručně v Supabase dashboardu:
                  </p>
                  <code className="bg-yellow-100 px-2 py-1 rounded text-xs">
                    scripts/setup_page_visibility_manual.sql
                  </code>
                </div>
              </div>
            )}

            <div className="text-sm text-gray-600">
              <p>Pokud problém přetrvává, zkontrolujte:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Připojení k Supabase databázi</li>
                <li>Environment proměnné (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)</li>
                <li>Row Level Security nastavení</li>
              </ul>
            </div>

            <div className="pt-4">
              <Button
                color="primary"
                variant="bordered"
                onPress={fetchPages}
                className="w-full sm:w-auto"
              >
                Zkusit znovu
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Správa viditelnosti stránek</h3>
          <p className="text-sm text-gray-600">
            Zde můžete nastavit, které stránky budou viditelné pro návštěvníky webu. Skryté stránky
            nebudou zobrazeny v navigaci ani nebudou přístupné.
          </p>
        </CardHeader>
        <CardBody>
          {Object.entries(groupedPages).map(([category, categoryPages]) => (
            <div key={category} className="mb-6">
              <h4 className="text-md font-medium text-gray-700 mb-3 border-b pb-2">
                {categoryLabels[category] || category}
              </h4>
              <div className="space-y-3">
                {(categoryPages as PageVisibility[])
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">#{page.sort_order}</span>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={page.sort_order}
                              onChange={(e) => {
                                const newOrder = parseInt(e.target.value);
                                if (!isNaN(newOrder) && newOrder > 0) {
                                  handleOrderChange(page.id, newOrder);
                                }
                              }}
                              className="w-16 px-2 py-1 text-sm border rounded"
                              disabled={updating === page.id}
                            />
                          </div>
                          <div>
                            {editingTitle === page.id ? (
                              <div className="flex items-center space-x-2 mb-2">
                                <Input
                                  size="sm"
                                  value={titleValue}
                                  onChange={(e) => setTitleValue(e.target.value)}
                                  placeholder="Zadejte nový název stránky"
                                  className="w-64"
                                />
                                <Button
                                  size="sm"
                                  color="success"
                                  variant="flat"
                                  onPress={() => handleTitleSave(page.id)}
                                  isDisabled={updating === page.id}
                                >
                                  Uložit
                                </Button>
                                <Button
                                  size="sm"
                                  color="default"
                                  variant="light"
                                  onPress={handleTitleCancel}
                                >
                                  Zrušit
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 mb-2">
                                <h5 className="font-medium text-gray-900">{page.page_title}</h5>
                                <Button
                                  size="sm"
                                  color="primary"
                                  variant="light"
                                  onPress={() => handleTitleEdit(page)}
                                >
                                  Upravit název
                                </Button>
                              </div>
                            )}
                            {editingRoute === page.id ? (
                              <div className="flex items-center space-x-2 mt-1">
                                <Input
                                  size="sm"
                                  value={routeValue}
                                  onChange={(e) => setRouteValue(e.target.value)}
                                  placeholder="Zadejte novou URL"
                                  className="w-48"
                                />
                                <Button
                                  size="sm"
                                  color="success"
                                  variant="flat"
                                  onPress={() => handleRouteSave(page.id)}
                                  isDisabled={updating === page.id}
                                >
                                  Uložit
                                </Button>
                                <Button
                                  size="sm"
                                  color="default"
                                  variant="light"
                                  onPress={handleRouteCancel}
                                >
                                  Zrušit
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 mt-1">
                                <p className="text-sm text-gray-600">{page.page_route}</p>
                                <Button
                                  size="sm"
                                  color="primary"
                                  variant="light"
                                  onPress={() => handleRouteEdit(page)}
                                >
                                  Upravit URL
                                </Button>
                              </div>
                            )}
                            {page.page_description && (
                              <p className="text-xs text-gray-500 mt-1">{page.page_description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Switch
                          isSelected={page.is_visible}
                          onValueChange={() => handleToggleVisibility(page.id)}
                          isDisabled={updating === page.id}
                          color="success"
                        >
                          {page.is_visible ? 'Viditelné' : 'Skryté'}
                        </Switch>
                        {updating === page.id && <LoadingSpinner />}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Landing Page Sections Management */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Sekce hlavní stránky</h3>
          <p className="text-sm text-gray-600">
            Zde můžete nastavit, které sekce budou zobrazeny na hlavní stránce webu. Skryté sekce
            nebudou zobrazeny návštěvníkům.
          </p>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {/* Club Highlight Section */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1">
                <h5 className="font-medium text-gray-900">
                  {translations.sections.title} &ldquo;{translations.sections.clubHighlight}&rdquo;
                </h5>
                <p className="text-sm text-gray-600 mt-1">
                  Zobrazuje informace o klubu a jeho historii
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Switch
                  isSelected={
                    pages.find((p) => p.page_key === 'club_highlight_section')?.is_visible ?? true
                  }
                  onValueChange={() => {
                    const page = pages.find((p) => p.page_key === 'club_highlight_section');
                    if (page) {
                      handleToggleVisibility(page.id);
                    }
                  }}
                  color="success"
                >
                  {(pages.find((p) => p.page_key === 'club_highlight_section')?.is_visible ?? true)
                    ? 'Viditelné'
                    : 'Skryté'}
                </Switch>
              </div>
            </div>

            {/* Sponsors Section */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex-1">
                <h5 className="font-medium text-gray-900">
                  {translations.sections.title} &ldquo;{translations.sections.sponsors}&rdquo;
                </h5>
                <p className="text-sm text-gray-600 mt-1">
                  Zobrazuje seznam partnerů a sponzorů klubu
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Switch
                  isSelected={
                    pages.find((p) => p.page_key === 'sponsors_section')?.is_visible ?? true
                  }
                  onValueChange={() => {
                    const page = pages.find((p) => p.page_key === 'sponsors_section');
                    if (page) {
                      handleToggleVisibility(page.id);
                    }
                  }}
                  color="success"
                >
                  {(pages.find((p) => p.page_key === 'sponsors_section')?.is_visible ?? true)
                    ? 'Viditelné'
                    : 'Skryté'}
                </Switch>
              </div>
            </div>

            {/* Call to Action Section */}
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex-1">
                <h5 className="font-medium text-gray-900">
                  {translations.sections.title} &ldquo;{translations.sections.callToAction}&rdquo;
                </h5>
                <p className="text-sm text-gray-600 mt-1">
                  Zobrazuje výzvu k připojení se ke klubu
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Switch
                  isSelected={
                    pages.find((p) => p.page_key === 'call_to_action_section')?.is_visible ?? true
                  }
                  onValueChange={() => {
                    const page = pages.find((p) => p.page_key === 'call_to_action_section');
                    if (page) {
                      handleToggleVisibility(page.id);
                    }
                  }}
                  color="success"
                >
                  {(pages.find((p) => p.page_key === 'call_to_action_section')?.is_visible ?? true)
                    ? 'Viditelné'
                    : 'Skryté'}
                </Switch>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
