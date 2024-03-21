const persistence = require("./persistence.js");

const MAX_FAILED_LOGIN_ATTEMPTS = 3; // Maximum allowed failed login attempts before locking the account

async function get_user_type(username, password) {
    try {
        let userData = await persistence.get_user_information(username);
        
        if (!userData) {
            return undefined; // User not found
        }
        
        if (userData.locked) {
            return false; // Account is locked
        }
        
        // The user exists, so we need to compare the password
        if (userData.password !== persistence.computeHashSha512(password)) {
            userData.failedLoginAttempts++;
            
            if (userData.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
                await persistence.lock_user_account(username);
            } else {
                await persistence.update_user_information(username, { failedLoginAttempts: userData.failedLoginAttempts });
            }
            
            return undefined; // Incorrect password
        }

        // Reset failed login attempts if the password is correct
        await persistence.update_user_information(username, { failedLoginAttempts: 0 });
        
        return userData.accountType;
    } catch (error) {
        console.error("An error occurred:", error);
        throw error; // Rethrow the error for handling at higher level
    }
}


async function get_user_session_data(key) {
    return await persistence.get_user_session_data(key);
}

async function start_user_session(data){
    let sessionId = crypto.randomUUID();
    let expiryTime = new Date(Date.now() + 1000 * 60 * 5);
    let sessionData = {
        username: data.username,
        accountType: data.accountType 
    };
    
    await persistence.save_session_data(sessionId, expiryTime, sessionData);
    return sessionId;
}

async function schedule_service(sessionId, data) {
    try {
        const check_serviceAppointments = await persistence.get_info_from_serviceAppointments_collection();

        if (check_serviceAppointments.some(appointment => (appointment.Date === data.Date && appointment.Time === data.Time) || appointment.Plate === data.Plate)) {
            return false; // Appointment already exists
        } else {
            const sessionData = await persistence.get_user_session_data(sessionId);
            const serviceData = {
                username: sessionData.Data.username,
                Make: data.Make,
                Model: data.Model,
                Plate: data.Plate,
                Service: data.Service,
                Date: data.Date,
                Time: data.Time,
                Contact: data.Contact,
                Requests: data.Requests
            };
            await persistence.add_information_to_serviceAppointments_collection(serviceData);
            return true; // Appointment scheduled successfully
        }
    } catch (error) {
        console.error("Error scheduling service:", error);
        throw error; // Propagate the error
    }
}
async function add_information_to_VehicleMaintenanceRecords_collection(data){
    await persistence.add_information_to_VehicleMaintenanceRecords_collection(data);
}

async function get_info_from_VehicleMaintenanceRecords_collection(){
    return await persistence.get_info_from_VehicleMaintenanceRecords_collection();
}

async function get_info_from_serviceAppointments_collection(){
    return await persistence.get_info_from_serviceAppointments_collection();
}



module.exports = {
    start_user_session,
    get_user_type,
    get_user_session_data,
    schedule_service,
    add_information_to_VehicleMaintenanceRecords_collection,
    get_info_from_VehicleMaintenanceRecords_collection,
    get_info_from_serviceAppointments_collection
};
