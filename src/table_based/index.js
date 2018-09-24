const save = require('../lib/save');

const readTables = require('./read_tables');
const readRaces = require('./read_races');
const simulateRace = require('./simulate_race_random');
const transformAPResult = require('./transform_ap_result');

const SECONDS = 1000;
const MINUTE = 60000;

readTables.then(readRaces).then((tables) => {
  const races = tables.races; // {1000: tables.races['1000'], 1001: tables.races['1001']};
  const start = Date.now();
  const end = start + 60 * MINUTE;
  const interval = 30 * SECONDS;

  const results = simulateRace(tables, races, start, end, interval);
  const timestamps = Object.getOwnPropertyNames(results);
  timestamps.forEach(timestamp => {
    // convert simulation to AP model
    const apResult = transformAPResult(timestamp, interval, results[timestamp]);

    // write result to test directory
    const directory = `./test/${apResult.electionDate}/`;
    const filename = `${apResult.timestamp}test=true&format=json&level=fipscode&.json`;
    const stringEscape = true;
    save(directory, filename, apResult, stringEscape);
  });
});

