export function strEquals(str1: string | null | undefined, str2: string | null | undefined) {
  return !isNullOrUndefined(str1) && !isNullOrUndefined(str2) && str1?.localeCompare?.(str2!) === 0
}

export function isNullOrUndefinedOrBlank(item: string | null | undefined) {
  return isNullOrUndefined(item) || item!.length === 0
}

export function isNullOrUndefined(item: any) {
  return item === null || item === undefined;
}

export function roundToTenth(value: number) {
  return Math.round(10 * value)/10;
}

export function debounce (func: Function, delay: number) {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

export function throttle(func: (...args: any[]) => void, limit: number) {
  let inThrottle: boolean;
  return function (...args: any[]) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function strCompare<T>(a: T, b: T, key: keyof T) {
  return (a[key]?.toString() ?? "").localeCompare(b[key]?.toString() ?? "");
}

export function groupByKey<T extends Record<string, any>, K extends keyof T>(
  items: T[],
  key: K
): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const groupKey = item[key];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function indexByKey<T extends Record<string, any>, K extends keyof T>(
  items: T[],
  key: K
): Record<string, T> {
  return items.reduce((acc, item) => {
    const groupKey = item[key];
    acc[groupKey] = item; // overwrite if duplicate key
    return acc;
  }, {} as Record<string, T>);
}