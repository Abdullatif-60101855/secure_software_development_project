const persistence = require("./persistence.js")
const business = require('./business.js')


async function main(){
    let someone  = await persistence.get_user_information('MickeyMouse')
    // console.log(someone)
    let username = someone.username;
    let password = persistence.computeHashSha512("Mickey123")
    // console.log(username, password)
    let userType = await business.get_user_type(username, password)
    // console.log(userType)
    let session_id = await business.start_user_session({username:someone.username, accountType:userType})
    let sessionData = await persistence.get_user_session_data(session_id)
    // console.log(sessionData)
    // let lst  = await persistence.check_serviceAppointments();
    // console.log(lst.length)
    let string_time = '9:30';
    let toDay = new Date();
    let timeParts = string_time.split(':'); // Splitting the time string into hours and minutes
    let time = new Date(toDay.getFullYear(), toDay.getMonth(), toDay.getDate(), parseInt(timeParts[0]), parseInt(timeParts[1])); // Creating a new Date object with current date and time from the string
    console.log(time);
    
}

main()