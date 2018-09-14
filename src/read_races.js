const read = require('./lib/read');

const FILE_RACES = `./data/2018/2018_races.csv`;
const SKIP_HEADERS = true;
const AT_LARGE = (state) => ['AK', 'DE', 'MT', 'ND', 'SD', 'VT', 'WY'].indexOf(state) !== -1;

function parseRaces(tables) {
  const races = {};
  tables.races = races;

  const readRaces = read(FILE_RACES, SKIP_HEADERS, line => {
    const field = line.split(',');

    const race = {
      id:       field[0],
      chamber:  field[1],
      state:    field[2],
      winner:   field[4],
      district: field[5],
      special:  field[6],
      fips: [],
      candidates: []
    };
    races[race.id] = race;

    if (race.chamber === 'House') {
      const table = tables.states[race.state];
      const district = race.district;

      if (AT_LARGE(race.state)) {
        race.fips = table.fips;
      } else {
        race.fips = table.fipsByDistrict[district];
      }
    } else { // race.chamber === 'Senate'
      const table = tables.states[race.state];
      if (AT_LARGE(race.state)) {
        race.fips = table.fips;
      } else {
        race.fips = Object.getOwnPropertyNames(table.districtsByFip);
      }
    }

    // iterate through the candidates: starting indexes [7,11,15]
    [7,11,15].forEach(index => {
      if (!field[index]) return;

      race.candidates.push({
        id:   field[index],
        name: field[index+1],
        party: field[index+2],
        incumbent: field[index+3],
      });
    });
  }).then(() => tables); // return the tables and races when done reading

  return readRaces;
}

module.exports = parseRaces;
