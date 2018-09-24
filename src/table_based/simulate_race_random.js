const clone = require('../lib/clone');

module.exports = (tables, races, startime, endtime, interval) => {
  /**
   * Simulation
   *   1. for each district in race (house = single, senate = statewide)
   *      1. for each fips code
   *        1. total votes = 300,000 / number of fips in district,
   *        2. start time = starttime + rand(1/3 endtime - starttime)
   *        3. vote progression = add 15,000 votes to a random candidate, 54% winner, 44% opposing party, OTHER 2%
   */
  const duration = endtime - startime;
  const intervals = duration / interval;

  // define the time based result log
  // format: results[timestamp].races[raceid] = {interval results}
  const results = {};

  // run each race
  Object.getOwnPropertyNames(races).forEach(raceId => {
    const race = races[raceId];
    const stateTable = tables.states[race.state];
    const districts = race.chamber === 'Senate' ? stateTable.districts.length : 1;
    const stateVoters = 300000 * districts;
    const votersPerFip = stateVoters / stateTable.fips.length;
    const votersPerInterval = Math.ceil(votersPerFip / intervals);

    // assign weights to each candidate
    const calcVoteWeight = (candidate) => {
      const isMajorParty = candidate.party === 'D' || candidate.party === 'R';
      const isLikelyWinner = race.winner === candidate.id;

      if (isLikelyWinner) return 0.6;
      if (isMajorParty) return 0.38;
      return 0.02;
    };

    // build out starting tallies for candidates
    const zeroCandidateTally = (candidate) => {
      return {
        id: candidate.id,
        name: candidate.name,
        party: candidate.party,
        incumbent: candidate.incumbent,
        voteTally: 0,
        voteWeight: calcVoteWeight(candidate)
      }
    };

    // build out starting tallies for each candidate by fip
    const zeroFipTally = (fipCode) => {
      return {
        fipCode: fipCode,
        voteTally: 0,
        voteStart: startime +  Math.floor(Math.random() * (duration/3)),
        candidates: race.candidates.map(candidate => zeroCandidateTally(candidate))
      };
    };

    // call the race if candidate has enough votes
    const raceCall = (run) => {
      // iterate over the candidates to find the leader
      run.candidates.forEach(candidate => {
        if (run.precinctsReportingPct < 80) return;

        if (
          run.precinctsReportingPct > 80 &&
          candidate.voteTally / run.voteTally < 0.65
        ) return;

        if (
          run.precinctsReportingPct > 90 &&
          candidate.voteTally / run.voteTally < 0.55
        ) return;

        if (
          run.precinctsReportingPct > 98 &&
          candidate.voteTally / run.voteTally < 0.51
        ) return;

        run.raceCalled = true;
        run.raceWinner = candidate;
        candidate.winner = true;
      });
    };

    // prime the election results
    const run = {
      id: race.id,
      state: race.state,
      chamber: race.chamber,
      statename: race.statename,
      district: race.district,
      precinctsReporting:0,
      precinctsTotal:100,
      precinctsReportingPct: 0,
      raceStarted: false,
      raceCalled: false,
      raceWinner: null,
      voteTally: 0,
      candidates: race.candidates.map(fip => zeroCandidateTally(fip)),
      fips: race.fips.map(fip => zeroFipTally(fip))
    };

    // run the simulation
    for (let timestamp = startime; timestamp < endtime; timestamp += interval) {
      // run fips level voting sim
      run.fips.forEach(fip => {
        if (timestamp < fip.voteStart) return;

        const progress = ((timestamp - fip.voteStart) / duration);
        run.raceStarted = true;
        run.precinctsReporting = Math.ceil(run.precinctsTotal * progress);
        run.precinctsReportingPct = 100 * run.precinctsReporting / run.precinctsTotal;

        const candidates = fip.candidates;
        let threshold = Math.random();
        for (let i = 0; i < candidates.length; i ++) {
          threshold -= candidates[i].voteWeight;
          const isLast = i + 1 === candidates.length;
          if (threshold <= 0 || isLast) {
            // update fips level tallies
            fip.voteTally += votersPerInterval;
            candidates[i].voteTally += votersPerInterval;

            // update state level tallies
            run.voteTally += votersPerInterval;
            run.candidates[i].voteTally += votersPerInterval;
            raceCall(run);
            break;
          }
        }
      });

      // save the race interval by timestamp
      results[timestamp] = results[timestamp] || {};
      results[timestamp][race.id] = clone(run);
    }
  });

  return results;
};
