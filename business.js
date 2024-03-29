// Description: This file contains the business logic for the application.
const persistence = require("./persistence.js");
const regex = {
    make: /^[a-zA-Z0-9\s]+$/,
    model: /^[a-zA-Z0-9\s-]+$/,
    plate: /^[a-zA-Z0-9\s-]+$/,
    service: /^[a-zA-Z0-9\s.,-]+$/,
    contact: /^\d{8}$/,
    requests: /^[a-zA-Z0-9\s.,-]+$/,
};


const MAX_FAILED_LOGIN_ATTEMPTS = 3; // Maximum allowed failed login attempts before locking the account
const LOCKOUT_DURATION = 5 * 60 * 1000; // Lockout duration in milliseconds (5 minutes)

async function get_user_type(username, password) {
    try {
        let userData = await persistence.get_user_information(username);
        
        if (!userData) {
            return undefined; // User not found
        }
        
        // The user exists, so we need to compare the password
        if (userData.password !== persistence.computeHashSha512(password)) { // Incorrect password
            userData.failedLoginAttempts++; // Increment failed login attempts
            
            if (userData.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) { // Lock the account if the maximum failed login attempts are reached
                await persistence.lock_user_account(username);
                return false; // Account is locked
            }

            await persistence.update_user_information(username, { failedLoginAttempts: userData.failedLoginAttempts });
            return null; // Incorrect password
        } else if (userData.locked && userData.lockoutExpiry > new Date()) { // Account is locked
            return false;
        } else if (userData.locked && userData.lockoutExpiry <= new Date()) { // Account lockout expired
            await persistence.unlock_user_account(username); // Unlock the account
        }

        // Reset failed login attempts if the password is correct
        await persistence.update_user_information(username, { failedLoginAttempts: 0 });
        
        return userData.accountType;
    } catch (error) {
        throw error; // Rethrow the error for handling at a higher level
    }
}



async function get_user_session_data(key) {
    return await persistence.get_user_session_data(key);
}

async function start_user_session(data){
    let sessionId = crypto.randomUUID();
    let expiryTime = new Date(Date.now() + 1000 * 60 * 1);
    let sessionData = {
        username: data.username,
        accountType: data.accountType 
    };
    
    await persistence.save_session_data(sessionId, expiryTime, sessionData);
    return sessionId;
}

function generateServiceId(shopCode = "SH001", carRegistrationNumber) {
    const currentDate = new Date().toISOString().slice(0,10).replace(/-/g,"");
    const uniqueId = Math.random().toString(36).substr(2, 6);
    const serviceId = `${shopCode}-${carRegistrationNumber}-${currentDate}-${uniqueId}`;
    return serviceId;
}


function combineDateTime(dateString, timeString) {
    // Split date and time strings
    const [year, month, day] = dateString.split('-');
    const [time, meridiem] = timeString.split(' ');

    // Split time into hours and minutes
    const [hours, minutes] = time.split(':').map(Number);

    // Adjust hours if PM
    const adjustedHours = meridiem === 'PM' ? hours + 12 : hours;

    // Create Date object
    const combinedDate = new Date(year, month - 1, day, adjustedHours, minutes);

    return combinedDate;
}


async function schedule_service(sessionId, data) {
    try {
        // Get current date
        const currentDate= new Date();
        // const currentDate_withoutTime = date_thing(currentDate);

        // Parse the provided date string into a Date object
        const appointmentDate = combineDateTime(data.Date, data.Time);

        
        // Check if the appointment date is in the past
        if (appointmentDate < currentDate) {
            return false; // Cannot book appointments on past dates
        }

        // Check if the appointment time is in the past (in case the appointment is for today)
        if (appointmentDate.getTime() === currentDate.getTime()) {
            const timeParts = data.Time.split(':'); // Splitting the time string into hours and minutes
            const appointmentTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), parseInt(timeParts[0]), parseInt(timeParts[1])); // Creating a new Date object with current date and time from the string
            
            if (appointmentTime < currentDate) {
                return false; // Cannot book appointments on past dates
            }
        }


        const check_serviceAppointments = await persistence.get_info_from_serviceAppointments_collection();
        
        // Check if the appointment already exists
        for (let appointment of check_serviceAppointments) {
            if (appointment.Date === data.Date && appointment.Time === data.Time) {
                    return null; // Time slot already booked
                }else if(appointment.Plate === data.Plate){
                    return undefined; // Plate already exists
            }
        }

        // Get user session data
        const sessionData = await persistence.get_user_session_data(sessionId);
        
        // Generate service ID
        const serviceId = generateServiceId("SH001", data.Plate);
        
        // Prepare service data
        const serviceData = {
            username: sessionData.Data.username,
            serviceId: serviceId,
            Make: validateInput(data.Make, regex.make) ? data.Make : null,
            Model: validateInput(data.Model, regex.model) ? data.Model : null,
            Plate: validateInput(data.Plate, regex.plate) ? data.Plate : null,
            Service: validateInput(data.Service, regex.service) ? data.Service : null,
            Date: data.Date,
            Time: data.Time,
            Contact: validateInput(data.Contact, regex.contact) ? data.Contact : null,
            Requests: validateInput(data.Requests, regex.requests) ? data.Requests : null,
            status: "Pending"
        };
        
        // Add service appointment to the collection
        if (areAllValuesNotNull(serviceData)){
            await persistence.add_information_to_serviceAppointments_collection(serviceData);
            return true; // Appointment scheduled successfully
        } else {
            return "Input Error"; // Some values are null, appointment not scheduled
        }
        
    } catch (error) {
        console.error("Error scheduling service:", error);
        throw error; // Propagate the error
    }
}

function validateInput(input, regexPattern) {
    return regexPattern.test(input);
}

function areAllValuesNotNull(obj) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (obj[key] === null) {
                return false;
            }
        }
    }
    return true;
}

async function add_information_to_VehicleMaintenanceRecords_collection(data){
    await persistence.add_information_to_VehicleMaintenanceRecords_collection(data);
}

async function get_info_from_VehicleMaintenanceRecords_collection(){
    return await persistence.get_info_from_VehicleMaintenanceRecords_collection();
}

async function get_info_from_serviceAppointments_collection(username){
    return await persistence.get_info_from_serviceAppointments_collection(username);
}

async function terminate_session(sessionId) {
    await persistence.terminate_session(sessionId);
}



module.exports = {
    start_user_session,
    get_user_type,
    get_user_session_data,
    schedule_service,
    add_information_to_VehicleMaintenanceRecords_collection,
    get_info_from_VehicleMaintenanceRecords_collection,
    get_info_from_serviceAppointments_collection,
    terminate_session
};
