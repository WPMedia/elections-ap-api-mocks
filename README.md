## Test data generator for the 2018 AP Elections API .

This application generates timestamped json files matching 
the AP elections api. These files can be served by `wapo-backend` 
to run tests against page builder features during an election cycle.

To run execute 
* `npm install`
* `npm run start`

The default data generator iterates over a directory of saved
ap responses and simulates the races over a new timeline.


### Developer Steps

1. Download a saved ap run into data/YYYY/ap-responses/
2. Update the election date and date override in `index.js`
3. Run `npm run start` to simulate the races
4. Clone the `wapo-backend` repository from github
5. Copy the generated files from `/test/YYYY-MM-DD` 
   into `wapo-backend\_responses-to-serve`
6. Follow the readme in wapo-backend to push results to the s3 in realtime

### Alternate race simulator
There is alternate race simulator that reads races from csv tables instead 
of parsing saved AP responses. These csv files are easier to edit by hand, 
but the resulting files may be incomplete.

Input Files
* `data/2018/2018_congressional_fips.csv`
* `data/2018/2018_fips_codes.csv`
* `data/2018/2018_races.csv`

Output Directory
* `tests/[date]/[utc-time]test=true&format=json&level=fipscode.json`

The races to run can be set in `src/table_based/index.js`

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