const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const app = express();
const cookieParser = require('cookie-parser');
const business = require('./business.js');

// Configure Express to use Handlebars
app.set('views', __dirname + "/templates");
app.set('view engine', 'handlebars');
app.engine('handlebars', engine({ layoutsDir: __dirname + "/templates", defaultLayout: false })); // Disable layouts
// Serve static files from the 'public' directory
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));
// main login page for admin and normal user 
app.use(cookieParser());

app.get('/login', (req, res) => {
    res.render('login', { imagePath: '/av1.1.png' });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const role = await business.get_user_type(username, password);
        
        if (role === undefined) {
            res.status(401).send('Invalid Username or Password');
            return;
        } else if (role === false) {
            res.status(403).send('Account is locked');
            return;
        }

        const sessionId = await business.start_user_session({ username, accountType: role });
        const sessionInfo = await business.get_user_session_data(sessionId);
        res.cookie('sessionkey', sessionId, { expires: sessionInfo.Expiry });
        

        // Redirect user based on their role
        if (role === 'admin') {
            res.render('admin-dashboard');
        } else if (role === 'standard') {
            res.render('standard-dashboard', { layout: undefined });

        } else if (role === 'technician') {
            res.render('technician-dashboard', { layout: undefined });
        
        } else {
            res.status(403).send('Forbidden'); // Or handle other roles accordingly
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/scheduleService', (req, res) => {
    res.render('scheduleService');
});

app.post('/scheduleService', async (req, res) => {
    const { Make, Model, Plate, Service, Date, Time, Contact, Requests } = req.body;
    let get_user_session_from_cookie = req.cookies.sessionkey;
    try {
        if(await business.schedule_service(get_user_session_from_cookie, { Make, Model, Plate, Service, Date, Time, Contact, Requests })){
            res.status(200).send('Service scheduled successfully');
        } else {
            res.status(409).send('This time slot is already booked');
        }
    } catch (error) {
        console.error('Service scheduling error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to retrieve service history
app.get('/serviceHistory', async (req, res) => {
    try {
        let get_user_session_from_cookie = req.cookies.sessionkey;
        let username = (await business.get_user_session_data(get_user_session_from_cookie)).Data.username;
        // Retrieving service appointments from the collection
        const serviceAppointments = await business.get_info_from_serviceAppointments_collection({ username});

        // Checking if there are upcoming service appointments
        if (serviceAppointments && serviceAppointments.Date) {
            const serviceAppointmentsDate = new Date(serviceAppointments.Date);
            const today = new Date();

            // Checking if the service appointment date is in the future
            if (serviceAppointmentsDate > today) {
                // Adding information to Vehicle Maintenance Records collection
                const record = await business.add_information_to_VehicleMaintenanceRecords_collection(serviceAppointments);

                // Rendering service history page with the retrieved record
                res.render('serviceHistory');
                return; // Exiting the function after rendering
            }
        }

        // If there are no upcoming service appointments or the appointments are in the past, render an appropriate response
        res.render('noServiceHistory', { message: 'No upcoming service appointments found.' });
    } catch (error) {
        // Logging and responding to any errors that occur during the process
        console.error('Error retrieving service history:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.listen(8000, () => {
    console.log(`App is running on http://localhost:8000/login`);
});


async function test_web_layer(){
}

// test_web_layer();