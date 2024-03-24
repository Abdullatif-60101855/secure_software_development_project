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
}

// main()