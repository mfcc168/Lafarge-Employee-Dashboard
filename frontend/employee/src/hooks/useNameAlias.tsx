export const useNameAlias = (name: string | null): string => {
  const map: Record<string, string> = {
    "Ho Yeung Cheung": "Alex",
    "Hung Ki So": "Dominic",
    "Kwok Wai Mak": "Matthew",
  };
  return name && map[name] ? map[name] : name ?? "No Salesman Selected";
};

