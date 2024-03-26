const persistence = require("./persistence.js")
const business = require('./business.js')


async function main(){
    let MickeyMouse_car = await persistence.get_info_from_serviceAppointments_collection('MickeyMouse');
    console.log(MickeyMouse_car.Date)
}
main()


