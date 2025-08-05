import { useTSParams } from './useTSParams';

type MustURL = `/${string}`;

export function useTSExtractParams(pattern: MustURL) {
    const store = useTSParams.getState();

    // Populate internal param/query store
    store.setFromPattern(pattern);

    const params = store.params;
    const query = store.query;

    return { ...params, ...query };
}
