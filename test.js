const test_bussiness = require('./business.js');
const test_persistence = require("./persistence.js");


async function test() {
    let records = await test_persistence.get_info_from_VehicleMaintenanceRecords_collection('MickeyMouse');
    for (let record of records) {
        if (record.username === 'MickeyMouse') {
        console.log(record);
        }
    }
}

test();