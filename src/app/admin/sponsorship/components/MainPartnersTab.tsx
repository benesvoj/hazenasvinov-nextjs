'use client';

import {Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from '@heroui/table';
import {Card, CardBody, CardHeader} from '@heroui/card';
import {Button} from '@heroui/button';
import {Badge} from '@heroui/badge';
import {translations} from '@/lib/translations';
import {useSponsorshipData, MainPartner} from '@/hooks/settings/useSponsorshipData';
import {PartnerFormModal} from './PartnerFormModal';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  StarIcon,
  GlobeAltIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import {useState} from 'react';
import {Image} from '@heroui/image';

export const MainPartnersTab = () => {
  const {
    mainPartners,
    loading,
    error,
    deleteMainPartner,
    createMainPartner,
    updateMainPartner,
    refreshAll,
  } = useSponsorshipData();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<MainPartner | null>(null);

  const getLevelBadge = (level: string) => {
    const levelColors = {
      platinum: 'bg-gradient-to-r from-gray-400 to-gray-300 text-gray-800',
      gold: 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-yellow-800',
    };

    return (
      <Badge
        className={levelColors[level as keyof typeof levelColors] || 'bg-gray-100 text-gray-800'}
      >
        {translations.sponsorship.levels[level as keyof typeof translations.sponsorship.levels]}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <Badge
        className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}
      >
        {translations.sponsorship.status[status as keyof typeof translations.sponsorship.status]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Opravdu chcete smazat tohoto partnera?')) {
      setDeletingId(id);
      try {
        await deleteMainPartner(id);
      } catch (error) {
        console.error('Error deleting partner:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleAddPartner = () => {
    setEditingPartner(null);
    setIsModalOpen(true);
  };

  const handleEditPartner = (partner: MainPartner) => {
    setEditingPartner(partner);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (editingPartner) {
        await updateMainPartner(editingPartner.id, formData);
      } else {
        await createMainPartner(formData);
      }
    } catch (error) {
      console.error('Error saving partner:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Načítání hlavních partnerů...</p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="text-red-500 mb-4">
            <HeartIcon className="w-16 h-16 mx-auto" />
          </div>
          <div className="mb-2 text-red-600">Chyba při načítání dat</div>
          <div className="text-sm text-gray-500 mb-4">{error}</div>
          <Button
            color="primary"
            onPress={refreshAll}
            startContent={<PlusIcon className="w-5 h-5" />}
          >
            Zkusit znovu
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between w-full items-center">
            <div>
              <h3 className="text-xl font-semibold">{translations.sponsorship.mainPartners}</h3>
              <p className="text-sm text-gray-600">
                {translations.sponsorship.mainPartnersDescription}
              </p>
            </div>
            <Button
              color="primary"
              startContent={<PlusIcon className="w-5 h-5" />}
              onPress={handleAddPartner}
            >
              {translations.sponsorship.button.addPartner}
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {mainPartners.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <StarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <div className="mb-2">Žádní hlavní partneři</div>
              <div className="text-sm text-gray-400">
                Začněte přidáváním prvního hlavního partnera
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table aria-label="Main partners table">
                <TableHeader>
                  <TableColumn>Název</TableColumn>
                  <TableColumn>Úroveň</TableColumn>
                  <TableColumn>Web</TableColumn>
                  <TableColumn>Období</TableColumn>
                  <TableColumn>Výhody</TableColumn>
                  <TableColumn>Status</TableColumn>
                  <TableColumn>Akce</TableColumn>
                </TableHeader>
                <TableBody>
                  {mainPartners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {partner.logo_url ? (
                            <Image
                              src={partner.logo_url}
                              alt={partner.name}
                              className="rounded-lg object-cover"
                              width={40}
                              height={40}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <StarIcon className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{partner.name}</span>
                            <span className="text-xs text-gray-500">{partner.description}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getLevelBadge(partner.level)}</TableCell>
                      <TableCell>
                        {partner.website_url ? (
                          <a
                            href={partner.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                          >
                            <GlobeAltIcon className="w-4 h-4" />
                            <span className="text-sm">Navštívit</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {formatDate(partner.start_date)} - {formatDate(partner.end_date)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="space-y-1">
                            {partner.benefits.slice(0, 2).map((benefit, index) => (
                              <div key={index} className="text-xs text-gray-600">
                                • {benefit}
                              </div>
                            ))}
                            {partner.benefits.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{partner.benefits.length - 2} dalších
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(partner.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" color="primary" variant="light" isIconOnly>
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            color="primary"
                            variant="light"
                            isIconOnly
                            onPress={() => handleEditPartner(partner)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            isIconOnly
                            isLoading={deletingId === partner.id}
                            onPress={() => handleDelete(partner.id)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      <PartnerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingPartner || undefined}
        mode={editingPartner ? 'edit' : 'add'}
        partnerType="main"
      />
    </>
  );
};
