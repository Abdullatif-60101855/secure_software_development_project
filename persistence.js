// Description: This file contains the code that interacts with the database. It contains functions that allow the server to query the database for user information, update user information, and lock user accounts. It also contains functions that allow the server to save and retrieve session data.

// app.js
require('dotenv').config();
const crypto = require("crypto");
const { MongoClient } = require('mongodb');

let client = undefined;
let db = undefined;

async function connectDatabase() {
    if (!client) {
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        db = client.db(process.env.DATABASE_NAME);
    }
    return db;
}


async function get_user_information(username) {
    await connectDatabase();
    let users = db.collection('UserAccounts');

    if (!users) {
        return undefined;
    }

    return users.findOne({ 'username': username });
}


async function update_user_information(username, data) {
    await connectDatabase();
    let users = db.collection('UserAccounts');
    if (users){
        await users.updateOne({ username: username }, { $set: data });
    }
}

async function save_session_data(uuid, expiry, data) {
    await connectDatabase();
    let session = db.collection('Session');
    if (session){
        await session.insertOne({SessionKey: uuid, Expiry: expiry, Data: data})
    }
}

async function get_user_session_data(key) {
    await connectDatabase();
    let session = db.collection('Session');
    let session_data = await session.find({'SessionKey': key}).toArray();
    return session_data[0];
}

async function terminate_session(key) {
    await connectDatabase()
    let session = db.collection('Session')
    await session.deleteOne({key: key})
}



async function lock_user_account(username, lockoutDuration = 1000 * 60 * 1) { 
    const db = await connectDatabase();
    const users = db.collection('UserAccounts');
    if (users) {
        const lockoutExpiry = new Date(Date.now() + lockoutDuration);
        await users.updateOne({ username: username }, { $set: { locked: true, lockoutExpiry: lockoutExpiry } });
    }
}

async function unlock_user_account(username) {
    await connectDatabase();
    let users = db.collection('UserAccounts');
    await users.updateOne({ username: username }, { $set: { locked: false, lockoutExpiry: null } });

}

// function isAccountLocked(userInformation) {
//     return userInformation.locked === true && userInformation.lockoutExpiry instanceof Date && userInformation.lockoutExpiry > new Date(); // 
// }

function isAccountLocked(userInformation) {
    return userInformation.locked // check if account is locked
}


function computeHashSha512(password) {
    let hash = crypto.createHash('sha512')
    hash.update(password)
    let res = hash.digest('hex')
    return res 
}



async function add_information_to_serviceAppointments_collection(data) {
    await connectDatabase();
    let serviceAppointments = db.collection('Service_Appointments');
    if (serviceAppointments){
        await serviceAppointments.insertOne(data);
    }
}

async function get_info_from_serviceAppointments_collection(username){
    await connectDatabase();
    let serviceAppointments = db.collection('Service_Appointments');
    if (serviceAppointments){
        let serviceData;
        if (username) {
            serviceData = await serviceAppointments.find({username: username}).toArray();
        } else {
            serviceData = await serviceAppointments.find({}).toArray();
        }
        return serviceData;
    }
}


async function add_information_to_invoices_collection(data) {
    await connectDatabase();
    let invoices = db.collection('Invoices');
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
    let sparePartsInventory = db.collection('Spare_Parts_Inventory');
    if (sparePartsInventory){
        await sparePartsInventory.insertOne(data);
    }
}

async function get_info_from_sparePartsInventory_collection(){
    await connectDatabase();
    let sparePartsInventory = db.collection('Spare_Parts_Inventory');
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

async function get_info_from_VehicleMaintenanceRecords_collection(username){
    await connectDatabase();
    let VehicleMaintenanceRecords = db.collection('Vehicle_Maintenance_Records');
    let VehicleMaintenanceData 
    if (VehicleMaintenanceRecords){
        VehicleMaintenanceData = await VehicleMaintenanceRecords.find({username: username}).toArray();
        return VehicleMaintenanceData;
    }else{
    VehicleMaintenanceData = await VehicleMaintenanceRecords.find({}).toArray();
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
    get_info_from_VehicleMaintenanceRecords_collection,
    terminate_session,
    unlock_user_account
}