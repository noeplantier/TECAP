const store = new Map<string, string>();

export default {
  getItem: async (key: string) => store.get(key) ?? null,
  setItem: async (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: async (key: string) => {
    store.delete(key);
  },
  clear: async () => {
    store.clear();
  },
  getAllKeys: async () => Array.from(store.keys()),
  multiGet: async (keys: string[]) => keys.map((key) => [key, store.get(key) ?? null]),
  multiRemove: async (keys: string[]) => {
    keys.forEach((key) => store.delete(key));
  },
};
