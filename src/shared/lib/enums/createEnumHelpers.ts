type EnumLike = Record<string, string>;

export function createEnumHelpers<T extends EnumLike>(
  enumObject: T,
  getLabels: () => Record<T[keyof T], string>
) {
  const getOptions = () => {
    const labels = getLabels();

    return (Object.values(enumObject) as T[keyof T][]).map((value) => ({
      value,
      label: labels[value],
    }));
  };

  return {
    getLabels,
    getOptions,
  };
}
