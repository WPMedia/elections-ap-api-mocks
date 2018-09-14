/**
 * appends unique values to list[key] and
 * ensures that the underling list is defined
 * @param list
 * @param key
 * @param value
 */
module.exports = (list, key, value) => {
  list[key] = list[key] || [];

  if (list[key].indexOf(value) == -1) {
    list[key].push(value);
  }
};