# Hook Factory Pattern - Migration Guide

## For New Entities

When creating hooks for a new entity, use the factory pattern:

### Data Fetching Hook
```typescript
export const useFetchYourEntity = createDataFetchHook<YourEntity>({
endpoint: API_ROUTES.yourEntity.root,
entityName: 'yourEntity',
errorMessage: 'Failed to fetch items',
});
```

### CRUD Hook
```typescript
const _useYourEntity = createCRUDHook<YourEntity, YourEntityInsert>({
	baseEndpoint: API_ROUTES.yourEntity.root,
	byIdEndpoint: API_ROUTES.yourEntity.byId,
	entityName: 'yourEntity',
	messages: { /* ... */},
});

export function useYourEntity() {
	const {create, update, deleteItem, ...rest} = _useYourEntity();
	return {
		createYourEntity: create,
		updateYourEntity: update,
		deleteYourEntity: deleteItem,
		...rest,
	};
}
```