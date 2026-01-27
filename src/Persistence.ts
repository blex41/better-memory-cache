import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const getFullPath = (key: string, prefix: string): string => {
  return join(prefix, key + '.cache.json');
};

const getItem = (key: string, prefix: string): string => {
  if (!existsSync(getFullPath(key, prefix))) {
    throw new Error(`Item with key "${key}" not found in file system with prefix "${prefix}".`);
  }
  return readFileSync(getFullPath(key, prefix), 'utf-8');
};

const setItem = (key: string, value: string, prefix: string): void => {
  const fullPath = getFullPath(key, prefix);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, value, 'utf-8');
};

const removeItem = (key: string, prefix: string): void => {
  if (existsSync(getFullPath(key, prefix))) {
    unlinkSync(getFullPath(key, prefix));
  }
};

export { getItem, setItem, removeItem };