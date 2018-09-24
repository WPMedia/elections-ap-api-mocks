const clone = require('./lib/clone')
const save = require('./lib/save')

/**
 * Fills in the empty data models from ingest_responses.js and
 * uses the race, candidate, and fips data to simulate a race.
 *
 * Each iteration is written out as a timestamped string escaped
 * AP response file in the output directory.
 *
 *
 * Simulation
 *   1. for each race
 *      1. get state result: or zero counts
 *      2. for each fipsCode
 *        1. get fips result: or zero counts
 *          1. start time = starttime + rand(1/3 endtime - starttime)
 *          2. vote progression = add progress % of total FIP votes to random candidate (based on fip lean)
 *          3. update state voteCount
 **/
module.exports = (apParse, startime, endtime, interval, DATE_OVERRIDE) => {
  const races = Object.keys(apParse.races)
  const results = {}

  for (let timestep = startime; timestep <= endtime; timestep += interval) {
    const date = new Date(Number.parseInt(timestep))
    const iso = date.toISOString()
    const day = iso.split("T")[0]

    const apResponse = {
      "electionDate": day,
      "timestamp": iso,
      "nextrequest": `http://localhost:3001/${day}?test=true&format=json&level=fipscode&officeID=H%2CS&apiKey=AAAAAAAAAAAAA`,   // "https://api.ap.org/v2/elections/2018-09-12?format=JSON&level=FIPSCODE&officeID=G%2cH%2cS&test=TRUE&minDateTime=2018-09-10T13%3a28%3a27.167Z"
      "races": []
    };

    races.forEach(raceId => {
      // 1. get the root ap race model and the current vote tally
      const race = apParse.races[raceId]
      const apModel = clone(race.apModel)

      // 2. append the state level reporting unit
      const stateUnit = getStateResult(race)
      stateUnit.lastUpdated = iso
      apModel.reportingUnits.push(stateUnit)

      // 3. for each FIPS generate votes and update the state level aggregate
      Object.values(race.fips).forEach(fip => {
        const fipsUnit = getFIPResult(race, fip)
        fipsUnit.lastUpdated = iso
        apModel.reportingUnits.push(fipsUnit)

        incrementVote(race, fip, timestep, stateUnit, fipsUnit)
      })

      // 4. call the race
      callRace(apModel, stateUnit)

      apResponse.races.push(apModel)
    })

    // output interval results to the output directory
    writeResult(apResponse)
  }

  /* Utility Functions */
  function getStateResult(race) {
    if (results[race.id]) {
      return results[race.id].state
    } else {
      const result = zeroCount(race.result)
      results[race.id] = {
        state: result,
        fips: {}
      }
      return result;
    }
  }

  function getFIPResult(race, fip) {
    const fipsResult = results[race.id].fips
    if (fipsResult[fip.id]) {
      return fipsResult[fip.id]
    } else {
      const result = zeroCount(fip.apModel)
      fipsResult[fip.id] = result
      return result
    }
  }

  function zeroCount(reportingUnit) {
    const result = clone(reportingUnit)
    result.precinctsTotal = result.precinctsReportingTotal || 200
    result.precinctsReporting = 0
    result.precinctsReportingPct = 0
    result.candidates.forEach(candidate => candidate.voteCount = 0)
    return result
  }

  function incrementVote(race, fip, timestep, stateUnit, fipsUnit) {
    const duration = endtime - startime
    fip.voteStart = fip.voteStart || startime + Math.floor(Math.random() * (duration/3))
    if (timestep < fip.voteStart) return;

    // 1: select candidate
    const progress = (timestep - fip.voteStart) / (endtime - fip.voteStart)
    const votes = Math.ceil(fip.votes * (interval/duration))
    const candidate = selectCandidate(fip)
    incrementVoteCount(fipsUnit, candidate, votes, progress)
    incrementVoteCount(stateUnit, candidate, votes, progress)
  }

  function selectCandidate(fip) {
    const candidates = fip.apModel.candidates
    const lean = fip.party
    let threshold = Math.random();

    for (let i = 0; i < candidates.length; i ++) {
      threshold -= lean[candidates[i].party];
      const isLast = i + 1 === candidates.length;
      if (threshold <= 0 || isLast) {
        return candidates[i]
      }
    }
  }

  function incrementVoteCount(unit, selected, voteCount, progress) {
    const candidate = unit.candidates.find(current => current.candidateID === selected.candidateID)

    candidate.voteCount += voteCount
    unit.precinctsReporting = Math.ceil(unit.precinctsTotal * progress);
    unit.precinctsReportingPct = 100 * unit.precinctsReporting / unit.precinctsTotal;
  }

  function callRace(race, stateUnit) {
    const totalVotes = stateUnit.candidates.reduce((aggregate, candidate) => aggregate + candidate.voteCount || 0, 0)

    // iterate over the candidates to find the leader
    stateUnit.candidates.forEach(candidate => {
      if (stateUnit.precinctsReportingPct < 80) return;

      if (
        stateUnit.precinctsReportingPct > 80 &&
        candidate.voteCount / totalVotes < 0.65
      ) return;

      if (
        stateUnit.precinctsReportingPct > 90 &&
        candidate.voteCount / totalVotes < 0.55
      ) return;

      if (
        stateUnit.precinctsReportingPct > 98 &&
        candidate.voteCount / totalVotes < 0.51
      ) return;

      // mark the candidate the winner in all reporting units
      race.reportingUnits.forEach(unit => {
        const unitCandidate = unit.candidates.find(current => current.candidateID === candidate.candidateID)
        unitCandidate.winner = 'X';
      })
    });
  }

  function writeResult(apResponse) {
    // write result to test directory
    const directory = `./test/${DATE_OVERRIDE}/`;
    const filename = `${apResponse.timestamp}test=true&format=json&level=fipscode&.json`;
    const stringEscape = true;
    console.log(`exporting: ${directory}${filename}`)
    save(directory, filename, apResponse, stringEscape);
  }
}
