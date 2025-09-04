"use client";

import React from "react";
import { VideoCameraIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";

interface VideoPageHeaderProps {
  title: string;
  description: string;
  iconColor?: string;
  buttonColor?: "primary" | "success";
  buttonText: string;
  onAddVideo: () => void;
  isAddDisabled?: boolean;
  additionalInfo?: React.ReactNode;
}

export function VideoPageHeader({
  title,
  description,
  iconColor = "text-blue-600",
  buttonColor = "primary",
  buttonText,
  onAddVideo,
  isAddDisabled = false,
  additionalInfo,
}: VideoPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <VideoCameraIcon className={`w-8 h-8 ${iconColor}`} />
          {title}
        </h1>
        <p className="text-gray-600">{description}</p>
        {additionalInfo && (
          <div className="mt-2">
            {additionalInfo}
          </div>
        )}
      </div>
      
      <Button
        color={buttonColor}
        startContent={<PlusIcon className="w-5 h-5" />}
        onPress={onAddVideo}
        isDisabled={isAddDisabled}
      >
        {buttonText}
      </Button>
    </div>
  );
}
