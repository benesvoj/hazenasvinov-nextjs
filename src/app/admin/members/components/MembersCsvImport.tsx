import React, {useState, useCallback} from 'react';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/modal';
import {Select, SelectItem, Button, Input, Checkbox} from '@heroui/react';

import {
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

import {createClient} from '@/utils/supabase/client';

import {Genders, getMemberFunctionOptions, MemberFunction, getGenderOptions} from '@/enums';

interface CsvMember {
  regNumber: string;
  surname: string;
  firstName: string;
  dateOfBirth: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface MembersCsvImportProps {
  onImportComplete: () => void;
  categories: Record<string, string>;
  sexOptions: Record<string, string>;
}

export default function MembersCsvImport({
  onImportComplete,
  categories,
  sexOptions,
}: MembersCsvImportProps) {
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvMember[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [defaultCategory, setDefaultCategory] = useState(Genders.MALE);
  const [defaultSex, setDefaultSex] = useState<Genders>(Genders.MALE);
  const [defaultFunctions, setDefaultFunctions] = useState<string[]>([MemberFunction.PLAYER]);

  const supabase = createClient();

  const parseCsvFile = useCallback((csvFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');

      if (lines.length < 2) {
        alert('CSV soubor je prázdný nebo neobsahuje data');
        return;
      }

      // Detect separator (comma or semicolon)
      const firstLine = lines[0];
      const separator = firstLine.includes(';') ? ';' : ',';

      console.log('🔍 Detected CSV separator:', separator);

      // Parse header and data
      const header = firstLine.split(separator).map((h) => h.trim().toLowerCase());
      const data: CsvMember[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(separator).map((v) => v.trim());
          if (values.length >= 4) {
            data.push({
              regNumber: values[0] || '',
              surname: values[1] || '',
              firstName: values[2] || '',
              dateOfBirth: values[3] || '',
            });
          }
        }
      }

      console.log('🔍 Parsed CSV data:', data);
      setPreview(data);
    };
    reader.readAsText(csvFile);
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (!selectedFile) return;

      if (!selectedFile.name.endsWith('.csv')) {
        alert('Prosím vyberte CSV soubor');
        return;
      }

      setFile(selectedFile);
      parseCsvFile(selectedFile);
    },
    [parseCsvFile]
  );

  const handleImport = useCallback(async () => {
    if (!preview.length) return;

    setImporting(true);
    setImportResult(null);

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const member of preview) {
      try {
        // Validate required fields (date of birth is now optional)
        if (!member.surname || !member.firstName) {
          result.failed++;
          result.errors.push(`Chybí povinná data pro: ${member.surname} ${member.firstName}`);
          continue;
        }

        // Parse date (optional)
        let parsedDate: string | null = null;
        if (member.dateOfBirth && member.dateOfBirth.trim()) {
          if (member.dateOfBirth.includes('.')) {
            // European format: DD.MM.YYYY
            const [day, month, year] = member.dateOfBirth.split('.');
            parsedDate = `${parseInt(year)}-${String(parseInt(month)).padStart(2, '0')}-${String(parseInt(day)).padStart(2, '0')}`;
          } else {
            // Standard format
            parsedDate = member.dateOfBirth;
          }
        }

        // Insert member
        const {error} = await supabase.from('members').insert({
          registration_number: member.regNumber || undefined,
          name: member.firstName,
          surname: member.surname,
          date_of_birth: parsedDate, // Can be null if not provided
          category: defaultCategory,
          sex: defaultSex,
          functions: defaultFunctions,
        });

        if (error) {
          result.failed++;
          result.errors.push(
            `Chyba při importu ${member.surname} ${member.firstName}: ${error.message}`
          );
        } else {
          result.success++;
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push(
          `Chyba při importu ${member.surname} ${member.firstName}: ${error.message}`
        );
      }
    }

    setImportResult(result);
    setImporting(false);
  }, [preview, defaultCategory, defaultSex, defaultFunctions, supabase]);

  const handleClose = useCallback(() => {
    setFile(null);
    setPreview([]);
    setImportResult(null);
    onClose();
  }, [onClose]);

  const handleImportComplete = useCallback(() => {
    handleClose();
    onImportComplete();
  }, [handleClose, onImportComplete]);

  return (
    <>
      <Button
        color="secondary"
        variant="flat"
        startContent={<DocumentArrowUpIcon className="w-4 h-4" />}
        onPress={onOpen}
      >
        Import CSV
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} size="4xl">
        <ModalContent>
          <ModalHeader>Import členů z CSV</ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vyberte CSV soubor
                </label>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  placeholder="Vyberte CSV soubor"
                />
                <p className="text-sm text-gray-500 mt-1">
                  CSV musí obsahovat sloupce: regNumber, surname, firstName, dateOfBirth
                  <br />
                  Podporované oddělovače: čárka (,) nebo středník (;)
                </p>
              </div>

              {/* Default Values */}
              {file && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="Výchozí kategorie"
                    selectedKeys={[defaultCategory]}
                    onSelectionChange={(keys) => setDefaultCategory(Array.from(keys)[0] as Genders)}
                  >
                    {Object.entries(categories).map(([key, value]) => (
                      <SelectItem key={key}>{value}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Výchozí pohlaví"
                    selectedKeys={[defaultSex]}
                    onSelectionChange={(keys) => setDefaultSex(Array.from(keys)[0] as Genders)}
                  >
                    {getGenderOptions().map(({value, label}) => (
                      <SelectItem key={value}>{label}</SelectItem>
                    ))}
                  </Select>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Výchozí funkce
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {getMemberFunctionOptions().map(({value, label}) => (
                        <Checkbox
                          key={value}
                          isSelected={defaultFunctions.includes(value)}
                          onValueChange={(checked) => {
                            if (checked) {
                              setDefaultFunctions([...defaultFunctions, value]);
                            } else {
                              setDefaultFunctions(defaultFunctions.filter((f) => f !== value));
                            }
                          }}
                        >
                          {label}
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Preview */}
              {preview.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium mb-3">Náhled dat ({preview.length} členů)</h4>
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">Reg. číslo</th>
                          <th className="px-3 py-2 text-left">Příjmení</th>
                          <th className="px-3 py-2 text-left">Jméno</th>
                          <th className="px-3 py-2 text-left">Datum narození</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((member, index) => (
                          <tr key={index} className="border-t border-gray-100 dark:border-gray-700">
                            <td className="px-3 py-2">{member.regNumber || '-'}</td>
                            <td className="px-3 py-2">{member.surname}</td>
                            <td className="px-3 py-2">{member.firstName}</td>
                            <td className="px-3 py-2">{member.dateOfBirth}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Result */}
              {importResult && (
                <div
                  className={`p-4 rounded-lg ${
                    importResult.failed === 0
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {importResult.failed === 0 ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                    )}
                    <span className="font-medium">
                      Import dokončen: {importResult.success} úspěšných, {importResult.failed} chyb
                    </span>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="mt-3">
                      <h5 className="font-medium text-sm mb-2">Chyby:</h5>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResult.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-600">
                            • {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleClose}>
              Zavřít
            </Button>
            {preview.length > 0 && !importResult && (
              <Button
                color="primary"
                onPress={handleImport}
                isLoading={importing}
                startContent={<DocumentArrowUpIcon className="w-4 h-4" />}
              >
                Importovat ({preview.length} členů)
              </Button>
            )}
            {importResult && importResult.success > 0 && (
              <Button
                color="success"
                onPress={handleImportComplete}
                startContent={<CheckCircleIcon className="w-4 h-4" />}
              >
                Dokončit
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
