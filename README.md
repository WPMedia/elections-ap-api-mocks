## Test data generator for the 2018 EP Elections API .

This application generates timestamped json files matching 
the AP elections api. These files can be served by `wapo-backend` 
to run tests against page builder features during an election cycle.

To run execute 
* `npm install`
* `npm run start`

The races to simulate are set in `src/index.js`

Input Files
* `data/2018/2018_congressional_fips.csv`
* `data/2018/2018_fips_codes.csv`
* `data/2018/2018_races.csv`

Output Directory
* `tests/[date]/[utc-time]test=true&format=json&level=fipscode.json`

The races file `2018_races.csv` is compiled by hand and 
needs to be updated for each election cycle. There is a
matching `xlsx` file to assist with the manual data collection.

References
Congressional Districts Relationship Files
https://www.census.gov/geo/maps-data/data/cd_national.html

2010 FIPS Codes for Counties and County Equivalent Entities
https://www.census.gov/geo/reference/codes/cou.html

AP Election API Developer Guide
http://customersupport.ap.org/doc/AP_Elections_API_Developer_Guide.pdf