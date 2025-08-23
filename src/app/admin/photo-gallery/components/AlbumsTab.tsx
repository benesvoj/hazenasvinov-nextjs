'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Badge } from "@heroui/badge";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Image } from "@heroui/react";
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  PhotoIcon
} from "@heroicons/react/24/outline";
import { PhotoAlbum, CreateAlbumData, UpdateAlbumData } from "@/types/photoGallery";
import { 
  getPhotoAlbums, 
  createPhotoAlbum, 
  updatePhotoAlbum, 
  deletePhotoAlbum 
} from "@/utils/supabase/photoGallery";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import AlbumFormModal from "./AlbumFormModal";

export default function AlbumsTab() {
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const [isAlbumFormOpen, setIsAlbumFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<PhotoAlbum | null>(null);
  const [deletingAlbum, setDeletingAlbum] = useState<PhotoAlbum | null>(null);

  // Load albums
  const loadAlbums = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPhotoAlbums();
      setAlbums(data);
    } catch (err) {
      setError("Chyba při načítání alb");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  // Handle album creation/editing
  const handleAlbumSubmit = async (albumData: CreateAlbumData | UpdateAlbumData) => {
    try {
      if (editingAlbum) {
        // Update existing album
        const updated = await updatePhotoAlbum(editingAlbum.id, albumData as UpdateAlbumData);
        if (updated) {
          setAlbums(prev => prev.map(album => 
            album.id === editingAlbum.id ? updated : album
          ));
        }
      } else {
        // Create new album
        const created = await createPhotoAlbum(albumData as CreateAlbumData);
        if (created) {
          setAlbums(prev => [created, ...prev]);
        }
      }
      
      setIsAlbumFormOpen(false);
      setEditingAlbum(null);
    } catch (err) {
      setError("Chyba při ukládání alba");
      console.error(err);
    }
  };

  // Handle album deletion
  const handleAlbumDelete = async () => {
    if (!deletingAlbum) return;
    
    try {
      const success = await deletePhotoAlbum(deletingAlbum.id);
      if (success) {
        setAlbums(prev => prev.filter(album => album.id !== deletingAlbum.id));
      }
      setIsDeleteModalOpen(false);
      setDeletingAlbum(null);
    } catch (err) {
      setError("Chyba při mazání alba");
      console.error(err);
    }
  };

  // Open edit modal
  const openEditModal = (album: PhotoAlbum) => {
    setEditingAlbum(album);
    setIsAlbumFormOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (album: PhotoAlbum) => {
    setDeletingAlbum(album);
    setIsDeleteModalOpen(true);
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingAlbum(null);
    setIsAlbumFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Načítání...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Fotoalba
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Správa fotoalb a jejich nastavení
          </p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={openCreateModal}
        >
          Nové album
        </Button>
      </div>

      {/* Albums Table */}
      <Card className="shadow-sm">
        <CardBody className="p-0">
          <Table aria-label="Seznam fotoalb">
            <TableHeader>
              <TableColumn>Název</TableColumn>
              <TableColumn>Popis</TableColumn>
              <TableColumn>Fotografie</TableColumn>
              <TableColumn>Viditelnost</TableColumn>
              <TableColumn>Pořadí</TableColumn>
              <TableColumn>Vytvořeno</TableColumn>
              <TableColumn>Akce</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Žádná alba nebyla nalezena">
              {albums.map((album) => (
                <TableRow key={album.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {album.cover_photo_url ? (
                        <Image
                          src={album.cover_photo_url}
                          alt={album.title}
                          className="object-cover rounded-lg"
                          width={48}
                          height={48}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <PhotoIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {album.title}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate text-gray-600 dark:text-gray-400">
                      {album.description || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge color="primary" variant="flat">
                      {album.photo_count || 0} fotek
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {album.is_public ? (
                        <EyeIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeSlashIcon className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {album.is_public ? "Veřejné" : "Soukromé"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {album.sort_order}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(album.created_at).toLocaleDateString('cs-CZ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => openEditModal(album)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={() => openDeleteModal(album)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Modals */}
      <AlbumFormModal
        isOpen={isAlbumFormOpen}
        onClose={() => {
          setIsAlbumFormOpen(false);
          setEditingAlbum(null);
        }}
        onSubmit={handleAlbumSubmit}
        album={editingAlbum}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingAlbum(null);
        }}
        onConfirm={handleAlbumDelete}
        title="Smazat album"
        message={`Opravdu chcete smazat album "${deletingAlbum?.title}"? Tato akce je nevratná a smaže také všechny fotografie v albu.`}
      />
    </div>
  );
}
