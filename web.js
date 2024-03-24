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
            res.redirect('/?message=Invalid Username or Password');
            return;
        } else if (role === false) {
            res.redirect('/?message=Account is locked');
            return;
        }

        const sessionId = await business.start_user_session({ username, accountType: role });
        const sessionInfo = await business.get_user_session_data(sessionId);
        res.cookie('sessionkey', sessionId, { expires: sessionInfo.Expiry });

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

app.get('/admin-dashboard', (req, res) => {
    res.render('admin-dashboard');
});

app.get('/standard-dashboard', (req, res) => {
    res.render('primary_actor/standard-dashboard');
});

app.get('/technician-dashboard', (req, res) => {
    res.render('technician-dashboard');
});

app.get('/schedule_service', (req, res) => {
    res.render('primary_actor/schedule_service');
});

app.post('/schedule_service', async (req, res) => {
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
        let get_user_session_from_cookie = req.cookies.sessionkey; // Retrieving session key from cookie
        let username = (await business.get_user_session_data(get_user_session_from_cookie)).Data.username; // Retrieving username from session data
        const serviceAppointments = await business.get_info_from_serviceAppointments_collection({ username }); // Retrieving service appointments from the collection

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
        res.render('primary_actor/noServiceHistory', { message: 'No upcoming or past service appointments found.' });

    } catch (error) {
        // Logging and responding to any errors that occur during the process
        console.error('Error retrieving service history:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/logout', async (req, res) => {
    let session_id = req.cookies.SessionKey;
    await business.terminate_session(session_id);
    res.clearCookie('sessionkey');
    res.redirect('/');
});




app.listen(8000, () => {
    console.log(`App is running on http://localhost:8000`);
});


async function test_web_layer(){
}

// test_web_layer();