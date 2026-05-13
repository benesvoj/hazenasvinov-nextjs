export function EmptyPanel({title, description}: {title: string; description: string}) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="text-center text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium mb-2">{title}</p>
        <p className="text-sm">{description}</p>
      </div>
    </div>
  );
}
