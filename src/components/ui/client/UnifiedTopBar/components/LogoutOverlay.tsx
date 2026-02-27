'use client';

import React from 'react';

import {Button} from '@heroui/react';

import {createPortal} from 'react-dom';

import {translations} from '@/lib/translations/index';

import {LoadingSpinner} from '@/components';

interface LogoutOverlayProps {
  isLoggingOut: boolean;
  logoutProgress: number;
  logoutError: string | null;
  onRetry: () => void;
  onCancel: () => void;
}

const LOGOUT_OVERLAY_Z_INDEX = 9999;

export const LogoutOverlay = ({
  isLoggingOut,
  logoutProgress,
  logoutError,
  onRetry,
  onCancel,
}: LogoutOverlayProps) => {
  return (
    <>
      {isLoggingOut &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={{zIndex: LOGOUT_OVERLAY_Z_INDEX}}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
              <div className="text-center">
                <LoadingSpinner />

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{width: `${logoutProgress}%`}}
                  ></div>
                </div>

                {/* Progress Text */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {logoutError
                    ? translations.common.logoutOverlay.logoutError
                    : translations.common.logoutOverlay.title}
                </h3>

                {/* Progress Steps or Error Message */}
                {logoutError ? (
                  <div className="text-sm text-red-600 dark:text-red-400 space-y-3">
                    <div className="flex items-center justify-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      {logoutError}
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" color="primary" onPress={onRetry} className="text-xs">
                        {translations.common.actions.tryAgain}
                      </Button>
                      <Button size="sm" variant="light" onPress={onCancel} className="text-xs">
                        {translations.common.actions.cancel}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {logoutProgress >= 25 && (
                      <div className="flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        {translations.common.logoutOverlay.progress.loggingOut}
                      </div>
                    )}
                    {logoutProgress >= 50 && (
                      <div className="flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        {translations.common.logoutOverlay.progress.endingSession}
                      </div>
                    )}
                    {logoutProgress >= 75 && (
                      <div className="flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        {translations.common.logoutOverlay.progress.preparingRedirect}
                      </div>
                    )}
                    {logoutProgress >= 100 && (
                      <div className="flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        {translations.common.logoutOverlay.progress.finishing}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
