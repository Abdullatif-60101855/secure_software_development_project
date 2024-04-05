// Description: This file contains the web layer of the application.
// Author: Abdullatif Abuzannad
// Date: 2024-04-06

const express=require('express')
const business = require('./business.js')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const handlebars = require('express-handlebars')
let app = express()

// Configure Express to use Handlebars
app.set('views', __dirname+"/templates")
app.set('view engine', 'handlebars');
app.engine('handlebars', handlebars.engine())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use('/images', express.static(__dirname+"/static/images"))

app.get('/', (req, res) => {
    let message = req.query.message;
    res.render('login', { message: message, imagePath: '/images/av1.1.png'});
});


app.post('/', async (req, res) => {
    const { username, password } = req.body;
    try {
        const role = await business.get_user_type(username, password);
        
        if (role === undefined) {
            res.redirect('/?message=User not found');
            return;
        } else if (role === false) {
            res.redirect('/?message=Account is locked');
            return;
        } else if (role === null) {
            res.redirect('/?message=Incorrect password');
            return;
        }

        const sessionId = await business.start_user_session({ username, accountType: role }); // Starting a new session for the user
        const sessionInfo = await business.get_user_session_data(sessionId); // Retrieving session data
        res.cookie('sessionkey', sessionId, { expires: sessionInfo.Expiry, secure: true, httpOnly: true,  }); // Setting the session key in a cookie with an expiry time and secure flag (for HTTPS only)

        // Redirect user based on their role
        if (role === 'admin') {
            res.redirect('/admin-dashboard');
        } else if (role === 'standard') {
            res.redirect('/standard-dashboard');
        } else if (role === 'technician') {
            res.redirect('/technician-dashboard');
        } else {
            res.status(403).send('Forbidden'); // Or handle other roles accordingly
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/admin-dashboard', isAuthenticated, (req, res) => {
    res.render('admin-dashboard');
});

app.get('/standard-dashboard', isAuthenticated, (req, res) => {
    res.render('primary_actor/standard-dashboard');
});

app.get('/technician-dashboard', isAuthenticated, (req, res) => {
    res.render('technician-dashboard');
});

app.get('/schedule_service', isAuthenticated, (req, res) => {
    let message = req.query.message;
    res.render('primary_actor/schedule_service', { message: message });
});

app.post('/schedule_service', isAuthenticated, async (req, res) => {
    const { Make, Model, Plate, Service, Date, Time, Contact, Requests } = req.body;
    let get_user_session_from_cookie = req.cookies.sessionkey;
    try {
        let schedule_service = await business.schedule_service(get_user_session_from_cookie, { Make, Model, Plate, Service, Date, Time, Contact, Requests });
        if (schedule_service === false){
            res.redirect('/schedule_service?message=Cannot book appointments on past dates');
        } else if (schedule_service === null){
            res.redirect('/schedule_service?message=Time slot already booked');
        } else if (schedule_service === undefined){
            res.redirect('/schedule_service?message=Plate already exists');
        } else if (schedule_service === true){
            res.redirect('/schedule_service?message=Appointment scheduled successfully');
        }else if (schedule_service === "Input Error"){
            res.redirect('/schedule_service?message=Invalid input');
        }
    } catch (error) {
        console.error('Service scheduling error:', error);
        return res.status(500).send('Internal Server Error');
    }
});


// Endpoint to retrieve service history
app.get('/serviceHistory',  isAuthenticated, async (req, res) => {
    try {
        let get_user_session_from_cookie = req.cookies.sessionkey; // Retrieving session key from cookie
        let username = (await business.get_user_session_data(get_user_session_from_cookie)).Data.username; // Retrieving username from session data
        const serviceAppointments = await business.get_info_from_VehicleMaintenanceRecords_collection({username}); // Retrieving vehicle service records from the collection

        // Checking if there are any service appointments
        if (serviceAppointments && serviceAppointments.length > 0) {
            const today = new Date();

            // Checking each service appointment
            for (const appointment of serviceAppointments) {
                const serviceAppointmentsDate = new Date(appointment.Date);

                // Checking if the service appointment date is in the past
                if (serviceAppointmentsDate <= today) {
                    // Rendering service history page with the retrieved appointments
                    res.render('serviceHistory', { serviceAppointments });
                    return; // Exiting the function after rendering
                }
            }
        }

        // Render an appropriate response if no upcoming or past service appointments found
        res.render('primary_actor/No_results', { message: 'No past service appointments found.' , imagePath: '/images/no_results_1.png'});

    } catch (error) {
        // Logging and responding to any errors that occur during the process
        console.error('Error retrieving service history:', error);
        res.status(500).send('Internal Server Error');
    }
});

// app.get('/vehicleMaintenanceRecords', isAuthenticated, async (req, res) => {
//     try {
//         const vehicleMaintenanceRecords = await business.get_info_from_VehicleMaintenanceRecords_collection(); // Retrieving vehicle maintenance records from the collection

//         // Checking if there are any vehicle maintenance records
//         if (vehicleMaintenanceRecords && vehicleMaintenanceRecords.length > 0) {
//             // Rendering vehicle maintenance records page with the retrieved records
//             res.render('primary_actor/vehicleMaintenanceRecords', { vehicleMaintenanceRecords });
//         } else {
//             // Render an appropriate response if no vehicle maintenance records found
//             res.render('primary_actor/noVehicleMaintenanceRecords', { message: 'No vehicle maintenance records found.' });
//         }

//     } catch (error) {
//         // Logging and responding to any errors that occur during the process
//         console.error('Error retrieving vehicle maintenance records:', error);
//         res.status(500).send('Internal Server Error');
//     }
// });

app.get('/notifications', isAuthenticated, async (req, res) => {
    try {
        user_session = req.cookies.sessionkey;
        let data_from_session = await business.get_user_session_data(user_session);
        let username = data_from_session.Data.username;
        // console.log(username);
        const notifications = await business.get_info_from_serviceAppointments_collection(username);
        // console.log(notifications);
        res.render('primary_actor/notifications', { notifications: notifications , imagePath: '/images/no_results_1.png', message: 'No notifications found.'});

    }catch (error) {
        console.error('Error retrieving notifications:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/make_payment', isAuthenticated, (req, res) => {
    let message = req.query.message;
    res.render('primary_actor/make_payment', { message: message });
});

app.post('/make_payment', isAuthenticated, async (req, res) => {
    const { cardNumber, expiryDate, cvv, amount } = req.body;
    let get_user_session_from_cookie = req.cookies.sessionkey; // session key from cookie
    let sessionInfo = await business.get_user_session_data(get_user_session_from_cookie); // session data using session key from cookie
    let username = sessionInfo.Data.username; // extracting username from session data
    let service_info = await business.get_info_from_serviceAppointments_collection(username); // getting service info from collection
    for (let element of service_info){ // looping through the service info to get the service id
        if (element.username === username){
            var service = element;
        }
    }
    let service_id = service.serviceId; // extracting service id from service info

    let service_status = service.status; // extracting service status from service info 
    try {
        let validate_payment = await business.validate_payment({ service, service_id, service_status, cardNumber, expiryDate, cvv, amount });
        if (validate_payment === true){
            await business.add_information_to_VehicleMaintenanceRecords_collection(service)
            await business.delete_data('Service_Appointments', { serviceId: service_id })
            res.redirect('/make_payment?message=Payment+successful+for+service+ID: ' + service_id);
        } else if (validate_payment === false){
            res.redirect('/make_payment?message=Payment+failed');
        } else if (validate_payment === "No service found"){
            res.redirect('/make_payment?message=No+service+found');
        }
    } catch (error) {
        console.error('Payment error:', error);
        return res.status(500).send('Internal Server Error');
    }
})

app.get('/logout', async (req, res) => {
    let session_id = req.cookies.SessionKey;
    await business.terminate_session(session_id);
    res.clearCookie('sessionkey');
    res.redirect('/');
});


// isAuthenticated middleware
async function isAuthenticated(req, res, next) {
    if (req.cookies.sessionkey) {
        // Session exists, user is authenticated
        return next();
    } else {
        res.clearCookie('sessionkey'); // Clear the session cookie if it exists
        res.redirect('/?message=No+active+session+or+session+has+expired'); // Redirect to login page with a formal message if session doesn't exist
    }
}




app.listen(process.env.PORT, () => {
    console.log(`App is running on http://localhost:${process.env.PORT}`);
});