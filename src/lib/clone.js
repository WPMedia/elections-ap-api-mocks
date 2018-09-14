/**
 * Clones an object by serializing it to-from JSON
 * @param object
 * @returns {any}
 */
module.exports = (object) => {
  const asJson = JSON.stringify(object);
  return JSON.parse(asJson);
};