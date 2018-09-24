const readResponses = require('./read_responses')
const simulateRace = require('./simulate_race')

const AP_RESPONSE_DIR = `./data/2018/ap-responses/2018-09-92/`

const ELECTION_DATE = '2018-11-06T19:00:00.000Z' // reported by response.electionDate and response.lastUpdated
const DATE_OVERRIDE = '2018-99-99'               // date used for output directory

const SECONDS = 1000;
const MINUTE = 60000;

readResponses(AP_RESPONSE_DIR).then((data) => {
  const start = new Date(ELECTION_DATE).getTime();
  const end = start + 60 * MINUTE;
  const interval = 30 * SECONDS;

  return simulateRace(data,start,end,interval,DATE_OVERRIDE)
}).catch(console.error)