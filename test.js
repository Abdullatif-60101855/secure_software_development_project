const persistence = require("./persistence.js")
const business = require('./business.js')


async function main(){
    let login = await business.get_user_type("MickeyMouse", "Mickey123")
    console.log(login)
}
// main()


