export const sanitizeFilename = (filename) => {
  // Remove special characters and replace spaces with underscores
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
};

export const generateUniqueFilename = (prefix, originalName) => {
  const timestamp = Date.now();
  const ext = originalName.split('.').pop();
  const sanitized = sanitizeFilename(originalName.replace(`.${ext}`, ''));
  return `${prefix}_${sanitized}_${timestamp}.${ext}`;
};
