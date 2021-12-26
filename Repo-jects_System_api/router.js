var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var xoauth2 = require('xoauth2');
var bcrypt = require('bcryptjs');
var db = require('./db')
var hash = require('./hashP')
var nodemailer = require('nodemailer')
console.log(db)

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
// Home page route.


//router.get('/', (req, res) => {
//
//    var name = "Dear Dharm";
//    var from = "8149dharm@gmail.com";
//    var message = "Message Come";
//    var to = 'sshreyash34@gmail.com';
//    var smtpTransport = nodemailer.createTransport({
//        service: "Gmail",
//        auth: {
//            user: "8149dharm@gmail.com",
//            pass: "########"
//        }
//    });
//    var mailOptions = {
//        from: from,
//        to: to,
//        subject: "Hey Shreyash this is checking from dharm for otp your otp is 4696",
//        text: message
//    }
//    smtpTransport.sendMail(mailOptions, function (error, response) {
//        if (error) {
//            console.log(error);
//        } else {
//            res.send("send");
//        }
//    });
//})

///////////////////////////////////////////////////////////get OTP //////////////////////////////////////////////////////////////////////

router.post('/get_otp', function(req, res) {
    console.log("working")
    var email = req.body.email
    console.log(req.body)
    if (db.state == "disconnected")
        db.connect((err) => { if (err) throw err; })


    var sql = `select * from student_user where student_email='${email}'`;
    db.query(sql, function(err, result) {
        if (err) throw err;
        if (result.length > 0) {
            console.log(result)
            if (String(result[0].student_password) == "null") {
                if (typeof result[0].student_password === 'string') {
                    return res.send({ data: {}, status: false, message: "User already exist" })
                }

            } else {
                return res.send({ data: {}, status: false, message: "User already exist" })
            }

        }

        var token
        var otp = Math.floor(Math.random() * 899999 + 100000)
        var sql2 = `select * from otp_data where email = '${email}';`;
        db.query(sql2, function(err, result) {
            if (err) throw err;
            if (result.length == 0) {
                var sql = `insert into otp_data (email,otp) values ('${email}','${otp}');`;

            } else {
                var sql = `update otp_data SET otp = '${otp}' where email = '${email}';`;
            }


            db.query(sql, function(err, result) {
                if (err) throw err;
                token = jwt.sign({ id: email }, hash.secret, {
                    expiresIn: 300 // expires in 10min
                })
                console.log(token)

                var from = "Repo-Jects | Team Lazy Coders";
                var message = `Greetings from Team Lazy Coders. 

Welcome to Repo-Jects - Repository of all students projects
Thank you for registrating in Repo-Jects your OTP is ${otp}. 

This OTP will be valid for next 10 minutes.
        

Regards
Team Lazy Coders`;
                var to = email;
                var smtpTransport = nodemailer.createTransport({
                    service: "Gmail",
                    auth: {
                        user: "teamlazycoders@gmail.com",
                        pass: "############"
                    }
                });
                var mailOptions = {
                    from: from,
                    to: to,
                    subject: "OTP | Repo-Jects | Team Lazy Coders",
                    text: message
                }
                smtpTransport.sendMail(mailOptions, function(error, response) {
                    if (error) {
                        console.log(error);
                    } else {
                        res.send({ data: { token: token }, status: true, message: "Its a new user" })
                    }
                });


            })
        })


    })

    /*var token=jwt.sign({id:req.body.email},hash.secret,{
        expiresIn: 86400 // expires in 24 hours

        */


});



// About page route.
router.get('/about', function(req, res) {
    res.send('About this wiki');
})

///////////////////////////////////////////////////////// verify OTp /////////////////////////////////////////////////////////////////////

router.post('/verify_otp', function(req, res) {
    var token = req.body.token
    var otp = req.body.otp

    if (db.state == "disconnected")
        db.connect((err) => { if (err) throw err; })


    jwt.verify(token, hash.secret, function(err, decoded) {
        if (err) return res.status(500).send({ data: {}, status: false, message: "Verification failed" });

        var email = decoded.id

        sql = `select * from otp_data where email='${email}' and otp='${otp}'`

        db.query(sql, function(err, result) {
            if (err) throw err;
            if (result.length == 0) {
                res.status(500).send({ data: {}, status: false, message: "OTP Incorrect" });
            } else {
                var token1 = jwt.sign({ id: email }, hash.secret, {
                    expiresIn: 864000 // expires in 10 days
                })

                sql = `select * from otp_data where email='${email}' and otp='${otp}'`

                db.query(sql, function(err, result) {
                    if (err) throw err;

                    if (result.length > 0) {
                        sql1 = `select * from student_user where student_email='${email}'`;


                        db.query(sql1, function(err, newresult) {
                            if (err) throw err;
                            if (newresult.length == 0) {
                                sql2 = `insert into student_user (student_email) values('${email}')`;
                                db.query(sql2, function(err, newresult) {
                                    if (err) throw err;
                                    return res.send({ data: { token: token1 }, status: true, message: "OTP verified and User Created" })

                                })
                            } else {
                                res.send({ data: { token: token1 }, status: true, message: "OTP verified and user exist" })
                            }


                        })
                    }
                })
            }
        })
    });
})

////////////////////////////////////////////////////////// Login ///////////////////////////////////////////////////////////////////////////

router.post('/login', function(req, res) {
    var email = req.body.email
    var password = req.body.password

    if (db.state == "disconnected")
        db.connect((err) => { if (err) throw err; })

    var sql = `select * from student_user where student_email='${email}'`

    db.query(sql, function(err, result) {
        if (err) throw err;

        if (result.length > 0) {
            var passwordIsValid = String(result[0].student_password) == password ? true : false;
            if (passwordIsValid == false) {
                return res.status(200).send({ data: {}, status: false, message: "Password is inncorrect" });
            } else {
                var token1 = jwt.sign({ id: email }, hash.secret, {
                    expiresIn: 864000 // expires in 10 days
                })
                return res.status(200).send({ data: { user_info: result, jwttoken: token1 }, status: true, message: "User found" });
            }

        } else {
            res.status(200).send({ data: {}, status: false, message: "User does not exist" });
        }
        console.log(result)
        res.send({ data: {}, status: false, message: "API Failed" })
    })
}, )

////////////////////////////////////////////////////////// Forget Password //////////////////////////////////////////////////

router.post('/forget_password', function(req, res) {
    var email = req.body.email


    if (db.state == "disconnected")
        db.connect((err) => { if (err) throw err; })

    var sql = `select * from student_user where student_email='${email}'`

    db.query(sql, function(err, result) {
        if (err) throw err;
        console.log(result)
        console.log(result.length)
        if (result.length > 0) {

            var from = "Repo-Jects | Team Lazy Coders";
            var message = `Greetings from Team Lazy Coders. 

Welcome to Repo-Jects - Repository of all students projects
Your registered credentials is :
Email - ${email}
Password - ${result[0].student_password}

Please do remember!
        
Regards
Team Lazy Coders`;
            var to = email;
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "teamlazycoders@gmail.com",
                    pass: "##########"
                }
            });
            var mailOptions = {
                from: from,
                to: to,
                subject: "Forget Password | Repo-Jects | Team Lazy Coders",
                text: message
            }
            smtpTransport.sendMail(mailOptions, function(error, response) {
                if (error) {
                    console.log(error);
                } else {
                    return res.send({ data: {}, status: true, message: "Mail Send" })
                }
            });

        } else {
            return res.status(200).send({ data: {}, status: false, message: "User does not exist" });
        }

        //res.send({data:{} ,status:false, message:"API Failed"})
    })
}, )


///////////////////////////////////////////////////////////////// Add user details /////////////////////////////////////////////////////////


router.post('/user_data', function(req, res) {
    var token = req.body.token
    var name = req.body.full_name
    var phone = req.body.phone_no
    var state = req.body.state
        //var university=req.body.university_name
        //var password= bcrypt.hashSync(req.body.password, 8);
    var password = req.body.password;


    jwt.verify(token, hash.secret, function(err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })

        var sql = `update student_user set student_name='${name}',student_phone='${phone}',student_password='${password}',student_state='${state}'  where student_email='${email}'`

        db.query(sql, function(err, result) {
            if (err) throw err;
            var sql1 = `select * from student_user where student_email='${email}'`
            db.query(sql1, function(err, newresult) {
                if (err) throw err;
                res.send({ data: { user_info: newresult }, status: true, message: "Data inserted successfully" })
            })

        })
    })
})


/////////////////////////////////////////////////////////////////// update user data ///////////////////////////////////////////////////////////////////////

router.post('/update_data', function(req, res) {
    var token = req.body.token
    var name = req.body.full_name
    var phone = req.body.phone_no
    var state = req.body.state
        //var university=req.body.university_name
        //var password= bcrypt.hashSync(req.body.password, 8);



    jwt.verify(token, hash.secret, function(err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })

        var sql = `update student_user set student_name='${name}',student_phone='${phone}',student_state='${state}'  where student_email='${email}'`

        db.query(sql, function(err, result) {
            if (err) throw err;
            res.send({ data: {}, status: true, message: "Data updated successfully" })


        })
    })
})


////////////////////////////////////////////////////////////// get currentDB ////////////////////////////////////////////////////////////////

router.post('/getCurrentDB', function(req, res) {
    var token = req.body.token
    var userid = req.body.student_id

    jwt.verify(token, hash.secret, function(err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })

        var sql = `select * from student_user where student_email='${email}'`;

        db.query(sql, function(err, user_result) {
            if (err) throw err;
            var sql1 = `select project_id from rate_list where student_id ='${user_result[0].student_id}'`;
            db.query(sql1, function(err, rate_result) {
                if (err) throw err;
                var sql2 = `select * from project where is_delete = "false" order by project_rating DESC LIMIT 10`;
                db.query(sql2, function(err, pro_result) {
                    if (err) throw err;


                    return res.status(200).send({ data: { user_info: user_result, rate_list: rate_result, projects: pro_result }, status: true, message: "Cureent DB found" });



                })
            })
        })
    })

})


/////////////////////////////////////////////////////////////////// get my projects //////////////////////////////////////////////////////////////////////////////

router.post('/getmyprojects', function(req, res) {
    var token = req.body.token
    var userid = req.body.student_id
    jwt.verify(token, hash.secret, function(err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })

        var sql = `select * from student_user where student_email='${email}'`;

        db.query(sql, function(err, user_result) {
            if (err) throw err;
            var sql1 = `select * from project where student_id ='${user_result[0].student_id}' and is_delete = "false"`;
            db.query(sql1, function(err, pro_result) {
                if (err) throw err;
                return res.status(200).send({ data: { projects: pro_result }, status: true, message: "Cureent DB found" });
            })
        })
    })

})

///////////////////////////////////////////////////////////// search a project /////////////////////////////////////////////////////////////////////

router.post('/searchproject', function(req, res) {
    var token = req.body.token
    var searchValue = req.body.value
    var SearchType = req.body.type

    jwt.verify(token, hash.secret, function(err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })

        if (SearchType == "domain") {
            var sql = `select * from project where domain LIKE concat('%','${searchValue}', '%') and is_delete = 'false'`;
        } else if (SearchType == "year") {
            var sql = `select * from project where project_year LIKE concat('%','${searchValue}', '%') and is_delete = 'false'`;
        } else if (SearchType == "stream") {
            var sql = `select * from project where stream LIKE concat('%','${searchValue}', '%') and is_delete = 'false'`;

        }


        db.query(sql, function(err, result) {
            if (err) throw err;

            return res.status(200).send({ data: { projects: result }, status: true, message: "Cureent DB found" });

        })
    })

})

////////////////////////////////////////////////////////////// upload a project ///////////////////////////////////////////////////////////

router.post('/uploadproject', function(req, res) {
    var token = req.body.token
    var projectTitle = req.body.title
    var university = req.body.university
    var degree = req.body.degree
    var stream = req.body.stream
    var domain = req.body.domain
    var description = req.body.description
    var techused = req.body.techused
    var references = req.body.references
    var difficulty = req.body.difficulty
    var keywords = req.body.keywords
    var year = req.body.year
    var student_id = req.body.student_id
    var student_name = req.body.student_name
    var student_email = req.body.student_email
    var student_phone = req.body.student_phone
    var student_state = req.body.student_state
    var code = req.body.code_link
    var paper = req.body.paper_link
    var video = req.body.video_link

    jwt.verify(token, hash.secret, function(err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })


        var sql = `Insert into project (project_name, project_rating, university_name, degree, stream, domain, description, tech_used, reference, diificulty, keywords, is_delete, project_year, student_phone , student_name, student_email , student_id , student_state,code_link , paper_link ,video_link ) values ('${projectTitle}',0, '${university}', '${degree}', '${stream}', '${domain}', '${description}','${techused}', '${references}' , '${difficulty}', '${keywords}','false', '${year}', '${student_phone}', '${student_name}', '${student_email}', '${student_id}', '${student_state}', '${code}' , '${paper}', '${video}')`;
        db.query(sql, function(err, result) {
            if (err) throw err;

            return res.status(200).send({ data: {}, status: true, message: "project inserted successfully" });

        })
    })

})

////////////////////////////////////////////////////////// get top 50 projects //////////////////////////////////////////////////////////////

router.post('/gettopprojects', function(req, res) {
    var token = req.body.token
    var userid = req.body.student_id

    jwt.verify(token, hash.secret, function(err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })


        var sql = `select * from project  where is_delete = "false" order by project_rating DESC LIMIT 50`;
        db.query(sql, function(err, result) {
            if (err) throw err;

            return res.status(200).send({ data: { projects: result }, status: true, message: "projects found" });

        })
    })

})

/////////////////////////////////////////////////////// follow students //////////////////////////////////////////////////////

router.post('/followStudent', function(req, res) {
    var token = req.body.token
    var student_id = req.body.followstudentid


    jwt.verify(token, hash.secret, function(err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })

        var sql = `select * from student_user where student_id='${student_id}'`;

        db.query(sql, function(err, stu_result) {
            if (err) throw err;

            var sql2 = `select * from project where student_id ='${stu_result[0].student_id}' and is_delete = "false"`;
            db.query(sql2, function(err, pro_result) {
                if (err) throw err;
                return res.status(200).send({ data: { student_info: { stu_result }, projects: pro_result }, status: true, message: "Student details found" });

            })


        })
    })

})

////////////////////////////////////////////////////////////////// delete a project //////////////////////////////////////////////////////////////

router.post('/delete_project', function(req, res) {
    var token = req.body.token
    var project_id = req.body.projectid
    var studentid = req.body.student_id
    jwt.verify(token, hash.secret, function(err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })


        var sql = `select * from student_user where student_email='${email}'`;
        db.query(sql, function(err, result) {
            if (err) throw err;
            var sql1 = `update project set is_delete = "true" where project_id ='${project_id}' and student_id ='${result[0].student_id}'`
            db.query(sql1, function(err, new_result) {
                if (err) throw err;

                return res.send({ data: {}, status: true, message: "project deleted successfully" })
            })
        })
    })
})

///////////////////////////////////////////////////////// rate a project //////////////////////////////////////////////////////////////////////

router.post('/rate_project', function(req, res) {
    var token = req.body.token
    var project_id = req.body.projectid
    var rate = req.body.rate
    var studentid = req.body.student_id
    console.log(project_id)
    console.log(studentid)


    jwt.verify(token, hash.secret, function(err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })


        var sql = `select * from student_user where student_email='${email}'`;
        db.query(sql, function(err, result) {
            if (err) throw err;

            var sql1 = `select * from project where project_id = '${project_id}'`
            db.query(sql1, function(err, new_result) {
                if (err) throw err;
                var sql2 = `select * from rate_list where project_id = '${project_id}'`
                db.query(sql2, function(err, new2_result) {
                    if (err) throw err;
                    if (new2_result.length == 0) {
                        new_rate = parseInt(rate, 10);
                    } else {
                        new_rate = (parseInt(new_result[0].project_rating, 10) * new2_result.length + parseInt(rate, 10)) / (new2_result.length + 1);
                    }

                    var sql3 = `update project set project_rating = '${new_rate}' where project_id ='${project_id}'`
                    db.query(sql3, function(err, new3_result) {
                        if (err) throw err;

                        var sql4 = `insert into rate_list (student_id ,project_id ) values ('${studentid}','${project_id}' )`
                        db.query(sql4, function(err, new4_result) {
                            if (err) throw err;

                            return res.send({ data: {}, status: true, message: "project rated successfully" })
                        })

                    })


                })


            })
        })
    })
})



module.exports = router;