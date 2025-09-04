import { Modal, ModalContent, ModalHeader, ModalBody, ModalProps } from "@heroui/react";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { releaseNotes } from "@/utils/releaseNotes";
import { Chip } from "@heroui/react";


interface ReleaseNotesModalProps extends Omit<ModalProps, 'isOpen' | 'onOpenChange' | 'children'> {
    showReleaseNotes: boolean;
    setShowReleaseNotes: (show: boolean) => void;
}


export const ReleaseNotesModal = ({ showReleaseNotes, setShowReleaseNotes }: ReleaseNotesModalProps) => {
    return (
        <Modal 
        isOpen={showReleaseNotes} 
        onClose={() => setShowReleaseNotes(false)} 
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[90vh] overflow-hidden max-w-4xl mx-2",
          wrapper: "items-center justify-center p-2 sm:p-4",
          body: "max-h-[70vh] overflow-y-auto"
        }}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-blue-500" />
              <span>Release Notes</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {releaseNotes.map((release, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Version {release.version}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {release.date}
                      </p>
                    </div>
                    {index === 0 && (
                      <Chip color="success" variant="shadow">
                        Current
                      </Chip>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {release.features.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          🚀 New Features
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {release.features.map((feature, idx) => (
                            <li key={idx}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {release.improvements.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          🔧 Improvements
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {release.improvements.map((improvement, idx) => (
                            <li key={idx}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {release.bugFixes.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          🐛 Bug Fixes
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {release.bugFixes.map((bugFix, idx) => (
                            <li key={idx}>{bugFix}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {release.technical.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          📋 Technical Updates
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {release.technical.map((update, idx) => (
                            <li key={idx}>{update}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    )
}