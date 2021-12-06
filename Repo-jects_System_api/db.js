var sql=require('mysql')


var con=sql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "repo_jects"
}
)

module.exports=con