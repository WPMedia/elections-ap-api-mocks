/**
 * Naive name parser: should never be used in production path
 */
module.exports = (name) => {
  // this will break
  const segments = name.split(' ');
  const last = segments.length - 1;
  const suffix = ['jr','sr','i', 'ii', 'iii'];
  const firstname = segments[0];
  let lastname = segments[last];
  if (suffix.indexOf(lastname.toLowerCase()) !== -1) {
    lastname = `${segments[last - 1]} ${lastname}`;
  }

  return {
    first: firstname,
    last: lastname
  }
};