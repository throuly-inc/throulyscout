// City data organized by state abbreviation
// Includes market data for major cities across all 50 states + DC

export interface CityData {
  name: string;
  state: string;
  population: string;
  medianHomePrice: number;
  medianRent: number;
  medianHouseholdIncome: number;
  zipCodes: string[];
  isMetro: boolean;
}

export const citiesByState: Record<string, CityData[]> = {
  AL: [
    { name: "Birmingham", state: "AL", population: "200K", medianHomePrice: 165000, medianRent: 1050, medianHouseholdIncome: 42000, zipCodes: ["35201", "35203", "35205", "35209", "35213"], isMetro: true },
    { name: "Huntsville", state: "AL", population: "215K", medianHomePrice: 260000, medianRent: 1150, medianHouseholdIncome: 58000, zipCodes: ["35801", "35802", "35803", "35805", "35806"], isMetro: true },
    { name: "Mobile", state: "AL", population: "187K", medianHomePrice: 145000, medianRent: 950, medianHouseholdIncome: 40000, zipCodes: ["36601", "36602", "36604", "36606", "36608"], isMetro: true },
    { name: "Montgomery", state: "AL", population: "200K", medianHomePrice: 155000, medianRent: 1000, medianHouseholdIncome: 44000, zipCodes: ["36101", "36104", "36106", "36109", "36111"], isMetro: true },
    { name: "Tuscaloosa", state: "AL", population: "101K", medianHomePrice: 195000, medianRent: 1050, medianHouseholdIncome: 43000, zipCodes: ["35401", "35404", "35405", "35406"], isMetro: false },
  ],
  AK: [
    { name: "Anchorage", state: "AK", population: "291K", medianHomePrice: 340000, medianRent: 1350, medianHouseholdIncome: 76000, zipCodes: ["99501", "99502", "99503", "99504", "99507"], isMetro: true },
    { name: "Fairbanks", state: "AK", population: "32K", medianHomePrice: 260000, medianRent: 1200, medianHouseholdIncome: 62000, zipCodes: ["99701", "99709"], isMetro: false },
    { name: "Juneau", state: "AK", population: "32K", medianHomePrice: 380000, medianRent: 1400, medianHouseholdIncome: 82000, zipCodes: ["99801", "99802"], isMetro: false },
  ],
  AZ: [
    { name: "Phoenix", state: "AZ", population: "1.6M", medianHomePrice: 410000, medianRent: 1550, medianHouseholdIncome: 62000, zipCodes: ["85001", "85003", "85004", "85006", "85008", "85012", "85014", "85016", "85018", "85020"], isMetro: true },
    { name: "Tucson", state: "AZ", population: "542K", medianHomePrice: 305000, medianRent: 1200, medianHouseholdIncome: 46000, zipCodes: ["85701", "85704", "85705", "85710", "85711", "85712", "85716", "85719"], isMetro: true },
    { name: "Mesa", state: "AZ", population: "504K", medianHomePrice: 400000, medianRent: 1500, medianHouseholdIncome: 60000, zipCodes: ["85201", "85202", "85203", "85204", "85205", "85206", "85207"], isMetro: true },
    { name: "Scottsdale", state: "AZ", population: "241K", medianHomePrice: 680000, medianRent: 1900, medianHouseholdIncome: 92000, zipCodes: ["85250", "85251", "85254", "85255", "85257", "85258", "85260"], isMetro: true },
    { name: "Chandler", state: "AZ", population: "275K", medianHomePrice: 450000, medianRent: 1600, medianHouseholdIncome: 85000, zipCodes: ["85224", "85225", "85226", "85248", "85249"], isMetro: true },
    { name: "Gilbert", state: "AZ", population: "267K", medianHomePrice: 480000, medianRent: 1700, medianHouseholdIncome: 95000, zipCodes: ["85233", "85234", "85295", "85296", "85297", "85298"], isMetro: true },
    { name: "Tempe", state: "AZ", population: "180K", medianHomePrice: 420000, medianRent: 1500, medianHouseholdIncome: 58000, zipCodes: ["85281", "85282", "85283", "85284"], isMetro: true },
  ],
  AR: [
    { name: "Little Rock", state: "AR", population: "202K", medianHomePrice: 195000, medianRent: 1000, medianHouseholdIncome: 48000, zipCodes: ["72201", "72202", "72204", "72205", "72207", "72209", "72211"], isMetro: true },
    { name: "Fayetteville", state: "AR", population: "93K", medianHomePrice: 280000, medianRent: 1100, medianHouseholdIncome: 50000, zipCodes: ["72701", "72703", "72704"], isMetro: false },
    { name: "Fort Smith", state: "AR", population: "89K", medianHomePrice: 155000, medianRent: 850, medianHouseholdIncome: 40000, zipCodes: ["72901", "72903", "72904"], isMetro: false },
  ],
  CA: [
    { name: "Los Angeles", state: "CA", population: "3.9M", medianHomePrice: 950000, medianRent: 2800, medianHouseholdIncome: 69000, zipCodes: ["90001", "90004", "90005", "90006", "90012", "90015", "90019", "90024", "90027", "90028", "90034", "90036", "90046", "90048", "90064", "90066", "90068"], isMetro: true },
    { name: "San Francisco", state: "CA", population: "874K", medianHomePrice: 1350000, medianRent: 3200, medianHouseholdIncome: 120000, zipCodes: ["94102", "94103", "94104", "94107", "94108", "94109", "94110", "94112", "94114", "94115", "94116", "94117", "94118", "94121", "94122", "94123", "94127", "94131", "94132", "94133", "94134"], isMetro: true },
    { name: "San Diego", state: "CA", population: "1.4M", medianHomePrice: 880000, medianRent: 2600, medianHouseholdIncome: 83000, zipCodes: ["92101", "92102", "92103", "92104", "92105", "92107", "92109", "92110", "92111", "92113", "92114", "92115", "92116", "92117", "92120", "92122", "92123", "92126", "92129", "92130"], isMetro: true },
    { name: "San Jose", state: "CA", population: "1.0M", medianHomePrice: 1300000, medianRent: 3100, medianHouseholdIncome: 117000, zipCodes: ["95110", "95112", "95113", "95116", "95117", "95118", "95120", "95121", "95122", "95123", "95124", "95125", "95126", "95127", "95128", "95129", "95130", "95131", "95132", "95133", "95134", "95135", "95136", "95138", "95139", "95141", "95148"], isMetro: true },
    { name: "Sacramento", state: "CA", population: "524K", medianHomePrice: 470000, medianRent: 1800, medianHouseholdIncome: 65000, zipCodes: ["95811", "95814", "95816", "95818", "95819", "95820", "95822", "95823", "95824", "95825", "95826", "95828", "95831", "95833", "95834", "95835"], isMetro: true },
    { name: "Fresno", state: "CA", population: "542K", medianHomePrice: 350000, medianRent: 1350, medianHouseholdIncome: 50000, zipCodes: ["93701", "93702", "93703", "93704", "93706", "93710", "93711", "93720", "93721", "93722", "93726", "93727", "93728", "93730"], isMetro: true },
    { name: "Oakland", state: "CA", population: "433K", medianHomePrice: 850000, medianRent: 2700, medianHouseholdIncome: 80000, zipCodes: ["94601", "94602", "94603", "94605", "94606", "94607", "94609", "94610", "94611", "94612", "94618", "94619", "94621"], isMetro: true },
    { name: "Irvine", state: "CA", population: "307K", medianHomePrice: 1200000, medianRent: 3000, medianHouseholdIncome: 108000, zipCodes: ["92602", "92603", "92604", "92606", "92612", "92614", "92618", "92620"], isMetro: true },
  ],
  CO: [
    { name: "Denver", state: "CO", population: "715K", medianHomePrice: 560000, medianRent: 1850, medianHouseholdIncome: 72000, zipCodes: ["80202", "80203", "80204", "80205", "80206", "80207", "80209", "80210", "80211", "80212", "80216", "80218", "80219", "80220", "80222", "80223", "80224", "80227", "80230", "80231", "80237", "80238", "80239", "80246", "80247", "80249"], isMetro: true },
    { name: "Colorado Springs", state: "CO", population: "478K", medianHomePrice: 420000, medianRent: 1500, medianHouseholdIncome: 63000, zipCodes: ["80903", "80904", "80905", "80906", "80907", "80909", "80910", "80911"], isMetro: true },
    { name: "Aurora", state: "CO", population: "386K", medianHomePrice: 440000, medianRent: 1600, medianHouseholdIncome: 62000, zipCodes: ["80010", "80011", "80012", "80013", "80014", "80015", "80016", "80017"], isMetro: true },
    { name: "Boulder", state: "CO", population: "105K", medianHomePrice: 850000, medianRent: 2200, medianHouseholdIncome: 78000, zipCodes: ["80301", "80302", "80303", "80304", "80305", "80310"], isMetro: false },
    { name: "Fort Collins", state: "CO", population: "169K", medianHomePrice: 510000, medianRent: 1650, medianHouseholdIncome: 66000, zipCodes: ["80521", "80524", "80525", "80526"], isMetro: false },
  ],
  CT: [
    { name: "Bridgeport", state: "CT", population: "148K", medianHomePrice: 280000, medianRent: 1400, medianHouseholdIncome: 47000, zipCodes: ["06601", "06604", "06605", "06606", "06607", "06608", "06610"], isMetro: true },
    { name: "New Haven", state: "CT", population: "134K", medianHomePrice: 260000, medianRent: 1350, medianHouseholdIncome: 44000, zipCodes: ["06510", "06511", "06513", "06515", "06519"], isMetro: true },
    { name: "Hartford", state: "CT", population: "121K", medianHomePrice: 195000, medianRent: 1200, medianHouseholdIncome: 36000, zipCodes: ["06101", "06103", "06105", "06106", "06112", "06114"], isMetro: true },
    { name: "Stamford", state: "CT", population: "135K", medianHomePrice: 600000, medianRent: 2200, medianHouseholdIncome: 92000, zipCodes: ["06901", "06902", "06903", "06905", "06906", "06907"], isMetro: true },
  ],
  DE: [
    { name: "Wilmington", state: "DE", population: "71K", medianHomePrice: 240000, medianRent: 1200, medianHouseholdIncome: 46000, zipCodes: ["19801", "19802", "19803", "19804", "19805", "19806", "19807", "19808", "19809", "19810"], isMetro: true },
    { name: "Dover", state: "DE", population: "39K", medianHomePrice: 230000, medianRent: 1100, medianHouseholdIncome: 50000, zipCodes: ["19901", "19904"], isMetro: false },
    { name: "Newark", state: "DE", population: "33K", medianHomePrice: 280000, medianRent: 1300, medianHouseholdIncome: 55000, zipCodes: ["19711", "19713", "19716"], isMetro: false },
  ],
  DC: [
    { name: "Washington", state: "DC", population: "690K", medianHomePrice: 640000, medianRent: 2200, medianHouseholdIncome: 90000, zipCodes: ["20001", "20002", "20003", "20004", "20005", "20006", "20007", "20008", "20009", "20010", "20011", "20012", "20015", "20016", "20017", "20018", "20019", "20020"], isMetro: true },
  ],
  FL: [
    { name: "Miami", state: "FL", population: "442K", medianHomePrice: 550000, medianRent: 2200, medianHouseholdIncome: 44000, zipCodes: ["33125", "33126", "33127", "33128", "33129", "33130", "33131", "33132", "33133", "33134", "33135", "33136", "33137", "33138", "33139", "33140", "33141", "33142", "33143", "33144", "33145", "33146"], isMetro: true },
    { name: "Tampa", state: "FL", population: "384K", medianHomePrice: 380000, medianRent: 1700, medianHouseholdIncome: 55000, zipCodes: ["33601", "33602", "33603", "33604", "33605", "33606", "33607", "33609", "33610", "33611", "33612", "33613", "33614", "33615", "33616", "33617", "33618", "33619", "33620", "33621", "33624", "33625", "33626", "33629"], isMetro: true },
    { name: "Orlando", state: "FL", population: "307K", medianHomePrice: 370000, medianRent: 1650, medianHouseholdIncome: 52000, zipCodes: ["32801", "32803", "32804", "32805", "32806", "32807", "32808", "32809", "32810", "32811", "32812", "32814", "32817", "32818", "32819", "32822", "32824", "32825", "32826", "32827", "32828", "32829", "32832", "32835", "32836", "32837", "32839"], isMetro: true },
    { name: "Jacksonville", state: "FL", population: "949K", medianHomePrice: 320000, medianRent: 1450, medianHouseholdIncome: 55000, zipCodes: ["32099", "32201", "32202", "32204", "32205", "32206", "32207", "32208", "32209", "32210", "32211", "32216", "32217", "32218", "32219", "32220", "32221", "32222", "32223", "32224", "32225", "32226", "32233", "32244", "32246", "32250", "32254", "32256", "32257", "32258"], isMetro: true },
    { name: "St. Petersburg", state: "FL", population: "258K", medianHomePrice: 360000, medianRent: 1600, medianHouseholdIncome: 52000, zipCodes: ["33701", "33702", "33703", "33704", "33705", "33707", "33709", "33710", "33711", "33712", "33713", "33714", "33715", "33716"], isMetro: true },
    { name: "Fort Lauderdale", state: "FL", population: "182K", medianHomePrice: 450000, medianRent: 2000, medianHouseholdIncome: 55000, zipCodes: ["33301", "33304", "33305", "33306", "33308", "33309", "33311", "33312", "33313", "33314", "33315", "33316", "33317", "33319", "33321", "33322", "33323", "33324", "33325", "33326", "33328", "33330", "33331", "33332", "33334"], isMetro: true },
    { name: "Naples", state: "FL", population: "22K", medianHomePrice: 580000, medianRent: 2100, medianHouseholdIncome: 75000, zipCodes: ["34102", "34103", "34104", "34105", "34108", "34109", "34110", "34112", "34113", "34116", "34117", "34119", "34120"], isMetro: false },
  ],
  GA: [
    { name: "Atlanta", state: "GA", population: "499K", medianHomePrice: 400000, medianRent: 1700, medianHouseholdIncome: 65000, zipCodes: ["30301", "30303", "30305", "30306", "30307", "30308", "30309", "30310", "30311", "30312", "30313", "30314", "30315", "30316", "30317", "30318", "30319", "30322", "30324", "30326", "30327", "30328", "30329", "30331", "30332", "30334", "30336", "30337", "30338", "30339", "30340", "30341", "30342", "30344", "30345", "30346", "30349", "30350"], isMetro: true },
    { name: "Savannah", state: "GA", population: "147K", medianHomePrice: 290000, medianRent: 1350, medianHouseholdIncome: 45000, zipCodes: ["31401", "31404", "31405", "31406", "31407", "31408", "31410", "31411", "31415", "31419"], isMetro: true },
    { name: "Augusta", state: "GA", population: "202K", medianHomePrice: 190000, medianRent: 1050, medianHouseholdIncome: 42000, zipCodes: ["30901", "30904", "30906", "30907", "30909"], isMetro: true },
    { name: "Columbus", state: "GA", population: "206K", medianHomePrice: 175000, medianRent: 1000, medianHouseholdIncome: 43000, zipCodes: ["31901", "31903", "31904", "31906", "31907", "31909"], isMetro: true },
    { name: "Athens", state: "GA", population: "127K", medianHomePrice: 280000, medianRent: 1200, medianHouseholdIncome: 40000, zipCodes: ["30601", "30605", "30606", "30607"], isMetro: false },
  ],
  HI: [
    { name: "Honolulu", state: "HI", population: "350K", medianHomePrice: 850000, medianRent: 2400, medianHouseholdIncome: 80000, zipCodes: ["96801", "96813", "96814", "96815", "96816", "96817", "96818", "96819", "96822", "96826"], isMetro: true },
    { name: "Hilo", state: "HI", population: "45K", medianHomePrice: 420000, medianRent: 1600, medianHouseholdIncome: 55000, zipCodes: ["96720", "96721"], isMetro: false },
    { name: "Kailua", state: "HI", population: "40K", medianHomePrice: 1050000, medianRent: 2800, medianHouseholdIncome: 95000, zipCodes: ["96734"], isMetro: false },
  ],
  ID: [
    { name: "Boise", state: "ID", population: "235K", medianHomePrice: 440000, medianRent: 1450, medianHouseholdIncome: 62000, zipCodes: ["83702", "83703", "83704", "83705", "83706", "83709", "83712", "83713", "83714", "83716"], isMetro: true },
    { name: "Meridian", state: "ID", population: "117K", medianHomePrice: 470000, medianRent: 1550, medianHouseholdIncome: 78000, zipCodes: ["83642", "83646"], isMetro: true },
    { name: "Nampa", state: "ID", population: "100K", medianHomePrice: 370000, medianRent: 1300, medianHouseholdIncome: 55000, zipCodes: ["83651", "83686", "83687"], isMetro: false },
  ],
  IL: [
    { name: "Chicago", state: "IL", population: "2.7M", medianHomePrice: 325000, medianRent: 1700, medianHouseholdIncome: 62000, zipCodes: ["60601", "60602", "60603", "60604", "60605", "60606", "60607", "60608", "60609", "60610", "60611", "60612", "60613", "60614", "60615", "60616", "60617", "60618", "60619", "60620", "60621", "60622", "60623", "60624", "60625", "60626", "60628", "60629", "60630", "60631", "60632", "60634", "60636", "60637", "60638", "60639", "60640", "60641", "60642", "60643", "60644", "60645", "60646", "60647", "60649", "60651", "60652", "60653", "60654", "60655", "60656", "60657", "60659", "60660", "60661"], isMetro: true },
    { name: "Aurora", state: "IL", population: "180K", medianHomePrice: 280000, medianRent: 1400, medianHouseholdIncome: 68000, zipCodes: ["60502", "60503", "60504", "60505", "60506", "60507"], isMetro: true },
    { name: "Naperville", state: "IL", population: "149K", medianHomePrice: 460000, medianRent: 1800, medianHouseholdIncome: 120000, zipCodes: ["60540", "60563", "60564", "60565"], isMetro: true },
    { name: "Springfield", state: "IL", population: "114K", medianHomePrice: 140000, medianRent: 900, medianHouseholdIncome: 52000, zipCodes: ["62701", "62702", "62703", "62704", "62707", "62711", "62712"], isMetro: false },
  ],
  IN: [
    { name: "Indianapolis", state: "IN", population: "887K", medianHomePrice: 240000, medianRent: 1150, medianHouseholdIncome: 50000, zipCodes: ["46201", "46202", "46203", "46204", "46205", "46208", "46214", "46217", "46218", "46219", "46220", "46221", "46222", "46224", "46225", "46226", "46227", "46228", "46229", "46231", "46234", "46235", "46236", "46237", "46239", "46240", "46241", "46250", "46254", "46256", "46259", "46260", "46268", "46278"], isMetro: true },
    { name: "Fort Wayne", state: "IN", population: "263K", medianHomePrice: 190000, medianRent: 950, medianHouseholdIncome: 48000, zipCodes: ["46801", "46802", "46803", "46804", "46805", "46806", "46807", "46808", "46809", "46815", "46816", "46818", "46819", "46825", "46835", "46845"], isMetro: true },
    { name: "Evansville", state: "IN", population: "117K", medianHomePrice: 155000, medianRent: 850, medianHouseholdIncome: 42000, zipCodes: ["47708", "47710", "47711", "47712", "47713", "47714", "47715"], isMetro: false },
  ],
  IA: [
    { name: "Des Moines", state: "IA", population: "214K", medianHomePrice: 215000, medianRent: 1050, medianHouseholdIncome: 52000, zipCodes: ["50301", "50309", "50310", "50311", "50312", "50313", "50314", "50315", "50316", "50317", "50320", "50321", "50322"], isMetro: true },
    { name: "Cedar Rapids", state: "IA", population: "137K", medianHomePrice: 195000, medianRent: 950, medianHouseholdIncome: 55000, zipCodes: ["52401", "52402", "52403", "52404", "52405"], isMetro: false },
    { name: "Davenport", state: "IA", population: "101K", medianHomePrice: 150000, medianRent: 850, medianHouseholdIncome: 44000, zipCodes: ["52801", "52802", "52803", "52804", "52806", "52807"], isMetro: false },
  ],
  KS: [
    { name: "Wichita", state: "KS", population: "397K", medianHomePrice: 195000, medianRent: 1000, medianHouseholdIncome: 52000, zipCodes: ["67201", "67202", "67203", "67204", "67205", "67206", "67207", "67208", "67209", "67210", "67211", "67212", "67213", "67214", "67216", "67217", "67218", "67219", "67220"], isMetro: true },
    { name: "Overland Park", state: "KS", population: "197K", medianHomePrice: 360000, medianRent: 1400, medianHouseholdIncome: 85000, zipCodes: ["66204", "66207", "66209", "66210", "66211", "66212", "66213", "66214", "66221", "66223"], isMetro: true },
    { name: "Kansas City", state: "KS", population: "156K", medianHomePrice: 165000, medianRent: 950, medianHouseholdIncome: 42000, zipCodes: ["66101", "66102", "66103", "66104", "66105", "66106", "66109", "66111", "66112"], isMetro: true },
  ],
  KY: [
    { name: "Louisville", state: "KY", population: "633K", medianHomePrice: 230000, medianRent: 1100, medianHouseholdIncome: 52000, zipCodes: ["40201", "40202", "40203", "40204", "40205", "40206", "40207", "40208", "40209", "40210", "40211", "40212", "40213", "40214", "40215", "40216", "40217", "40218", "40219", "40220", "40222", "40223", "40228", "40229", "40231", "40241", "40242", "40243", "40245", "40258", "40272", "40291", "40299"], isMetro: true },
    { name: "Lexington", state: "KY", population: "322K", medianHomePrice: 265000, medianRent: 1150, medianHouseholdIncome: 55000, zipCodes: ["40502", "40503", "40504", "40505", "40507", "40508", "40509", "40510", "40511", "40513", "40514", "40515", "40516", "40517"], isMetro: true },
    { name: "Bowling Green", state: "KY", population: "74K", medianHomePrice: 235000, medianRent: 1000, medianHouseholdIncome: 44000, zipCodes: ["42101", "42103", "42104"], isMetro: false },
  ],
  LA: [
    { name: "New Orleans", state: "LA", population: "383K", medianHomePrice: 275000, medianRent: 1250, medianHouseholdIncome: 45000, zipCodes: ["70112", "70113", "70114", "70115", "70116", "70117", "70118", "70119", "70122", "70124", "70125", "70126", "70127", "70128", "70129", "70130", "70131"], isMetro: true },
    { name: "Baton Rouge", state: "LA", population: "227K", medianHomePrice: 210000, medianRent: 1050, medianHouseholdIncome: 42000, zipCodes: ["70801", "70802", "70805", "70806", "70808", "70809", "70810", "70811", "70812", "70814", "70815", "70816", "70817", "70819", "70820"], isMetro: true },
    { name: "Shreveport", state: "LA", population: "187K", medianHomePrice: 155000, medianRent: 900, medianHouseholdIncome: 38000, zipCodes: ["71101", "71103", "71104", "71105", "71106", "71107", "71108", "71109", "71115", "71118", "71119"], isMetro: true },
  ],
  ME: [
    { name: "Portland", state: "ME", population: "68K", medianHomePrice: 430000, medianRent: 1700, medianHouseholdIncome: 65000, zipCodes: ["04101", "04102", "04103"], isMetro: false },
    { name: "Lewiston", state: "ME", population: "37K", medianHomePrice: 235000, medianRent: 1100, medianHouseholdIncome: 38000, zipCodes: ["04240", "04241"], isMetro: false },
    { name: "Bangor", state: "ME", population: "32K", medianHomePrice: 215000, medianRent: 1050, medianHouseholdIncome: 42000, zipCodes: ["04401", "04402"], isMetro: false },
  ],
  MD: [
    { name: "Baltimore", state: "MD", population: "585K", medianHomePrice: 215000, medianRent: 1300, medianHouseholdIncome: 52000, zipCodes: ["21201", "21202", "21204", "21205", "21206", "21207", "21208", "21209", "21210", "21211", "21212", "21213", "21214", "21215", "21216", "21217", "21218", "21222", "21223", "21224", "21225", "21226", "21227", "21228", "21229", "21230", "21231", "21234", "21236", "21237", "21239"], isMetro: true },
    { name: "Columbia", state: "MD", population: "104K", medianHomePrice: 420000, medianRent: 1800, medianHouseholdIncome: 100000, zipCodes: ["21044", "21045", "21046"], isMetro: true },
    { name: "Silver Spring", state: "MD", population: "81K", medianHomePrice: 450000, medianRent: 1750, medianHouseholdIncome: 78000, zipCodes: ["20901", "20902", "20903", "20904", "20905", "20906", "20910"], isMetro: true },
    { name: "Bethesda", state: "MD", population: "65K", medianHomePrice: 850000, medianRent: 2400, medianHouseholdIncome: 140000, zipCodes: ["20810", "20811", "20814", "20815", "20816", "20817"], isMetro: true },
  ],
  MA: [
    { name: "Boston", state: "MA", population: "675K", medianHomePrice: 750000, medianRent: 2800, medianHouseholdIncome: 76000, zipCodes: ["02101", "02102", "02108", "02109", "02110", "02111", "02113", "02114", "02115", "02116", "02118", "02119", "02120", "02121", "02122", "02124", "02125", "02126", "02127", "02128", "02129", "02130", "02131", "02132", "02134", "02135", "02136"], isMetro: true },
    { name: "Worcester", state: "MA", population: "206K", medianHomePrice: 360000, medianRent: 1500, medianHouseholdIncome: 50000, zipCodes: ["01601", "01602", "01603", "01604", "01605", "01606", "01607", "01608", "01609", "01610"], isMetro: true },
    { name: "Springfield", state: "MA", population: "155K", medianHomePrice: 240000, medianRent: 1200, medianHouseholdIncome: 40000, zipCodes: ["01101", "01103", "01104", "01105", "01107", "01108", "01109"], isMetro: true },
    { name: "Cambridge", state: "MA", population: "118K", medianHomePrice: 950000, medianRent: 3100, medianHouseholdIncome: 105000, zipCodes: ["02138", "02139", "02140", "02141", "02142"], isMetro: true },
  ],
  MI: [
    { name: "Detroit", state: "MI", population: "639K", medianHomePrice: 85000, medianRent: 1050, medianHouseholdIncome: 34000, zipCodes: ["48201", "48202", "48203", "48204", "48205", "48206", "48207", "48208", "48209", "48210", "48211", "48212", "48213", "48214", "48215", "48216", "48217", "48219", "48221", "48223", "48224", "48226", "48227", "48228", "48234", "48235", "48238", "48239"], isMetro: true },
    { name: "Grand Rapids", state: "MI", population: "198K", medianHomePrice: 270000, medianRent: 1200, medianHouseholdIncome: 50000, zipCodes: ["49503", "49504", "49505", "49506", "49507", "49508", "49509", "49512", "49525", "49534", "49544", "49546", "49548"], isMetro: true },
    { name: "Ann Arbor", state: "MI", population: "123K", medianHomePrice: 420000, medianRent: 1600, medianHouseholdIncome: 65000, zipCodes: ["48103", "48104", "48105", "48108", "48109"], isMetro: false },
  ],
  MN: [
    { name: "Minneapolis", state: "MN", population: "429K", medianHomePrice: 340000, medianRent: 1400, medianHouseholdIncome: 62000, zipCodes: ["55401", "55402", "55403", "55404", "55405", "55406", "55407", "55408", "55409", "55410", "55411", "55412", "55413", "55414", "55415", "55416", "55417", "55418", "55419", "55430", "55431", "55432", "55433", "55434", "55435", "55436", "55437", "55438", "55439", "55440", "55441", "55442", "55443", "55444", "55445", "55446", "55447"], isMetro: true },
    { name: "St. Paul", state: "MN", population: "311K", medianHomePrice: 290000, medianRent: 1250, medianHouseholdIncome: 56000, zipCodes: ["55101", "55102", "55103", "55104", "55105", "55106", "55107", "55108", "55109", "55110", "55112", "55113", "55114", "55116", "55117", "55118", "55119", "55120", "55122", "55123", "55124", "55125", "55126", "55127", "55128", "55129", "55130", "55133"], isMetro: true },
    { name: "Rochester", state: "MN", population: "121K", medianHomePrice: 290000, medianRent: 1200, medianHouseholdIncome: 72000, zipCodes: ["55901", "55902", "55904", "55906"], isMetro: false },
  ],
  MS: [
    { name: "Jackson", state: "MS", population: "153K", medianHomePrice: 130000, medianRent: 900, medianHouseholdIncome: 38000, zipCodes: ["39201", "39202", "39203", "39204", "39206", "39209", "39211", "39212", "39213", "39216", "39217"], isMetro: true },
    { name: "Gulfport", state: "MS", population: "72K", medianHomePrice: 175000, medianRent: 1050, medianHouseholdIncome: 42000, zipCodes: ["39501", "39503", "39507"], isMetro: false },
    { name: "Hattiesburg", state: "MS", population: "48K", medianHomePrice: 155000, medianRent: 900, medianHouseholdIncome: 36000, zipCodes: ["39401", "39402"], isMetro: false },
  ],
  MO: [
    { name: "Kansas City", state: "MO", population: "508K", medianHomePrice: 240000, medianRent: 1150, medianHouseholdIncome: 55000, zipCodes: ["64101", "64102", "64105", "64106", "64108", "64109", "64110", "64111", "64112", "64113", "64114", "64116", "64117", "64118", "64119", "64120", "64123", "64124", "64125", "64126", "64127", "64128", "64129", "64130", "64131", "64132", "64133", "64134", "64136", "64137", "64138", "64139", "64145", "64146", "64147", "64149", "64151", "64152", "64153", "64154", "64155", "64156", "64157", "64158"], isMetro: true },
    { name: "St. Louis", state: "MO", population: "293K", medianHomePrice: 195000, medianRent: 1050, medianHouseholdIncome: 45000, zipCodes: ["63101", "63102", "63103", "63104", "63106", "63107", "63108", "63109", "63110", "63111", "63112", "63113", "63115", "63116", "63118", "63119", "63120", "63130", "63133", "63136", "63137", "63138", "63139", "63143", "63147"], isMetro: true },
    { name: "Springfield", state: "MO", population: "169K", medianHomePrice: 195000, medianRent: 950, medianHouseholdIncome: 38000, zipCodes: ["65801", "65802", "65803", "65804", "65806", "65807", "65809", "65810"], isMetro: false },
  ],
  MT: [
    { name: "Billings", state: "MT", population: "117K", medianHomePrice: 330000, medianRent: 1200, medianHouseholdIncome: 58000, zipCodes: ["59101", "59102", "59105", "59106"], isMetro: false },
    { name: "Missoula", state: "MT", population: "74K", medianHomePrice: 470000, medianRent: 1400, medianHouseholdIncome: 52000, zipCodes: ["59801", "59802", "59803", "59804", "59808"], isMetro: false },
    { name: "Great Falls", state: "MT", population: "60K", medianHomePrice: 250000, medianRent: 1000, medianHouseholdIncome: 48000, zipCodes: ["59401", "59404", "59405"], isMetro: false },
  ],
  NE: [
    { name: "Omaha", state: "NE", population: "486K", medianHomePrice: 245000, medianRent: 1100, medianHouseholdIncome: 58000, zipCodes: ["68102", "68104", "68105", "68106", "68107", "68108", "68110", "68111", "68112", "68114", "68116", "68117", "68118", "68122", "68124", "68127", "68130", "68131", "68132", "68134", "68135", "68137", "68142", "68144", "68154", "68157", "68164"], isMetro: true },
    { name: "Lincoln", state: "NE", population: "291K", medianHomePrice: 240000, medianRent: 1050, medianHouseholdIncome: 56000, zipCodes: ["68502", "68503", "68504", "68505", "68506", "68507", "68508", "68510", "68512", "68516", "68520", "68521", "68522", "68523", "68524", "68526", "68528"], isMetro: true },
    { name: "Bellevue", state: "NE", population: "64K", medianHomePrice: 260000, medianRent: 1150, medianHouseholdIncome: 65000, zipCodes: ["68005", "68123", "68147"], isMetro: false },
  ],
  NV: [
    { name: "Las Vegas", state: "NV", population: "641K", medianHomePrice: 400000, medianRent: 1500, medianHouseholdIncome: 55000, zipCodes: ["89101", "89102", "89103", "89104", "89106", "89107", "89108", "89109", "89110", "89113", "89115", "89117", "89118", "89119", "89120", "89121", "89122", "89123", "89128", "89129", "89130", "89131", "89134", "89135", "89138", "89139", "89141", "89142", "89143", "89144", "89145", "89146", "89147", "89148", "89149", "89156", "89166", "89178", "89179", "89183"], isMetro: true },
    { name: "Henderson", state: "NV", population: "320K", medianHomePrice: 440000, medianRent: 1650, medianHouseholdIncome: 72000, zipCodes: ["89002", "89011", "89012", "89014", "89015", "89044", "89052", "89074"], isMetro: true },
    { name: "Reno", state: "NV", population: "264K", medianHomePrice: 490000, medianRent: 1600, medianHouseholdIncome: 60000, zipCodes: ["89501", "89502", "89503", "89509", "89511", "89512", "89519", "89521", "89523"], isMetro: true },
  ],
  NH: [
    { name: "Manchester", state: "NH", population: "115K", medianHomePrice: 370000, medianRent: 1500, medianHouseholdIncome: 62000, zipCodes: ["03101", "03102", "03103", "03104", "03105", "03109"], isMetro: false },
    { name: "Nashua", state: "NH", population: "91K", medianHomePrice: 400000, medianRent: 1600, medianHouseholdIncome: 72000, zipCodes: ["03060", "03062", "03063", "03064"], isMetro: false },
    { name: "Concord", state: "NH", population: "44K", medianHomePrice: 340000, medianRent: 1350, medianHouseholdIncome: 60000, zipCodes: ["03301", "03303"], isMetro: false },
  ],
  NJ: [
    { name: "Newark", state: "NJ", population: "311K", medianHomePrice: 380000, medianRent: 1500, medianHouseholdIncome: 38000, zipCodes: ["07102", "07103", "07104", "07105", "07106", "07107", "07108", "07112", "07114"], isMetro: true },
    { name: "Jersey City", state: "NJ", population: "292K", medianHomePrice: 550000, medianRent: 2400, medianHouseholdIncome: 75000, zipCodes: ["07302", "07304", "07305", "07306", "07307", "07310"], isMetro: true },
    { name: "Trenton", state: "NJ", population: "90K", medianHomePrice: 180000, medianRent: 1200, medianHouseholdIncome: 38000, zipCodes: ["08608", "08609", "08610", "08611", "08618", "08619", "08620", "08628", "08629", "08638"], isMetro: true },
    { name: "Princeton", state: "NJ", population: "31K", medianHomePrice: 850000, medianRent: 2500, medianHouseholdIncome: 120000, zipCodes: ["08540", "08542", "08544"], isMetro: false },
  ],
  NM: [
    { name: "Albuquerque", state: "NM", population: "564K", medianHomePrice: 310000, medianRent: 1200, medianHouseholdIncome: 52000, zipCodes: ["87101", "87102", "87104", "87105", "87106", "87107", "87108", "87109", "87110", "87111", "87112", "87113", "87114", "87116", "87120", "87121", "87122", "87123"], isMetro: true },
    { name: "Santa Fe", state: "NM", population: "88K", medianHomePrice: 510000, medianRent: 1500, medianHouseholdIncome: 60000, zipCodes: ["87501", "87505", "87506", "87507", "87508"], isMetro: false },
    { name: "Las Cruces", state: "NM", population: "111K", medianHomePrice: 260000, medianRent: 1050, medianHouseholdIncome: 42000, zipCodes: ["88001", "88005", "88007", "88011", "88012"], isMetro: false },
  ],
  NY: [
    { name: "New York City", state: "NY", population: "8.3M", medianHomePrice: 750000, medianRent: 3000, medianHouseholdIncome: 70000, zipCodes: ["10001", "10002", "10003", "10004", "10005", "10006", "10007", "10009", "10010", "10011", "10012", "10013", "10014", "10016", "10017", "10018", "10019", "10020", "10021", "10022", "10023", "10024", "10025", "10026", "10027", "10028", "10029", "10030", "10031", "10032", "10033", "10034", "10035", "10036", "10037", "10038", "10039", "10040"], isMetro: true },
    { name: "Buffalo", state: "NY", population: "278K", medianHomePrice: 185000, medianRent: 1050, medianHouseholdIncome: 40000, zipCodes: ["14201", "14202", "14203", "14204", "14206", "14207", "14208", "14209", "14210", "14211", "14212", "14213", "14214", "14215", "14216", "14217", "14218", "14219", "14220", "14222", "14223", "14224", "14225", "14226", "14227", "14228"], isMetro: true },
    { name: "Rochester", state: "NY", population: "211K", medianHomePrice: 165000, medianRent: 1000, medianHouseholdIncome: 38000, zipCodes: ["14604", "14605", "14606", "14607", "14608", "14609", "14610", "14611", "14612", "14613", "14614", "14615", "14616", "14617", "14618", "14619", "14620", "14621"], isMetro: true },
    { name: "Syracuse", state: "NY", population: "148K", medianHomePrice: 145000, medianRent: 950, medianHouseholdIncome: 36000, zipCodes: ["13201", "13202", "13203", "13204", "13205", "13206", "13207", "13208", "13209", "13210", "13211", "13212", "13214", "13215", "13219", "13224"], isMetro: true },
    { name: "Albany", state: "NY", population: "99K", medianHomePrice: 210000, medianRent: 1150, medianHouseholdIncome: 45000, zipCodes: ["12201", "12202", "12203", "12204", "12205", "12206", "12207", "12208", "12209", "12210", "12211"], isMetro: false },
  ],
  NC: [
    { name: "Charlotte", state: "NC", population: "874K", medianHomePrice: 370000, medianRent: 1550, medianHouseholdIncome: 63000, zipCodes: ["28201", "28202", "28203", "28204", "28205", "28206", "28207", "28208", "28209", "28210", "28211", "28212", "28213", "28214", "28215", "28216", "28217", "28226", "28227", "28244", "28262", "28269", "28270", "28273", "28277", "28278", "28280", "28282"], isMetro: true },
    { name: "Raleigh", state: "NC", population: "474K", medianHomePrice: 400000, medianRent: 1600, medianHouseholdIncome: 67000, zipCodes: ["27601", "27603", "27604", "27605", "27606", "27607", "27608", "27609", "27610", "27612", "27613", "27614", "27615", "27616", "27617"], isMetro: true },
    { name: "Durham", state: "NC", population: "283K", medianHomePrice: 360000, medianRent: 1450, medianHouseholdIncome: 57000, zipCodes: ["27701", "27703", "27704", "27705", "27707", "27709", "27712", "27713"], isMetro: true },
    { name: "Greensboro", state: "NC", population: "299K", medianHomePrice: 250000, medianRent: 1150, medianHouseholdIncome: 46000, zipCodes: ["27401", "27403", "27405", "27406", "27407", "27408", "27409", "27410", "27455"], isMetro: true },
    { name: "Asheville", state: "NC", population: "94K", medianHomePrice: 410000, medianRent: 1500, medianHouseholdIncome: 50000, zipCodes: ["28801", "28803", "28804", "28805", "28806"], isMetro: false },
  ],
  ND: [
    { name: "Fargo", state: "ND", population: "125K", medianHomePrice: 270000, medianRent: 1050, medianHouseholdIncome: 54000, zipCodes: ["58102", "58103", "58104"], isMetro: false },
    { name: "Bismarck", state: "ND", population: "74K", medianHomePrice: 280000, medianRent: 1050, medianHouseholdIncome: 60000, zipCodes: ["58501", "58503", "58504"], isMetro: false },
    { name: "Grand Forks", state: "ND", population: "56K", medianHomePrice: 235000, medianRent: 950, medianHouseholdIncome: 48000, zipCodes: ["58201", "58202", "58203"], isMetro: false },
  ],
  OH: [
    { name: "Columbus", state: "OH", population: "905K", medianHomePrice: 265000, medianRent: 1200, medianHouseholdIncome: 54000, zipCodes: ["43201", "43202", "43203", "43204", "43205", "43206", "43207", "43209", "43210", "43211", "43212", "43213", "43214", "43215", "43219", "43220", "43221", "43222", "43223", "43224", "43227", "43228", "43229", "43230", "43231", "43232", "43235"], isMetro: true },
    { name: "Cleveland", state: "OH", population: "372K", medianHomePrice: 120000, medianRent: 950, medianHouseholdIncome: 32000, zipCodes: ["44101", "44102", "44103", "44104", "44105", "44106", "44107", "44108", "44109", "44110", "44111", "44112", "44113", "44114", "44115", "44119", "44120", "44121", "44127", "44128", "44134", "44135", "44144"], isMetro: true },
    { name: "Cincinnati", state: "OH", population: "309K", medianHomePrice: 220000, medianRent: 1100, medianHouseholdIncome: 42000, zipCodes: ["45201", "45202", "45203", "45204", "45205", "45206", "45207", "45208", "45209", "45211", "45212", "45213", "45214", "45215", "45216", "45217", "45219", "45220", "45223", "45224", "45225", "45226", "45227", "45229", "45230", "45231", "45232", "45233", "45236", "45237", "45238", "45239", "45240", "45241", "45242", "45243", "45244", "45245", "45246", "45247", "45248", "45249", "45251", "45252"], isMetro: true },
    { name: "Toledo", state: "OH", population: "270K", medianHomePrice: 120000, medianRent: 850, medianHouseholdIncome: 38000, zipCodes: ["43601", "43604", "43605", "43606", "43607", "43608", "43609", "43610", "43611", "43612", "43613", "43614", "43615", "43617", "43620", "43623"], isMetro: true },
  ],
  OK: [
    { name: "Oklahoma City", state: "OK", population: "681K", medianHomePrice: 210000, medianRent: 1050, medianHouseholdIncome: 52000, zipCodes: ["73102", "73103", "73104", "73105", "73106", "73107", "73108", "73109", "73110", "73111", "73112", "73114", "73115", "73116", "73117", "73118", "73119", "73120", "73121", "73122", "73127", "73128", "73129", "73130", "73131", "73132", "73134", "73135", "73139", "73141", "73142", "73145", "73149", "73150", "73159", "73160", "73162", "73165", "73170", "73173"], isMetro: true },
    { name: "Tulsa", state: "OK", population: "413K", medianHomePrice: 195000, medianRent: 1000, medianHouseholdIncome: 46000, zipCodes: ["74101", "74103", "74104", "74105", "74106", "74107", "74108", "74110", "74112", "74114", "74115", "74116", "74117", "74119", "74120", "74126", "74127", "74128", "74129", "74130", "74131", "74132", "74133", "74134", "74135", "74136", "74137", "74145", "74146"], isMetro: true },
    { name: "Norman", state: "OK", population: "128K", medianHomePrice: 235000, medianRent: 1050, medianHouseholdIncome: 55000, zipCodes: ["73019", "73026", "73069", "73071", "73072"], isMetro: false },
  ],
  OR: [
    { name: "Portland", state: "OR", population: "652K", medianHomePrice: 500000, medianRent: 1650, medianHouseholdIncome: 71000, zipCodes: ["97201", "97202", "97203", "97204", "97205", "97206", "97209", "97210", "97211", "97212", "97213", "97214", "97215", "97216", "97217", "97218", "97219", "97220", "97221", "97222", "97223", "97225", "97227", "97229", "97230", "97231", "97232", "97233", "97236", "97239", "97266"], isMetro: true },
    { name: "Salem", state: "OR", population: "175K", medianHomePrice: 380000, medianRent: 1350, medianHouseholdIncome: 55000, zipCodes: ["97301", "97302", "97303", "97304", "97305", "97306", "97317"], isMetro: true },
    { name: "Eugene", state: "OR", population: "176K", medianHomePrice: 400000, medianRent: 1400, medianHouseholdIncome: 48000, zipCodes: ["97401", "97402", "97403", "97404", "97405"], isMetro: false },
    { name: "Bend", state: "OR", population: "102K", medianHomePrice: 620000, medianRent: 1800, medianHouseholdIncome: 70000, zipCodes: ["97701", "97702", "97703"], isMetro: false },
  ],
  PA: [
    { name: "Philadelphia", state: "PA", population: "1.6M", medianHomePrice: 250000, medianRent: 1400, medianHouseholdIncome: 49000, zipCodes: ["19102", "19103", "19104", "19106", "19107", "19109", "19111", "19114", "19115", "19116", "19118", "19119", "19120", "19121", "19122", "19123", "19124", "19125", "19126", "19127", "19128", "19129", "19130", "19131", "19132", "19133", "19134", "19135", "19136", "19137", "19138", "19139", "19140", "19141", "19142", "19143", "19144", "19145", "19146", "19147", "19148", "19149", "19150", "19151", "19152", "19153", "19154"], isMetro: true },
    { name: "Pittsburgh", state: "PA", population: "303K", medianHomePrice: 220000, medianRent: 1200, medianHouseholdIncome: 48000, zipCodes: ["15201", "15203", "15204", "15205", "15206", "15207", "15208", "15209", "15210", "15211", "15212", "15213", "15214", "15215", "15216", "15217", "15218", "15219", "15220", "15221", "15222", "15224", "15226", "15227", "15228", "15232", "15233", "15234", "15235", "15236", "15237", "15238", "15239", "15241", "15243"], isMetro: true },
    { name: "Allentown", state: "PA", population: "126K", medianHomePrice: 205000, medianRent: 1100, medianHouseholdIncome: 42000, zipCodes: ["18101", "18102", "18103", "18104", "18106", "18109"], isMetro: false },
  ],
  RI: [
    { name: "Providence", state: "RI", population: "190K", medianHomePrice: 350000, medianRent: 1400, medianHouseholdIncome: 46000, zipCodes: ["02901", "02902", "02903", "02904", "02905", "02906", "02907", "02908", "02909", "02910", "02911", "02912"], isMetro: true },
    { name: "Cranston", state: "RI", population: "82K", medianHomePrice: 330000, medianRent: 1350, medianHouseholdIncome: 62000, zipCodes: ["02905", "02910", "02920", "02921"], isMetro: false },
    { name: "Warwick", state: "RI", population: "82K", medianHomePrice: 330000, medianRent: 1350, medianHouseholdIncome: 62000, zipCodes: ["02886", "02888", "02889", "02893"], isMetro: false },
  ],
  SC: [
    { name: "Charleston", state: "SC", population: "150K", medianHomePrice: 430000, medianRent: 1650, medianHouseholdIncome: 65000, zipCodes: ["29401", "29403", "29405", "29407", "29412", "29414", "29418", "29464", "29466", "29492"], isMetro: true },
    { name: "Columbia", state: "SC", population: "137K", medianHomePrice: 210000, medianRent: 1100, medianHouseholdIncome: 44000, zipCodes: ["29201", "29203", "29204", "29205", "29206", "29209", "29210", "29212", "29223", "29229"], isMetro: true },
    { name: "Greenville", state: "SC", population: "72K", medianHomePrice: 280000, medianRent: 1250, medianHouseholdIncome: 48000, zipCodes: ["29601", "29605", "29607", "29609", "29611", "29615", "29617"], isMetro: false },
    { name: "Myrtle Beach", state: "SC", population: "35K", medianHomePrice: 270000, medianRent: 1300, medianHouseholdIncome: 40000, zipCodes: ["29572", "29575", "29577", "29579", "29588"], isMetro: false },
  ],
  SD: [
    { name: "Sioux Falls", state: "SD", population: "192K", medianHomePrice: 285000, medianRent: 1100, medianHouseholdIncome: 60000, zipCodes: ["57103", "57104", "57105", "57106", "57107", "57108", "57110"], isMetro: false },
    { name: "Rapid City", state: "SD", population: "74K", medianHomePrice: 310000, medianRent: 1100, medianHouseholdIncome: 52000, zipCodes: ["57701", "57702", "57703"], isMetro: false },
    { name: "Aberdeen", state: "SD", population: "28K", medianHomePrice: 210000, medianRent: 850, medianHouseholdIncome: 50000, zipCodes: ["57401"], isMetro: false },
  ],
  TN: [
    { name: "Nashville", state: "TN", population: "689K", medianHomePrice: 420000, medianRent: 1650, medianHouseholdIncome: 59000, zipCodes: ["37201", "37203", "37204", "37205", "37206", "37207", "37208", "37209", "37210", "37211", "37212", "37213", "37214", "37215", "37216", "37217", "37218", "37219", "37220", "37221", "37228", "37232"], isMetro: true },
    { name: "Memphis", state: "TN", population: "633K", medianHomePrice: 175000, medianRent: 1050, medianHouseholdIncome: 40000, zipCodes: ["38101", "38103", "38104", "38105", "38106", "38107", "38108", "38109", "38111", "38112", "38114", "38115", "38116", "38117", "38118", "38119", "38120", "38122", "38125", "38126", "38127", "38128", "38131", "38132", "38133", "38134", "38135", "38138", "38139", "38141"], isMetro: true },
    { name: "Knoxville", state: "TN", population: "190K", medianHomePrice: 280000, medianRent: 1200, medianHouseholdIncome: 42000, zipCodes: ["37901", "37902", "37909", "37912", "37914", "37915", "37916", "37917", "37918", "37919", "37920", "37921", "37922", "37923", "37924", "37931", "37932", "37934"], isMetro: true },
    { name: "Chattanooga", state: "TN", population: "182K", medianHomePrice: 285000, medianRent: 1200, medianHouseholdIncome: 46000, zipCodes: ["37402", "37403", "37404", "37405", "37406", "37407", "37408", "37409", "37410", "37411", "37412", "37415", "37416", "37421"], isMetro: true },
  ],
  TX: [
    { name: "Houston", state: "TX", population: "2.3M", medianHomePrice: 320000, medianRent: 1400, medianHouseholdIncome: 55000, zipCodes: ["77001", "77002", "77003", "77004", "77005", "77006", "77007", "77008", "77009", "77010", "77011", "77012", "77013", "77014", "77015", "77016", "77017", "77018", "77019", "77020", "77021", "77022", "77023", "77024", "77025", "77026", "77027", "77028", "77029", "77030", "77031", "77033", "77034", "77035", "77036", "77037", "77038", "77039", "77040", "77041", "77042", "77043", "77044", "77045", "77047", "77048", "77049", "77050", "77051", "77053", "77054", "77055", "77056", "77057", "77058", "77059", "77060", "77061", "77062", "77063", "77064", "77065", "77066", "77067", "77068", "77069", "77070", "77071", "77072", "77073", "77074", "77075", "77076", "77077", "77078", "77079", "77080", "77081", "77082", "77083", "77084", "77085", "77086", "77087", "77088", "77089", "77090", "77091", "77092", "77093", "77094", "77095", "77096", "77098", "77099"], isMetro: true },
    { name: "Dallas", state: "TX", population: "1.3M", medianHomePrice: 350000, medianRent: 1500, medianHouseholdIncome: 55000, zipCodes: ["75201", "75202", "75203", "75204", "75205", "75206", "75207", "75208", "75209", "75210", "75211", "75212", "75214", "75215", "75216", "75217", "75218", "75219", "75220", "75223", "75224", "75225", "75226", "75227", "75228", "75229", "75230", "75231", "75232", "75233", "75234", "75235", "75236", "75237", "75238", "75240", "75241", "75243", "75244", "75246", "75247", "75248", "75249", "75251", "75252", "75253", "75254"], isMetro: true },
    { name: "Austin", state: "TX", population: "978K", medianHomePrice: 480000, medianRent: 1700, medianHouseholdIncome: 73000, zipCodes: ["78701", "78702", "78703", "78704", "78705", "78717", "78719", "78721", "78722", "78723", "78724", "78725", "78726", "78727", "78728", "78729", "78730", "78731", "78732", "78733", "78734", "78735", "78736", "78737", "78738", "78739", "78741", "78742", "78744", "78745", "78746", "78747", "78748", "78749", "78750", "78751", "78752", "78753", "78754", "78756", "78757", "78758", "78759"], isMetro: true },
    { name: "San Antonio", state: "TX", population: "1.5M", medianHomePrice: 280000, medianRent: 1300, medianHouseholdIncome: 52000, zipCodes: ["78201", "78202", "78203", "78204", "78205", "78207", "78208", "78209", "78210", "78211", "78212", "78213", "78214", "78215", "78216", "78217", "78218", "78219", "78220", "78221", "78222", "78223", "78224", "78225", "78226", "78227", "78228", "78229", "78230", "78231", "78232", "78233", "78234", "78235", "78236", "78237", "78238", "78239", "78240", "78242", "78243", "78244", "78245", "78247", "78248", "78249", "78250", "78251", "78252", "78253", "78254", "78255", "78256", "78257", "78258", "78259", "78260", "78261", "78263", "78264", "78266"], isMetro: true },
    { name: "Fort Worth", state: "TX", population: "935K", medianHomePrice: 310000, medianRent: 1400, medianHouseholdIncome: 60000, zipCodes: ["76101", "76102", "76103", "76104", "76105", "76106", "76107", "76109", "76110", "76111", "76112", "76114", "76115", "76116", "76117", "76118", "76119", "76120", "76123", "76126", "76127", "76129", "76131", "76132", "76133", "76134", "76135", "76137", "76140", "76148", "76155", "76164", "76177", "76179"], isMetro: true },
    { name: "El Paso", state: "TX", population: "678K", medianHomePrice: 220000, medianRent: 1050, medianHouseholdIncome: 48000, zipCodes: ["79901", "79902", "79903", "79904", "79905", "79906", "79907", "79908", "79911", "79912", "79915", "79922", "79924", "79925", "79927", "79928", "79930", "79932", "79934", "79935", "79936", "79938"], isMetro: true },
  ],
  UT: [
    { name: "Salt Lake City", state: "UT", population: "200K", medianHomePrice: 520000, medianRent: 1550, medianHouseholdIncome: 60000, zipCodes: ["84101", "84102", "84103", "84104", "84105", "84106", "84108", "84109", "84111", "84112", "84113", "84115", "84116", "84119", "84120", "84121", "84123", "84124", "84128", "84129"], isMetro: true },
    { name: "Provo", state: "UT", population: "115K", medianHomePrice: 440000, medianRent: 1350, medianHouseholdIncome: 52000, zipCodes: ["84601", "84602", "84604", "84606"], isMetro: false },
    { name: "Ogden", state: "UT", population: "87K", medianHomePrice: 340000, medianRent: 1200, medianHouseholdIncome: 48000, zipCodes: ["84401", "84403", "84404", "84405"], isMetro: false },
    { name: "St. George", state: "UT", population: "95K", medianHomePrice: 480000, medianRent: 1500, medianHouseholdIncome: 58000, zipCodes: ["84770", "84790"], isMetro: false },
  ],
  VT: [
    { name: "Burlington", state: "VT", population: "45K", medianHomePrice: 420000, medianRent: 1600, medianHouseholdIncome: 55000, zipCodes: ["05401", "05408"], isMetro: false },
    { name: "South Burlington", state: "VT", population: "20K", medianHomePrice: 440000, medianRent: 1650, medianHouseholdIncome: 72000, zipCodes: ["05403"], isMetro: false },
    { name: "Rutland", state: "VT", population: "16K", medianHomePrice: 210000, medianRent: 1050, medianHouseholdIncome: 42000, zipCodes: ["05701"], isMetro: false },
  ],
  VA: [
    { name: "Virginia Beach", state: "VA", population: "459K", medianHomePrice: 340000, medianRent: 1450, medianHouseholdIncome: 72000, zipCodes: ["23451", "23452", "23453", "23454", "23455", "23456", "23457", "23459", "23460", "23461", "23462", "23464"], isMetro: true },
    { name: "Richmond", state: "VA", population: "226K", medianHomePrice: 310000, medianRent: 1350, medianHouseholdIncome: 48000, zipCodes: ["23219", "23220", "23221", "23222", "23223", "23224", "23225", "23226", "23227", "23228", "23229", "23230", "23231", "23233", "23234", "23235", "23236", "23237", "23238"], isMetro: true },
    { name: "Arlington", state: "VA", population: "238K", medianHomePrice: 680000, medianRent: 2200, medianHouseholdIncome: 120000, zipCodes: ["22201", "22202", "22203", "22204", "22205", "22206", "22207", "22209", "22213"], isMetro: true },
    { name: "Norfolk", state: "VA", population: "238K", medianHomePrice: 250000, medianRent: 1200, medianHouseholdIncome: 48000, zipCodes: ["23501", "23502", "23503", "23504", "23505", "23507", "23508", "23509", "23510", "23511", "23513", "23517", "23518", "23523"], isMetro: true },
    { name: "Alexandria", state: "VA", population: "160K", medianHomePrice: 600000, medianRent: 2100, medianHouseholdIncome: 100000, zipCodes: ["22301", "22302", "22304", "22305", "22306", "22307", "22308", "22309", "22310", "22311", "22312", "22314", "22315"], isMetro: true },
  ],
  WA: [
    { name: "Seattle", state: "WA", population: "737K", medianHomePrice: 820000, medianRent: 2200, medianHouseholdIncome: 97000, zipCodes: ["98101", "98102", "98103", "98104", "98105", "98106", "98107", "98108", "98109", "98112", "98115", "98116", "98117", "98118", "98119", "98121", "98122", "98125", "98126", "98133", "98134", "98136", "98144", "98146", "98154", "98155", "98164", "98168", "98174", "98177", "98178", "98188", "98195", "98199"], isMetro: true },
    { name: "Spokane", state: "WA", population: "228K", medianHomePrice: 340000, medianRent: 1250, medianHouseholdIncome: 48000, zipCodes: ["99201", "99202", "99203", "99204", "99205", "99207", "99208", "99212", "99217", "99218", "99223", "99224"], isMetro: true },
    { name: "Tacoma", state: "WA", population: "219K", medianHomePrice: 440000, medianRent: 1550, medianHouseholdIncome: 58000, zipCodes: ["98402", "98403", "98404", "98405", "98406", "98407", "98408", "98409", "98418", "98421", "98422", "98424", "98443", "98444", "98445", "98465", "98466", "98467"], isMetro: true },
    { name: "Bellevue", state: "WA", population: "151K", medianHomePrice: 1200000, medianRent: 2800, medianHouseholdIncome: 130000, zipCodes: ["98004", "98005", "98006", "98007", "98008"], isMetro: true },
    { name: "Vancouver", state: "WA", population: "190K", medianHomePrice: 430000, medianRent: 1500, medianHouseholdIncome: 60000, zipCodes: ["98660", "98661", "98662", "98663", "98664", "98665", "98682", "98683", "98684", "98685"], isMetro: true },
  ],
  WV: [
    { name: "Charleston", state: "WV", population: "48K", medianHomePrice: 135000, medianRent: 850, medianHouseholdIncome: 42000, zipCodes: ["25301", "25302", "25303", "25304", "25311", "25312", "25314", "25315"], isMetro: false },
    { name: "Huntington", state: "WV", population: "46K", medianHomePrice: 105000, medianRent: 750, medianHouseholdIncome: 32000, zipCodes: ["25701", "25702", "25703", "25704", "25705"], isMetro: false },
    { name: "Morgantown", state: "WV", population: "31K", medianHomePrice: 240000, medianRent: 1050, medianHouseholdIncome: 42000, zipCodes: ["26501", "26505", "26508"], isMetro: false },
  ],
  WI: [
    { name: "Milwaukee", state: "WI", population: "577K", medianHomePrice: 185000, medianRent: 1100, medianHouseholdIncome: 42000, zipCodes: ["53201", "53202", "53203", "53204", "53205", "53206", "53207", "53208", "53209", "53210", "53211", "53212", "53213", "53214", "53215", "53216", "53217", "53218", "53219", "53220", "53221", "53222", "53223", "53224", "53225", "53226", "53227", "53228", "53233", "53234", "53235"], isMetro: true },
    { name: "Madison", state: "WI", population: "269K", medianHomePrice: 370000, medianRent: 1400, medianHouseholdIncome: 67000, zipCodes: ["53701", "53703", "53704", "53705", "53706", "53711", "53713", "53714", "53715", "53716", "53717", "53718", "53719"], isMetro: true },
    { name: "Green Bay", state: "WI", population: "107K", medianHomePrice: 210000, medianRent: 950, medianHouseholdIncome: 48000, zipCodes: ["54301", "54302", "54303", "54304", "54311", "54313"], isMetro: false },
  ],
  WY: [
    { name: "Cheyenne", state: "WY", population: "65K", medianHomePrice: 310000, medianRent: 1150, medianHouseholdIncome: 60000, zipCodes: ["82001", "82007", "82009"], isMetro: false },
    { name: "Casper", state: "WY", population: "58K", medianHomePrice: 270000, medianRent: 1050, medianHouseholdIncome: 58000, zipCodes: ["82601", "82604", "82609"], isMetro: false },
    { name: "Laramie", state: "WY", population: "32K", medianHomePrice: 290000, medianRent: 1000, medianHouseholdIncome: 45000, zipCodes: ["82070", "82071", "82072"], isMetro: false },
    { name: "Jackson", state: "WY", population: "11K", medianHomePrice: 1200000, medianRent: 2500, medianHouseholdIncome: 78000, zipCodes: ["83001", "83002"], isMetro: false },
  ],
};

// Utility functions

/** Get all cities for a given state abbreviation */
export function getCitiesByState(stateAbbr: string): CityData[] {
  return citiesByState[stateAbbr] ?? [];
}

/** Get city names for a given state abbreviation */
export function getCityNames(stateAbbr: string): string[] {
  return getCitiesByState(stateAbbr).map(c => c.name);
}

/** Find a city by name (searches all states) */
export function findCityByName(cityName: string): CityData | null {
  const lower = cityName.toLowerCase();
  for (const cities of Object.values(citiesByState)) {
    const found = cities.find(c => c.name.toLowerCase() === lower);
    if (found) return found;
  }
  return null;
}

/** Find a city by name within a specific state */
export function findCityInState(cityName: string, stateAbbr: string): CityData | null {
  const cities = citiesByState[stateAbbr];
  if (!cities) return null;
  const lower = cityName.toLowerCase();
  return cities.find(c => c.name.toLowerCase() === lower) ?? null;
}

/** Find cities matching a ZIP code */
export function findCityByZip(zip: string): CityData | null {
  for (const cities of Object.values(citiesByState)) {
    const found = cities.find(c => c.zipCodes.includes(zip));
    if (found) return found;
  }
  return null;
}

/** Get all metro cities across all states */
export function getMetroCities(): CityData[] {
  return Object.values(citiesByState).flat().filter(c => c.isMetro);
}

/** Search cities by partial name match */
export function searchCities(query: string, limit = 10): CityData[] {
  const lower = query.toLowerCase();
  const results: CityData[] = [];
  for (const cities of Object.values(citiesByState)) {
    for (const city of cities) {
      if (city.name.toLowerCase().includes(lower)) {
        results.push(city);
        if (results.length >= limit) return results;
      }
    }
  }
  return results;
}

/** Get all unique city names (flattened, sorted) */
export function getAllCityNames(): string[] {
  return Object.values(citiesByState)
    .flat()
    .map(c => `${c.name}, ${c.state}`)
    .sort();
}
