const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const z = require("zod");

exports.fileValidator = () =>
  z.object({
    size: z
      .number()
      .max(MAX_FILE_SIZE, `El tamaño máximo de archivo es ${MAX_FILE_SIZE / (1024 * 1024)}MB.`),
    mimetype: z
      .string()
      .refine((mimetype) => ACCEPTED_IMAGE_TYPES.includes(mimetype), `Solo los formatos ${ACCEPTED_IMAGE_TYPES.join(", ")} son válidos.`),
  });