type EnumLike = Record<string, string>;

export function createEnumHelpers<T extends EnumLike>(
  enumObject: T,
  getLabels: () => Record<T[keyof T], string>
) {
  const getOptions = () => {
    const labels = getLabels();

    return Object.entries(labels).map(([value, label]) => ({
      value: value as T[keyof T],
      label,
    }));
  };

  return {
    getLabels,
    getOptions,
  };
}
