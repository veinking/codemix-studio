export function createUniqueFileName(fileName, usedNames) {
  const normalizedUsedNames = usedNames instanceof Set ? usedNames : new Set(usedNames || []);
  if (!normalizedUsedNames.has(fileName)) return fileName;

  const dotIndex = fileName.lastIndexOf('.');
  const hasExtension = dotIndex > 0;
  const stem = hasExtension ? fileName.slice(0, dotIndex) : fileName;
  const extension = hasExtension ? fileName.slice(dotIndex) : '';

  let suffix = 2;
  let candidate = `${stem} (${suffix})${extension}`;
  while (normalizedUsedNames.has(candidate)) {
    suffix += 1;
    candidate = `${stem} (${suffix})${extension}`;
  }
  return candidate;
}
