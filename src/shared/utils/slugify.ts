export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export const withRandomSuffix = (value: string) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const base = slugify(value) || 'profile';
  return `${base}-${suffix}`;
};
