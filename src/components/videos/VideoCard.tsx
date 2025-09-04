"use client";

import React from "react";
import { Video } from "@/types";
import {
  PlayIcon,
  PencilIcon,
  TrashIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Image,
  Tooltip,
} from "@heroui/react";
import { showToast } from "@/components/Toast";
import { translations } from "@/lib/translations";
import { ButtonWithTooltip, ButtonWithTooltipProps } from "../ButtonWithTooltip";

interface VideoCardProps {
  video: Video;
  onEdit: (video: Video) => void;
  onDelete: (video: Video) => void;
  categories?: Array<{ id: string; name: string; code: string }>;
  seasons?: Array<{
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  }>;
}

export function VideoCard({
  video,
  onEdit,
  onDelete,
  categories,
  seasons,
}: VideoCardProps) {
  const t = translations.components.videos.videoCard;
  const [isCopied, setIsCopied] = React.useState(false);


  const handlePlay = () => {
    window.open(video.youtube_url, "_blank");
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(video.youtube_url);
      setIsCopied(true);
      showToast.success("URL videa zkopírována do schránky");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
      showToast.danger("Nepodařilo se zkopírovat URL");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("cs-CZ");
  };

  const buttonsOnCard: ButtonWithTooltipProps[] = [
    {
      children: <PlayIcon className="w-4 h-4" />,
      tooltip: t.play,
      onPress: handlePlay,
      ariaLabel: t.play,
      isIconOnly: true
    },
    {
      children: <LinkIcon className="w-4 h-4" />,
      tooltip: t.copyUrl,
      onPress: handleCopyUrl,
      ariaLabel: t.copyUrl,
      isIconOnly: true
    },
    {
      children: <PencilIcon className="w-4 h-4" />,
      tooltip: t.edit,
      onPress: () => onEdit(video),
      ariaLabel: t.edit,
      isIconOnly: true
    },
    {
      children: <TrashIcon className="w-4 h-4" />,
      tooltip: t.delete,
      onPress: () => onDelete(video),
      ariaLabel: t.delete,
      isIconOnly: true,
      isDanger: true
    }
  ]

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        {/* Thumbnail */}
        <div className="relative w-full h-32 bg-gray-200 rounded-t-lg overflow-hidden">
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover"
              fallbackSrc="/placeholder-video.jpg"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <PlayIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
          {/* Category and Season Chips - Overlay on thumbnail */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
            <Chip
              size="sm"
              variant="solid"
              color="primary"
              className="shadow-md"
            >
              {video.category?.name ||
                categories?.find((cat) => cat.id === video.category_id)?.name ||
                video.category_id ||
                "No Category"}
            </Chip>
            {(video.seasons || video.season_id) && (
              <Chip
                size="sm"
                variant="solid"
                color="secondary"
                className="shadow-md"
              >
                {video.seasons?.name ||
                  seasons?.find((season) => season.id === video.season_id)
                    ?.name ||
                  (video.season_id ? `Sezóna ${video.season_id.slice(0, 8)}...` : 'Neznámá sezóna')}
              </Chip>
            )}
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-3">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 text-sm">
          {video.clubs?.name} - {video.title}
        </h3>

        {/* Description */}
        {video.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {video.description}
          </p>
        )}

        {/* Recording Date */}
        {video.recording_date && (
          <div className="mb-2 text-xs text-gray-500">
            <div>
              {t.recordingDate} {formatDate(video.recording_date)}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500 mb-3 space-y-1">
          <div>
            {t.createdAt} {formatDate(video.created_at)}
          </div>
          {video.updated_at !== video.created_at && (
            <div>
              {t.updatedAt} {formatDate(video.updated_at)}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          {buttonsOnCard.map((button) => (
            <ButtonWithTooltip key={button.ariaLabel} {...button} />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}