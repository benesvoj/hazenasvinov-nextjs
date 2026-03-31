import {createDataFetchHook} from '@/hooks/factories';

type FeatureConfig = {
  api: {
    root: string;
  };
  entity: {
    plural: string;
  };
  messages: {
    fetchFailed: string;
  };
};

export function createFeatureFetch<T>(config: FeatureConfig) {
  return (params?: string) => {
    return createDataFetchHook<T>({
      endpoint: config.api.root + (params || ''),
      entityName: config.entity.plural,
      errorMessage: config.messages.fetchFailed,
    })();
  };
}
