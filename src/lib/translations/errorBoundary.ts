export const errorBoundary = {
  title: 'Něco se pokazilo',
  description:
    'Stránku se nepodařilo vykreslit. Zkuste to prosím znovu — pokud potíže přetrvávají, dejte vědět správci.',
  retry: 'Zkusit znovu',
  digest: (digest: string) => `Kód chyby: ${digest}`,
};
