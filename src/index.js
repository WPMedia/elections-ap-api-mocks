const readTables = require('./read_tables');
const readRaces = require('./read_races');
const simulateRace = require('./simulate_race_random');

const SECONDS = 1000;
const MINUTE = 60000;

readTables.then(readRaces).then((tables) => {
  // run race:1000 and race:1001 simultaneously
  const races = [tables.races['1000'], tables.races['1001']];
  const start = Date.now();
  const end = start + 60 * MINUTE;
  const interval = 30 * SECONDS;

  const results = simulateRace(tables, races, start, end, interval);
  console.log('results:', JSON.stringify(results, null, 2));
});

