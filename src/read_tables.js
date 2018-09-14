const read = require('./lib/read');
const collect = require('./lib/collect');

const FILE_FIPS = `./data/2018/2018_fips_codes.csv`;
const FILE_DISTRICTS = `./data/2018/2018_congressional_fips.csv`;
const SKIP_HEADERS = true;

// denormalized lookup tables
const fips = {};
const states = {};
const data = {fips, states};

// generate empty state data
const emptyState = () => {
  return {fips: [], districts: [], fipsByDistrict:{}, districtsByFip:{}};
};

// build a promise chain that resolve when all tables have been completed
const promise = read(FILE_FIPS, SKIP_HEADERS, line => {
  // STEP 1: parse the fips file and populate data.fips
  const field = line.split(',');

  const state  = field[0];
  const id     = field[1];
  const suffix = field[2];
  const name   = field[3];
  const code   = `${id}${suffix}`;

  fips[code] = {id, state, suffix, code, name};

  states[state] = states[state] || emptyState();
  collect(states[state], 'fips', code);

}).then(() => read(FILE_DISTRICTS, SKIP_HEADERS, line => {
  // STEP 2: parse the districts file and populate data.districts
  const field = line.split(',');

  const state    = field[0];
  const county   = field[1];
  const district = field[2];
  const code     = `${state}${county}`;
  const fip = fips[code];
  const statename = fip.state;

  // this lookup is used by ingest_races.js
  states[statename] = states[statename] || emptyState();
  collect(states[statename], 'districts', district);
  collect(states[statename].fipsByDistrict, district, code);
  collect(states[statename].districtsByFip, code, district);
}));

// resolve/return the completed dataset
module.exports = promise.then(() => data);
