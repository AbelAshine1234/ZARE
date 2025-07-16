/**
 * Middleware to parse specific fields in req.body from JSON strings to objects/arrays.
 * @param {string[]} fields - Array of field names to parse.
 * @returns Express middleware function
 */
function jsonFieldsParser(fields = []) {
    return (req, res, next) => {
      if (!req.body) return next();
  
      for (const field of fields) {
        const value = req.body[field];
        if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
          try {
            req.body[field] = JSON.parse(value);
          } catch (err) {
            return res.status(400).json({
              error: `Field "${field}" must be a valid JSON string.`,
            });
          }
        }
      }
  
      next();
    };
  }
  
  module.exports = jsonFieldsParser;
  