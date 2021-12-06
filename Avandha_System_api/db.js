var sql=require('mysql')


var con=sql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "scrap_deal"
}
)

module.exports=con