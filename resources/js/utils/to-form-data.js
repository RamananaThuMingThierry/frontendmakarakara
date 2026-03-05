export const toFormData = (payload) => {
  const fd = new FormData();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    // File / Blob
    if (value instanceof File || value instanceof Blob) {
      fd.append(key, value);
      return;
    }

    // Array (ex: multiple files, ids, etc.)
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item instanceof File || item instanceof Blob) {
          fd.append(key, item);
        } else {
          fd.append(key, String(item));
        }
      });
      return;
    }

    // Boolean
    if (typeof value === 'boolean') {
      fd.append(key, value ? '1' : '0');
      return;
    }

    fd.append(key, String(value));
  });

  return fd;
};