const mongodb = require('mongodb');
const crypto = require("crypto");

let client = undefined;
let db = undefined;
let users = undefined;
let session = undefined;
let serviceAppointments = undefined;
let invoices = undefined;
let sparePartsInventory = undefined;
let VehicleMaintenanceRecords = undefined;

async function connectDatabase() {
    if (!client) {
        client = new mongodb.MongoClient('mongodb+srv://mrmickeymouse117:MickeyPass123@cluster0.dukaoqe.mongodb.net/');
        await client.connect();
        db = client.db('Car_Maintenance_Centre');
        users = db.collection('UserAccounts');
        session = db.collection('Session');
        serviceAppointments = db.collection('Service_Appointments');
        invoices = db.collection('Invoices');
        sparePartsInventory = db.collection('Spare_Parts_Inventory');
        VehicleMaintenanceRecords = db.collection('Vehicle_Maintenance_Records');
    }
}

async function get_user_information(username) {
    await connectDatabase();
    if (users) {
        let userInfo = await users.findOne({ 'username': username });
        return userInfo; // returning userInfo regardless of account lock status
    }
}

async function lock_user_account(username) {
    await connectDatabase();
    if (users){
        await users.updateOne({ username: username }, { $set: { locked: true } }); // Locking account without setting lockoutExpiry
    }
}

async function get_user_session_data(key) {
    await connectDatabase();
    if(session){
        let session_data = await session.find({'SessionKey': key}).toArray();
        return session_data[0]
    }
    return undefined;
}

async function save_session_data(uuid, expiry, data) {
    await connectDatabase();
    if (session){
        await session.insertOne({SessionKey: uuid, Expiry: expiry, Data: data})
    }
}

function computeHashSha512(password) {
    let hash = crypto.createHash('sha512')
    hash.update(password)
    let res = hash.digest('hex')
    return res 
}

async function update_user_information(username, data) {
    await connectDatabase();
    if (users){
        await users.updateOne({ username: username }, { $set: data });
    }
}

async function add_information_to_serviceAppointments_collection(data) {
    await connectDatabase();
    if (serviceAppointments){
        await serviceAppointments.insertOne(data);
    }
}

async function get_info_from_serviceAppointments_collection(){
    await connectDatabase();
    if (serviceAppointments){
        let serviceData = await serviceAppointments.find({}).toArray();
        return serviceData;
    }

}

async function add_information_to_invoices_collection(data) {
    await connectDatabase();
    if (invoices){
        await invoices.insertOne(data);
    }
}

async function get_info_from_invoices_collection(){
    await connectDatabase();
    if (invoices){
        let invoiceData = await invoices.find({}).toArray();
        return invoiceData;
    }
}

async function add_information_to_sparePartsInventory_collection(data) {
    await connectDatabase();
    if (sparePartsInventory){
        await sparePartsInventory.insertOne(data);
    }
}

async function get_info_from_sparePartsInventory_collection(){
    await connectDatabase();
    if (sparePartsInventory){
        let sparePartsData = await sparePartsInventory.find({}).toArray();
        return sparePartsData;
    }

}

async function add_information_to_VehicleMaintenanceRecords_collection(data) {
    await connectDatabase();
    if (VehicleMaintenanceRecords){
        await VehicleMaintenanceRecords.insertOne(data);
    }
}

async function get_info_from_VehicleMaintenanceRecords_collection(){
    await connectDatabase();
    if (VehicleMaintenanceRecords){
        let VehicleMaintenanceData = await VehicleMaintenanceRecords.find({}).toArray();
        return VehicleMaintenanceData;
    }

}


module.exports = {
    get_user_information,
    save_session_data,
    get_user_session_data,
    computeHashSha512,
    lock_user_account,
    update_user_information,
    add_information_to_serviceAppointments_collection,
    get_info_from_serviceAppointments_collection,
    add_information_to_invoices_collection,
    get_info_from_invoices_collection,
    add_information_to_sparePartsInventory_collection,
    get_info_from_sparePartsInventory_collection,
    add_information_to_VehicleMaintenanceRecords_collection,
    get_info_from_VehicleMaintenanceRecords_collection
}
