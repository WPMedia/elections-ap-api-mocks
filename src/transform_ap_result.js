const parseName = require('./lib/parse_name');

/**
 * maps the simulated race data into a model matching the AP api.
 */
module.exports = (timestamp, interval, snapshot) => {
  const date = new Date(Number.parseInt(timestamp));
  const iso = date.toISOString();
  const day = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;

  const apRoot = {
    "electionDate": day, // "2018-09-12",
    "timestamp": iso,    // "2018-09-10T20:10:04.549Z",
    "nextrequest": `http://localhost:3001/${day}?test=true&format=json&level=fipscode&officeID=H%2CS&apiKey=AAAAAAAAAAAAA`,   // "https://api.ap.org/v2/elections/2018-09-12?format=JSON&level=FIPSCODE&officeID=G%2cH%2cS&test=TRUE&minDateTime=2018-09-10T13%3a28%3a27.167Z"
    "races": []
  };

  for (let raceId in snapshot) {
    const race = snapshot[raceId];
    const senate = race.chamber === "Senate";
    const house = race.chamber === "House";

    // STEP 1: defined the race node
    const apRace = {
      "test": true,                  // true
      "national": false,              // true
      "raceID": race.id,             // "40006"
      "raceType": "General",         // General, Dem Primary, GOP Primary, ...
      "raceTypeID": "G",             // D (Dem Primary), R (GOP Primary), G (General), ...
      "officeID": house ? 'H' : 'S', // P (President), G (Governor), S (U.S. Senate) and H (U.S. House)
      "officeName": house ? 'U.S. House' : 'U.S. Senate', // President, Governor, U.S. Senate, U.S. House
      // "party": "GOP",             // only for primary elections: Dem, GOP, Lib
      "reportingUnits": []
    };
    apRoot.races.push(apRace);

    // STEP 1b: optionally add house district attributes
    if (house) {
      const districtType = race.district === 'at-large' ? 'AtLarge' : race.district;
      apRace.districtType = districtType;            // CD for Congressional District, AtLarge for At-Large
      apRace.seatName = `District ${race.district}`; // The district or ballot initiative name: District 1
      apRace.seatNum = race.district;                // The district or ballot initiative number: 1
    }

    // STEP 2: append state level reporting unit
    const apStateUnit = {
      "statePostal": race.state,   // "RI"
      "stateName": race.statename, // "Rhode Island"
      "level": "state",            // "state"
      "lastUpdated": iso,          // "2018-09-10T13:28:27.167Z",
      "precinctsReporting": race.precinctsReporting,       // 53
      "precinctsTotal": race.precinctsTotal,               // 53
      "precinctsReportingPct": race.precinctsReportingPct, // 100.0
      "candidates": buildCandidateNodes(race.candidates)
    };
    apRace.reportingUnits.push(apStateUnit);

    // STEP 3: append fips level reporting unit
    race.fips.forEach(fip => {
      const apFipsUnit = {
        "statePostal": race.state, // "RI"
        "fipsCode": fip.fipCode,   // "44005"
        "level": "FIPSCode",       // "FIPSCode"
        "lastUpdated": iso,        // "2018-09-10T12:39:54.010Z"
        "precinctsReporting": race.precinctsReporting,       // 53
        "precinctsTotal": race.precinctsTotal,               // 53
        "precinctsReportingPct": race.precinctsReportingPct, // 100.0
        "candidates": buildCandidateNodes(fip.candidates)
      };
      apRace.reportingUnits.push(apFipsUnit);
    })
  }

  function buildCandidateNodes(candidates) {
    const party = {
      'D': 'Dem',
      'G': 'GOP',
      'L': 'Lib',
      'I': 'Ind'
    };

    return candidates.map((candidate, index) => {
      const name = parseName(candidate.name);
      const result = {
        "first": name.first,              // "Patricia"
        "last": name.last,                // "Morgan"
        "party": party[candidate.party],  // "GOP"
        "candidateID": candidate.id,      // "46253": AP-assigned unique ID for this candidate in a state's race
        "polID": candidate.id + 10000,    // "67604": Unique National Politician ID across all states and races
        "ballotOrder": index,             // 3: Ballot order of this candidate.
        "polNum":candidate.id + 20000,    // "42682": AP-assigned unique ID for this candidate in a specific state
        "voteCount": candidate.voteTally, // 34868
        "infoUpdated": true,              // true: Indicates that the candidate information has been updated
      };

      if (candidate.incumbent) result.incumbent = candidate.incumbent; // true: candidate is an incumbent
      if (candidate.winner) result.winner = 'X'; // X (winner), R (runoff), N (reversal)

      return result;
    });
  }

  return apRoot;
};