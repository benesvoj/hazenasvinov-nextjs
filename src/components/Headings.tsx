export const Heading1 = ({ children }: { children: React.ReactNode }) => {
  return <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{children}</h1>;
};

export const Heading2 = ({ children }: { children: React.ReactNode }) => {
  return <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{children}</h2>;
};

export const Heading3 = ({ children }: { children: React.ReactNode }) => {
  return <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{children}</h3>;
};

export const Heading4 = ({ children }: { children: React.ReactNode }) => {
  return <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 py-4">{children}</h4>;
};

export const Heading5 = ({ children }: { children: React.ReactNode }) => {
  return <h5 className="text-sm font-bold text-gray-900 dark:text-gray-100">{children}</h5>;
};

export const Heading6 = ({ children }: { children: React.ReactNode }) => {
  return <h6 className="text-xs font-bold text-gray-900 dark:text-gray-100">{children}</h6>;
};