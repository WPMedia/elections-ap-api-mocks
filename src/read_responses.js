/**
 * Load and parse saved AP responses: export the race table, reporting units, and data model.
 **/
const readTree = require('./lib/read_tree')
const clone = require('./lib/clone')
const SKIP_HEADER = false

module.exports = (responseDir) => {
  const aggregate = {
    races: {},        // races: {response: {\final ap response\}, fips: {\fips vote-tally and party lean\}}
    models: {         // empty AP data model for each reporting level
      race: false,    // race model with empty reportingUnits[], and test=true
      level: {
        state: false, // state model with empty stateName, statePostal, candidates[], zero'd precinct count
        fips: false,  // fips model with empty fipsCode, statePostal, candidates[], zero'd precinct count
      }
    }
  }

  return readTree(responseDir, SKIP_HEADER, (file, line) => {
    const preview = JSON.parse(line);     // destringify
    const response = JSON.parse(preview); // serialize

    // for each race
    //   update models if not defined
    //   if state level reporting unit:
    //     export the race metadata and candidate list
    //   if fips level reporting unit:
    //     export precinct count, lean
    response.races.forEach(race => {
      extractRaceModel(race)

      race.reportingUnits.forEach(unit => {
        if (unit.level==='state') {
          extractStateModel(unit)
          aggregateRaceState(race,unit)
        } else if (unit.level==='FIPSCode') {
          extractFipsModel(unit)
          aggregateRaceFips(race,unit)
        } else {
          console.warn(`unknown reporting unit level ${unit.level}`)
        }
      })
    })
  }).then(() => aggregate);

  /* Utility Functions */
  function aggregateRaceState(race, unit) {
    const raceId = race.raceID
    const result = clone(unit)
    const model = clone(race)
    model.reportingUnits = []
    aggregate.races[raceId] = {
      id: raceId,
      apModel: model,
      result: result,
      fips: {}
    }
  }

  function aggregateRaceFips(race, unit) {
    const raceId = race.raceID
    const result = clone(unit)
    const fipId = unit.fipsCode

    // race.fips['10010'].party['GOP'] = fipTally / stateTally
    const meta = {
      id: fipId,
      apModel: result,
      party: {},
      votes: unit.candidates.reduce((count, candidate) => count + candidate.voteCount, 0)
    }
    unit.candidates.forEach(candidate => {
      meta.party[candidate.party] = candidate.voteCount / meta.votes
    })
    aggregate.races[raceId].fips[fipId] = meta
  }

  function extractRaceModel(race) {
    if (aggregate.models.race) return;

    const model = clone(race)
    model.test = true
    model.national = true
    model.officeID = ""
    model.officeName = ""
    model.raceID = ""
    model.raceType = ""
    model.raceTypeID = ""
    model.reportingUnits = []
    aggregate.models.race = model
  }

  function extractStateModel(state) {
    if (aggregate.models.level.state) return;

    const model = clone(state)
    model.stateName = ""
    model.statePostal = ""
    model.candidates = []
    model.precinctsReporting = 0
    model.precinctsReportingPct = 0
    model.precinctsTotal = 0
    model.lastUpdated = ""
    aggregate.models.level.state = model
  }

  function extractFipsModel(fips) {
    if (aggregate.models.level.fips) return;

    const model = clone(fips)
    model.fipsCode = ""
    model.statePostal = ""
    model.candidates = []
    model.precinctsReporting = 0
    model.precinctsReportingPct = 0
    model.precinctsTotal = 0
    model.lastUpdated = ""
    aggregate.models.level.fips = model
  }
};

