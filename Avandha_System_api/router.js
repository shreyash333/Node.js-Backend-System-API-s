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
//    var name = "Shreyash Singh";
//    var from = "sshreyash34@gmail.com";
//    var message = "This is a test mail";
//    var to = 'sshreyash34@gmail.com';
//    var smtpTransport = nodemailer.createTransport({
//        service: "Gmail",
//        auth: {
//            user: "sshreyash34@gmail.com",
//            pass: "########"
//        }
//    });
//    var mailOptions = {
//        from: from,
//        to: to,
//        subject: "Hey Shreyash this is checking mail for otp, your otp is 4696",
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

router.post('/get_otp', function (req, res) {
    console.log("working")
    var email = req.body.email
    console.log(req.body)
    if (db.state == "disconnected")
        db.connect((err) => { if (err) throw err; })


    var sql = `select * from scrap_user where user_email='${email}'`;
    db.query(sql, function (err, result) {
        if (err) throw err;
        if (result.length > 0) {
            console.log(result)
            if (String(result[0].user_password) == "null") {
                if (typeof result[0].user_password === 'string') {
                    return res.send({ data: {}, status: false, message: "User already exist" })
                }

            } else {
                return res.send({ data: {}, status: false, message: "User already exist" })
            }

        }

        var token
        var otp = Math.floor(Math.random() * 899999 + 100000)
        var sql2 = `select * from otp_data where email = '${email}';`;
        db.query(sql2, function (err, result) {
            if (err) throw err;
            if (result.length == 0) {
                var sql = `insert into otp_data (email,otp) values ('${email}','${otp}');`;

            }
            else {
                var sql = `update otp_data SET otp = '${otp}' where email = '${email}';`;
            }


            db.query(sql, function (err, result) {
                if (err) throw err;
                token = jwt.sign({ id: email }, hash.secret, {
                    expiresIn: 300 // expires in 10min
                })
                console.log(token)

                var from = "Avaandha | Team Lazy Coders";
                var message = `Greetings from Team Lazy Coders !

Welcome to Avaandha.
Thank you for registrating in Avaandha your OTP is ${otp}. 

This OTP will be valid for next 10 minutes.
        

Regards
Team Lazy Coders`;
                var to = email;
                var smtpTransport = nodemailer.createTransport({
                    service: "Gmail",
                    auth: {
                        user: "teamlazycoders@gmail.com",
                        pass: "AdiDharmYash2021"
                    }
                });
                var mailOptions = {
                    from: from,
                    to: to,
                    subject: "OTP | Avaandha | Team Lazy Coders",
                    text: message
                }
                smtpTransport.sendMail(mailOptions, function (error, response) {
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
router.get('/about', function (req, res) {
    res.send('About this wiki');
})

///////////////////////////////////////////////////////// verify OTp /////////////////////////////////////////////////////////////////////

router.post('/verify_otp', function (req, res) {
    var token = req.body.token
    var otp = req.body.otp

    if (db.state == "disconnected")
        db.connect((err) => { if (err) throw err; })


    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) return res.status(500).send({ data: {}, status: false, message: "Verification failed" });

        var email = decoded.id

        sql = `select * from otp_data where email='${email}' and otp='${otp}'`

        db.query(sql, function (err, result) {
            if (err) throw err;
            if (result.length == 0) {
                res.status(500).send({ data: {}, status: false, message: "OTP Incorrect" });
            }
            else {
                var token1 = jwt.sign({ id: email }, hash.secret, {
                    expiresIn: 864000 // expires in 10 days
                })

                sql = `select * from otp_data where email='${email}' and otp='${otp}'`

                db.query(sql, function (err, result) {
                    if (err) throw err;

                    if (result.length > 0) {
                        sql1 = `select * from scrap_user where user_email='${email}'`;


                        db.query(sql1, function (err, newresult) {
                            if (err) throw err;
                            if (newresult.length == 0) {
                                sql2 = `insert into scrap_user (user_email) values('${email}')`;
                                db.query(sql2, function (err, newresult) {
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

router.post('/login', function (req, res) {
    var email = req.body.email
    var password = req.body.password
    var usertype = req.body.usertype

    if (db.state == "disconnected")
        db.connect((err) => { if (err) throw err; })

    var sql = `select * from scrap_user where user_email='${email}'`

    db.query(sql, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {
            var passwordIsValid = String(result[0].user_password) == password ? true : false;
            if (passwordIsValid == false) {
                return res.status(200).send({ data: {}, status: false, message: "Password is inncorrect" });
            }
            else {
                if (usertype == result[0].user_type) {
                    var token1 = jwt.sign({ id: email }, hash.secret, {
                        expiresIn: 864000 // expires in 10 days
                    })
                    return res.status(200).send({ data: { user_info: result, jwttoken: token1 }, status: true, message: "User found" });

                } else {
                    return res.status(200).send({ data: { user_info: result, jwttoken: token1 }, status: true, message: "Wrong Usertype Selected" });
                }

            }

        }
        else {
            res.status(200).send({ data: {}, status: false, message: "User does not exist" });
        }
        console.log(result)
        res.send({ data: {}, status: false, message: "API Failed" })
    })
})

////////////////////////////////////////////////////////// Forget Password //////////////////////////////////////////////////

router.post('/forget_password', function (req, res) {
    var email = req.body.email


    if (db.state == "disconnected")
        db.connect((err) => { if (err) throw err; })

    var sql = `select * from scrap_user where user_email='${email}'`

    db.query(sql, function (err, result) {
        if (err) throw err;
        console.log(result)
        console.log(result.length)
        if (result.length > 0) {

            var from = "Avaandha | Team Lazy Coders";
            var message = `Greetings from Team Lazy Coders !

Welcome to Avaandha.
Your registered credentials is :
Email - ${email}
User type - ${result[0].user_type}
Password - ${result[0].user_password}

Please do remember!
        
Regards
Team Lazy Coders`;
            var to = email;
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "teamlazycoders@gmail.com",
                    pass: "AdiDharmYash2021"
                }
            });
            var mailOptions = {
                from: from,
                to: to,
                subject: "Forget Password | Avaandha | Team Lazy Coders",
                text: message
            }
            smtpTransport.sendMail(mailOptions, function (error, response) {
                if (error) {
                    console.log(error);
                } else {
                    return res.send({ data: {}, status: true, message: "Mail Send" })
                }
            });

        }
        else {
            return res.status(200).send({ data: {}, status: false, message: "User does not exist" });
        }

        //res.send({data:{} ,status:false, message:"API Failed"})
    })
})


///////////////////////////////////////////////////////////////// Add user details /////////////////////////////////////////////////////////


router.post('/user_data', function (req, res) {
    var token = req.body.token
    var name = req.body.full_name
    var usertype = req.body.user_type
    var phone = req.body.phone_no
    var state = req.body.state
    var district = req.body.user_district
    var address = req.body.user_address
    //var password= bcrypt.hashSync(req.body.password, 8);
    var password = req.body.password;


    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })

        var sql = `update scrap_user set user_rating= 0,user_name='${name}',user_type ='${usertype}', user_phone='${phone}',user_password='${password}',user_state='${state}',user_district='${district}',user_address='${address}'  where user_email='${email}'`

        db.query(sql, function (err, result) {
            if (err) throw err;
            var sql1 = `select * from scrap_user where user_email='${email}'`
            db.query(sql1, function (err, newresult) {
                if (err) throw err;
                res.send({ data: { user_info: newresult }, status: true, message: "Data inserted successfully" })
            })

        })
    })
})


/////////////////////////////////////////////////////////////////// update user data ///////////////////////////////////////////////////////////////////////

router.post('/update_data', function (req, res) {
    var token = req.body.token
    var name = req.body.full_name
    var phone = req.body.phone_no
    var state = req.body.state
    var district = req.body.user_district
    var address = req.body.user_address
    //var university=req.body.university_name
    //var password= bcrypt.hashSync(req.body.password, 8);



    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })

        var sql = `update scrap_user set user_name='${name}', user_phone='${phone}',user_state='${state}',user_district='${district}',user_address='${address}' where user_email='${email}'`

        db.query(sql, function (err, result) {
            if (err) throw err;
            res.send({ data: {}, status: true, message: "Data updated successfully" })


        })
    })
})


////////////////////////////////////////////////////////////// get currentDB ////////////////////////////////////////////////////////////////

router.post('/getCurrentDB', function (req, res) {
    var token = req.body.token
    var userid = req.body.user_id
    var usertype = req.body.user_type

    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })

        var sql = `select * from scrap_user where user_email='${email}'`;

        db.query(sql, function (err, user_result) {
            if (err) throw err;

            if (usertype == "customer") {
                var sql2 = `select * from scrap_user where user_type = "store" order by user_rating DESC LIMIT 10`;
                db.query(sql2, function (err, store_result) {
                    if (err) throw err;

                    var sql3 = `select * from rate_list where rated_by = '${userid}'`;
                    db.query(sql3, function (err, rate_result) {
                        if (err) throw err;


                        return res.status(200).send({ data: { user_info: user_result, rate_list: rate_result, topshow: store_result, rejected: [] }, status: true, message: "Cureent DB found" });

                    })

                })

            } else if (usertype == "store") {
                var sql2 = `select * from scrap_user where user_type = "company" order by user_rating DESC LIMIT 10`;
                db.query(sql2, function (err, company_result) {
                    if (err) throw err;

                    var sql3 = `select * from rate_list where rated_by = '${userid}'`;
                    db.query(sql3, function (err, rate_result) {
                        if (err) throw err;

                        var sql4 = `select * from rejected_order where user_id = '${user_result[0].user_id}'`;
                        db.query(sql4, function (err, rejected_result) {
                            if (err) throw err;


                            return res.status(200).send({ data: { user_info: user_result, rate_list: rate_result, topshow: company_result, rejected_result: rejected_result }, status: true, message: "Cureent DB found" });

                        })


                    })

                })

            } else if (usertype == "company") {
                var sql2 = `select * from scrap_user where user_type = "store" order by user_rating DESC LIMIT 10`;
                db.query(sql2, function (err, store_result) {
                    if (err) throw err;

                    var sql3 = `select * from rate_list where rated_by = '${userid}'`;
                    db.query(sql3, function (err, rate_result) {
                        if (err) throw err;

                        var sql4 = `select * from rejected_order where user_id = '${user_result[0].user_id}'`;
                        db.query(sql4, function (err, rejected_result) {
                            if (err) throw err;


                            return res.status(200).send({ data: { user_info: user_result, rate_list: [], topshow: store_result, rejected_result: rejected_result }, status: true, message: "Cureent DB found" });

                        })


                    })

                })

            }
        })
    })

}
)


/////////////////////////////////////////////////////////////////// get my Send Orders //////////////////////////////////////////////////////////////////////////////

router.post('/getMySendOrders', function (req, res) {
    var token = req.body.token
    var userid = req.body.userid
    var usertype = req.body.usertype

    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })

        var sql = `select * from scrap_user where user_email='${email}'`;

        db.query(sql, function (err, user_result) {
            if (err) throw err;
            var sql1 = `select * from orderList where sender_id ='${user_result[0].user_id}' and is_delete = "false"`;
            db.query(sql1, function (err, order_result) {
                if (err) throw err;
                return res.status(200).send({ data: { orders: order_result }, status: true, message: "orders found" });
            })
        })
    })

}
)

////////////////////////////////////////////////////////////////// Get Receive Order //////////////////////////////////////////////////////////

router.post('/getReceiveOrders', function (req, res) {
    var token = req.body.token
    var userid = req.body.userid
    var usertype = req.body.usertype

    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })

        var sql = `select * from scrap_user where user_email='${email}'`;

        db.query(sql, function (err, user_result) {
            if (err) throw err;

            if (usertype == "customer") {
                return res.status(200).send({ data: { new_orders: [], accepted_orders: [], completed_orders: [] }, status: true, message: "orders found" });

            } else if (usertype == "store") {
                var sql1 = `select * from orderList where is_delete = "false" and order_status = "notAccepted"  and sender_id != '${userid}' and  sender_state='${user_result[0].user_state}' and sender_district='${user_result[0].user_district}'`;
                db.query(sql1, function (err, neworder_result) {
                    if (err) throw err;

                    var sql2 = `select * from orderList where accepter_id='${user_result[0].user_id}' and is_delete = "false" and order_status = 'Accepted'`;
                    db.query(sql2, function (err, acceptedorder_result) {
                        if (err) throw err;

                        var sql3 = `select * from orderList where accepter_id='${user_result[0].user_id}' and is_delete = "false" and order_status = 'completed'`;
                        db.query(sql3, function (err, completeorder_result) {
                            if (err) throw err;

                            return res.status(200).send({ data: { new_orders: neworder_result, accepted_orders: acceptedorder_result, completed_orders: completeorder_result }, status: true, message: "orders found" });
                        })

                    })

                })

            } else if (usertype == "company") {

                var sql1 = `select * from orderList where is_delete = "false" and order_status = "notAccepted" and sender_type='store' or sender_type='company'`;
                db.query(sql1, function (err, neworder_result) {
                    if (err) throw err;

                    var sql2 = `select * from orderList where accepter_id='${user_result[0].user_id}' and is_delete = "false" and order_status = 'Accepted'`;
                    db.query(sql2, function (err, acceptedorder_result) {
                        if (err) throw err;

                        var sql3 = `select * from orderList where accepter_id='${user_result[0].user_id}' and is_delete = "false" and order_status = 'completed'`;
                        db.query(sql3, function (err, completeorder_result) {
                            if (err) throw err;

                            return res.status(200).send({ data: { new_orders: neworder_result, accepted_orders: acceptedorder_result, completed_orders: completeorder_result }, status: true, message: "orders found" });
                        })

                    })

                })

            }

        })
    })

}
)


////////////////////////////////////////////////////////////// Add a Order ///////////////////////////////////////////////////////////

router.post('/addneworder', function (req, res) {
    var token = req.body.token
    var orderType = req.body.orderType
    var senderId = req.body.senderId
    var senderRating = req.body.senderRating
    var sendername = req.body.sendername
    var sendertype = req.body.sendertype
    var senderemail = req.body.senderemail
    var senderphone = req.body.senderphone
    var senderstate = req.body.senderstate
    var senderdistrict = req.body.senderdistrict
    var senderaddress = req.body.senderaddress
    //var accepterId=req.body.accepterId
    //var accepterRating=req.body.accepterRating
    //var acceptername=req.body.acceptername
    //var acceptertype=req.body.acceptertype
    //var accepteremail=req.body.accepteremail
    //var accepterphone=req.body.accepterphone
    //var accepterstate=req.body.accepterstate
    //var accepterdistrict=req.body.accepterdistrict
    //var accepteraddress=req.body.accepteraddress
    var ordercategory = req.body.ordercategory
    var expectedcost = req.body.expectedcost
    var quatitiy = req.body.quatitiy
    var message = req.body.message
    //var orderstatus=req.body.orderstatus


    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })


        var sql = `Insert into orderList (order_type, sender_id, sender_rating, sender_name, sender_type, sender_email, sender_phone, sender_state, sender_district, sender_address, accepter_id, accepter_rating, accepter_name, accepter_type , accepter_email, accepter_phone , accepter_state , accepter_district, accepter_address,order_category , expected_cost ,quatitiy, message, order_status, is_delete ) values ('${orderType}','${senderId}', '${senderRating}', '${sendername}','${sendertype}','${senderemail}','${senderphone}','${senderstate}','${senderdistrict}','${senderaddress}','null','null','null','null','null', 'null', 'null', 'null','null', '${ordercategory}' , '${expectedcost}', '${quatitiy}','${message}','notAccepted','false')`;
        db.query(sql, function (err, result) {
            if (err) throw err;

            return res.status(200).send({ data: {}, status: true, message: "Order uploaded Successfully" });

        })
    })

}
)

//////////////////////////////////////////////////////////// Accept a Order //////////////////////////////////////////////////////////////

router.post('/acceptOrder', function (req, res) {
    var token = req.body.token
    var orderid = req.body.orderid
    var accepterId = req.body.accepterId
    var accepterRating = req.body.accepterRating
    var acceptername = req.body.acceptername
    var acceptertype = req.body.acceptertype
    var accepteremail = req.body.accepteremail
    var accepterphone = req.body.accepterphone
    var accepterstate = req.body.accepterstate
    var accepterdistrict = req.body.accepterdistrict
    var accepteraddress = req.body.accepteraddress

    console.log("API HIt")

    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })


        var sql = `select * from orderList where order_id = '${orderid}' and is_delete = "false"`;
        db.query(sql, function (err, result) {
            if (err) throw err;
            console.log(result)
            console.log(result[0].sender_type)
            console.log(acceptertype)
            if (result[0].sender_type == "customer" && acceptertype == "store") {
                console.log("IF ELSE CASE 1")

                var sql2 = `update orderList set accepter_id='${accepterId}', accepter_rating='${accepterRating}', accepter_name='${acceptername}', accepter_type='${acceptertype}' , accepter_email='${accepteremail}', accepter_phone='${accepterphone}' , accepter_state='${accepterstate}' , accepter_district='${accepterdistrict}', accepter_address='${accepteraddress}',order_status='Accepted' where order_id='${orderid}'`;
                db.query(sql2, function (err, update_result) {
                    if (err) throw err;

                    var checksql = `select * from customer_connection where user_id = '${result[0].sender_id}' and con_id = '${accepterId}'`;
                    db.query(checksql, function (err, con_result) {
                        if (err) throw err;
                        if (con_result.length > 0) {
                            var checknewsql = `select * from store_connection where user_id = '${accepterId}' and con_id = '${result[0].sender_id}'`;
                            db.query(checknewsql, function (err, con_new_result) {
                                if (err) throw err;
                                if (con_new_result.length > 0) {
                                    return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                } else {
                                    var sql4 = `Insert into store_connection (user_id, relation_type, con_id, con_name, con_type, con_email, con_phone, con_state, con_district, con_address ) values ('${accepterId}','company-company', '${result[0].sender_id}', '${result[0].sender_name}','${result[0].sender_type}','${result[0].sender_email}','${result[0].sender_phone}','${result[0].sender_state}','${result[0].sender_district}', '${result[0].sender_address}')`;
                                    db.query(sql4, function (err, update_result) {
                                        if (err) throw err;

                                        return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                    })
                                }
                            })

                        } else {

                            var sql3 = `Insert into customer_connection (user_id, relation_type, con_id, con_name, con_type, con_email, con_phone, con_state, con_district, con_address ) values ('${result[0].sender_id}','customer-store', '${accepterId}', '${acceptername}','${acceptertype}','${accepteremail}','${accepterphone}','${accepterstate}','${accepterdistrict}', '${accepteraddress}')`;
                            db.query(sql3, function (err, update_result) {
                                if (err) throw err;

                                var checknewsql = `select * from store_connection where user_id = '${accepterId}' and con_id = '${result[0].sender_id}'`;
                                db.query(checknewsql, function (err, con_new_result) {
                                    if (err) throw err;
                                    if (con_new_result.length > 0) {
                                        return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                    } else {
                                        var sql4 = `Insert into store_connection (user_id, relation_type, con_id, con_name, con_type, con_email, con_phone, con_state, con_district, con_address ) values ('${accepterId}','company-company', '${result[0].sender_id}', '${result[0].sender_name}','${result[0].sender_type}','${result[0].sender_email}','${result[0].sender_phone}','${result[0].sender_state}','${result[0].sender_district}', '${result[0].sender_address}')`;
                                        db.query(sql4, function (err, update_result) {
                                            if (err) throw err;

                                            return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                        })
                                    }
                                })



                            })

                        }

                    })



                })


            } else if (result[0].sender_type == "store" && acceptertype == "store") {
                console.log("IF ELSE CASE 2")

                var sql2 = `update orderList set accepter_id='${accepterId}', accepter_rating='${accepterRating}', accepter_name='${acceptername}', accepter_type='${acceptertype}' , accepter_email='${accepteremail}', accepter_phone='${accepterphone}' , accepter_state='${accepterstate}' , accepter_district='${accepterdistrict}', accepter_address='${accepteraddress}',order_status='Accepted' where order_id='${orderid}'`;
                db.query(sql2, function (err, update_result) {
                    if (err) throw err;

                    var checksql = `select * from store_connection where user_id = '${result[0].sender_id}' and con_id = '${accepterId}'`;
                    db.query(checksql, function (err, con_result) {
                        if (err) throw err;
                        if (con_resul.length > 0) {
                            var checknewsql = `select * from store_connection where user_id = '${accepterId}' and con_id = '${result[0].sender_id}'`;
                            db.query(checknewsql, function (err, con_new_result) {
                                if (err) throw err;
                                if (con_new_result.length > 0) {
                                    return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                } else {

                                    var sql4 = `Insert into store_connection (user_id, relation_type, con_id, con_name, con_type, con_email, con_phone, con_state, con_district, con_address ) values ('${accepterId}','company-company', '${result[0].sender_id}', '${result[0].sender_name}','${result[0].sender_type}','${result[0].sender_email}','${result[0].sender_phone}','${result[0].sender_state}','${result[0].sender_district}', '${result[0].sender_address}')`;
                                    db.query(sql4, function (err, update_result) {
                                        if (err) throw err;

                                        return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                    })

                                }
                            })

                        } else {
                            var sql3 = `Insert into store_connection (user_id, relation_type, con_id, con_name, con_type, con_email, con_phone, con_state, con_district, con_address ) values ('${result[0].sender_id}','store-store', '${accepterId}', '${acceptername}','${acceptertype}','${accepteremail}','${accepterphone}','${accepterstate}','${accepterdistrict}', '${accepteraddress}')`;
                            db.query(sql3, function (err, update_result) {
                                if (err) throw err;
                                var checknewsql = `select * from store_connection where user_id = '${accepterId}' and con_id = '${result[0].sender_id}'`;
                                db.query(checknewsql, function (err, con_new_result) {
                                    if (err) throw err;
                                    if (con_new_result.length > 0) {
                                        return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                    } else {

                                        var sql4 = `Insert into store_connection (user_id, relation_type, con_id, con_name, con_type, con_email, con_phone, con_state, con_district, con_address ) values ('${accepterId}','company-company', '${result[0].sender_id}', '${result[0].sender_name}','${result[0].sender_type}','${result[0].sender_email}','${result[0].sender_phone}','${result[0].sender_state}','${result[0].sender_district}', '${result[0].sender_address}')`;
                                        db.query(sql4, function (err, update_result) {
                                            if (err) throw err;

                                            return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                        })

                                    }
                                })



                            })

                        }

                    })



                })

            } else if (result[0].sender_type == "company" && acceptertype == "store") {
                console.log("IF ELSE CASE 3")
                var sql2 = `update orderList set accepter_id='${accepterId}', accepter_rating='${accepterRating}', accepter_name='${acceptername}', accepter_type='${acceptertype}' , accepter_email='${accepteremail}', accepter_phone='${accepterphone}' , accepter_state='${accepterstate}' , accepter_district='${accepterdistrict}', accepter_address='${accepteraddress}',order_status='Accepted' where order_id='${orderid}'`;
                db.query(sql2, function (err, update_result) {
                    if (err) throw err;

                    var checksql = `select * from company_connection where user_id = '${result[0].sender_id}' and con_id = '${accepterId}'`;
                    db.query(checksql, function (err, con_result) {
                        if (err) throw err;
                        if (con_result.length > 0) {

                            var checknewsql = `select * from store_connection where user_id = '${accepterId}' and con_id = '${result[0].sender_id}'`;
                            db.query(checknewsql, function (err, con_new_result) {
                                if (err) throw err;
                                if (con_new_result.length > 0) {
                                    return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                }
                                else {
                                    var sql4 = `Insert into store_connection (user_id, relation_type, con_id, con_name, con_type, con_email, con_phone, con_state, con_district, con_address ) values ('${accepterId}','company-company', '${result[0].sender_id}', '${result[0].sender_name}','${result[0].sender_type}','${result[0].sender_email}','${result[0].sender_phone}','${result[0].sender_state}','${result[0].sender_district}', '${result[0].sender_address}')`;
                                    db.query(sql4, function (err, update_result) {
                                        if (err) throw err;

                                        return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                    })

                                }
                            })



                        } else {
                            var sql3 = `Insert into company_connection (user_id, relation_type, con_id, con_name, con_type, con_email, con_phone, con_state, con_district, con_address ) values ('${result[0].sender_id}','company-store', '${accepterId}', '${acceptername}','${acceptertype}','${accepteremail}','${accepterphone}','${accepterstate}','${accepterdistrict}', '${accepteraddress}')`;
                            db.query(sql3, function (err, update_result) {
                                if (err) throw err;

                                var checknewsql = `select * from store_connection where user_id = '${accepterId}' and con_id = '${result[0].sender_id}'`;
                                db.query(checknewsql, function (err, con_new_result) {
                                    if (err) throw err;
                                    if (con_new_result.length > 0) {
                                        return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                    }
                                    else {
                                        var sql4 = `Insert into store_connection (user_id, relation_type, con_id, con_name, con_type, con_email, con_phone, con_state, con_district, con_address ) values ('${accepterId}','company-company', '${result[0].sender_id}', '${result[0].sender_name}','${result[0].sender_type}','${result[0].sender_email}','${result[0].sender_phone}','${result[0].sender_state}','${result[0].sender_district}', '${result[0].sender_address}')`;
                                        db.query(sql4, function (err, update_result) {
                                            if (err) throw err;

                                            return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                        })

                                    }
                                })



                            })

                        }
                    })



                })

            } else if (result[0].sender_type == "store" && acceptertype == "company") {
                console.log("IF ELSE CASE 4")
                var sql2 = `update orderList set accepter_id='${accepterId}', accepter_rating='${accepterRating}', accepter_name='${acceptername}', accepter_type='${acceptertype}' , accepter_email='${accepteremail}', accepter_phone='${accepterphone}' , accepter_state='${accepterstate}' , accepter_district='${accepterdistrict}', accepter_address='${accepteraddress}',order_status='Accepted' where order_id='${orderid}'`;
                db.query(sql2, function (err, update_result) {
                    if (err) throw err;

                    var checksql = `select * from store_connection where user_id = '${result[0].sender_id}' and con_id = '${accepterId}'`;
                    db.query(checksql, function (err, con_result) {
                        if (err) throw err;
                        if (con_result.length > 0) {
                            var checknewsql = `select * from company_connection where user_id = '${accepterId}' and con_id = '${result[0].sender_id}'`;
                            db.query(checknewsql, function (err, con_new_result) {
                                if (err) throw err;
                                if (con_new_result.length > 0) {
                                    return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                } else {
                                    var sql4 = `Insert into company_connection (user_id, relation_type, con_id, con_name, con_type, con_email, con_phone, con_state, con_district, con_address ) values ('${accepterId}','company-company', '${result[0].sender_id}', '${result[0].sender_name}','${result[0].sender_type}','${result[0].sender_email}','${result[0].sender_phone}','${result[0].sender_state}','${result[0].sender_district}', '${result[0].sender_address}')`;
                                    db.query(sql4, function (err, update_result) {
                                        if (err) throw err;

                                        return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                    })

                                }
                            })

                        } else {

                            var sql3 = `Insert into store_connection (user_id, relation_type, con_id, con_name, con_type, con_email, con_phone, con_state, con_district, con_address ) values ('${result[0].sender_id}','store-company', '${accepterId}', '${acceptername}','${acceptertype}','${accepteremail}','${accepterphone}','${accepterstate}','${accepterdistrict}', '${accepteraddress}')`;
                            db.query(sql3, function (err, update_result) {
                                if (err) throw err;

                                var checknewsql = `select * from company_connection where user_id = '${accepterId}' and con_id = '${result[0].sender_id}'`;
                                db.query(checknewsql, function (err, con_new_result) {
                                    if (err) throw err;
                                    if (con_new_result.length > 0) {
                                        return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                    } else {
                                        var sql4 = `Insert into company_connection (user_id, relation_type, con_id, con_name, con_type, con_email, con_phone, con_state, con_district, con_address ) values ('${accepterId}','company-company', '${result[0].sender_id}', '${result[0].sender_name}','${result[0].sender_type}','${result[0].sender_email}','${result[0].sender_phone}','${result[0].sender_state}','${result[0].sender_district}', '${result[0].sender_address}')`;
                                        db.query(sql4, function (err, update_result) {
                                            if (err) throw err;

                                            return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                        })

                                    }
                                })



                            })

                        }
                    })



                })


            } else if (result[0].sender_type == "company" && acceptertype == "company") {
                console.log("IF ELSE CASE 5")

                var sql2 = `update orderList set accepter_id='${accepterId}', accepter_rating='${accepterRating}', accepter_name='${acceptername}', accepter_type='${acceptertype}' , accepter_email='${accepteremail}', accepter_phone='${accepterphone}' , accepter_state='${accepterstate}' , accepter_district='${accepterdistrict}', accepter_address='${accepteraddress}',order_status='Accepted' where order_id='${orderid}'`;
                db.query(sql2, function (err, update_result) {
                    if (err) throw err;

                    var checksql = `select * from company_connection where user_id = '${result[0].sender_id}' and con_id = '${accepterId}'`;
                    db.query(checksql, function (err, con_result) {
                        if (err) throw err;
                        if (con_result.length > 0) {
                            var checknewsql = `select * from company_connection where user_id = '${accepterId}' and con_id = '${result[0].sender_id}'`;
                            db.query(checknewsql, function (err, con_new_result) {
                                if (err) throw err;
                                if (con_new_result.length > 0) {
                                    return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                } else {
                                    var sql4 = `Insert into company_connection (user_id, relation_type, con_id, con_name, con_type, con_email, con_phone, con_state, con_district, con_address ) values ('${accepterId}','company-company', '${result[0].sender_id}', '${result[0].sender_name}','${result[0].sender_type}','${result[0].sender_email}','${result[0].sender_phone}','${result[0].sender_state}','${result[0].sender_district}', '${result[0].sender_address}')`;
                                    db.query(sql4, function (err, update_result) {
                                        if (err) throw err;

                                        return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                    })

                                }
                            })

                        } else {
                            var sql3 = `Insert into company_connection (user_id, relation_type, con_id, con_name, con_type, con_email, con_phone, con_state, con_district, con_address ) values ('${result[0].sender_id}','company-company', '${accepterId}', '${acceptername}','${acceptertype}','${accepteremail}','${accepterphone}','${accepterstate}','${accepterdistrict}', '${accepteraddress}')`;
                            db.query(sql3, function (err, update_result) {
                                if (err) throw err;

                                var checknewsql = `select * from company_connection where user_id = '${accepterId}' and con_id = '${result[0].sender_id}'`;
                                db.query(checknewsql, function (err, con_new_result) {
                                    if (err) throw err;
                                    if (con_new_result.length > 0) {
                                        return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                    } else {
                                        var sql4 = `Insert into company_connection (user_id, relation_type, con_id, con_name, con_type, con_email, con_phone, con_state, con_district, con_address ) values ('${accepterId}','company-company', '${result[0].sender_id}', '${result[0].sender_name}','${result[0].sender_type}','${result[0].sender_email}','${result[0].sender_phone}','${result[0].sender_state}','${result[0].sender_district}', '${result[0].sender_address}')`;
                                        db.query(sql4, function (err, update_result) {
                                            if (err) throw err;

                                            return res.status(200).send({ data: {}, status: true, message: "Order Accepted Successfully" });

                                        })

                                    }
                                })



                            })

                        }
                    })




                })

            }



        })
    })

}
)

///////////////////////////////////////////////////////// Reject a order ////////////////////////////////////////////////////////////

router.post('/rejectOrder', function (req, res) {
    var token = req.body.token
    var userid = req.body.userid
    var orderid = req.body.orderid

    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })


        var sql = `Insert into rejected_order (user_id, order_id) values ('${userid}','${orderid}')`;
        db.query(sql, function (err, result) {
            if (err) throw err;

            var sql1 = `select * from rejected_order where order_id = '${orderid}'`;
            db.query(sql1, function (err, reject_result) {
                if (err) throw err;

                var sql2 = `select * from orderList where order_id = '${orderid}'`;
                db.query(sql2, function (err, order_result) {
                    if (err) throw err;

                    var sql3 = `select * from scrap_user where user_type = "store" and user_state = '${order_result[0].sender_state}' and user_district = '${order_result[0].sender_district}'`;
                    db.query(sql3, function (err, user_result) {
                        if (err) throw err;
                        console.log(reject_result.length)
                        console.log(user_result.length)
                        if (reject_result.length == user_result.length) {

                            var sql4 = `update orderList set order_status='Rejected' where order_id='${orderid}'`;
                            db.query(sql4, function (err, noneresult) {
                                if (err) throw err;
                                return res.status(200).send({ data: { }, status: true, message: "Order Rejected Successfully and all store rejected" });

                            })

                        }else{
                            return res.status(200).send({ data: { }, status: true, message: "Order Rejected Successfully" });

                        }

                        





                    })


                })

             

            })



        })
    })

}
)

////////////////////////////////////////////////////// delete a order //////////////////////////////////////////////////////////////

router.post('/deleteOrder', function (req, res) {
    var token = req.body.token
    var userid = req.body.userid
    var orderid = req.body.orderid

    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })


        var sql = `select * from orderList  where order_id = '${userid}' and sender_id = '${orderid}'`;
        db.query(sql, function (err, result) {
            if (err) throw err;

            var sql1 =`update orderList set is_delete='true' where order_id='${orderid}'`;
        db.query(sql1, function (err, new_result) {
            if (err) throw err;

            return res.status(200).send({ data: {}, status: true, message: "Order Deleted Successfully" });

        })

            

        })
    })

}
)

//////////////////////////////////////////////////// complete a order /////////////////////////////////////////////////////////////

router.post('/completeorder', function (req, res) {
    var token = req.body.token
    var userid = req.body.userid
    var orderid = req.body.orderid

    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })


        var sql = `select * from orderList  where order_id = '${userid}' and sender_id = '${orderid}'`;
        db.query(sql, function (err, result) {
            if (err) throw err;

            var sql1 =`update orderList set order_status='completed' where order_id='${orderid}'`;
        db.query(sql1, function (err, new_result) {
            if (err) throw err;

            return res.status(200).send({ data: {}, status: true, message: "Order completed Successfully" });

        })

            

        })
    })

}
)

//////////////////////////////////////////////////// get all stores ///////////////////////////////////////////////////////////////////////


router.post('/getAllStores', function (req, res) {
    var token = req.body.token
    var userid = req.body.userid

    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })


        var sql = `select * from scrap_user  where user_type = "store" order by user_rating DESC`;
        db.query(sql, function (err, result) {
            if (err) throw err;

            return res.status(200).send({ data: { stores: result }, status: true, message: "Store found" });

        })
    })

}
)

///////////////////////////////////////////////////////////// get all companies ///////////////////////////////////////////////////////

router.post('/getAllCompanies', function (req, res) {
    var token = req.body.token
    var userid = req.body.userid

    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })


        var sql = `select * from scrap_user  where user_type = "company" order by user_rating DESC`;
        db.query(sql, function (err, result) {
            if (err) throw err;

            return res.status(200).send({ data: { company: result }, status: true, message: "Store found" });

        })
    })

}
)

//////////////////////////////////////////////////// get my stores customer //////////////////////////////////////////////

router.post('/getMyStoresCustomer', function (req, res) {
    var token = req.body.token
    var userid = req.body.userid

    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })


        var sql = `select * from customer_connection  where user_id = '${userid}' and con_type = "store"`;
        db.query(sql, function (err, result) {
            if (err) throw err;

            return res.status(200).send({ data: { company: result }, status: true, message: "Store found" });

        })
    })

}
)

//////////////////////////////////////////////////// get my customer stores //////////////////////////////////////////////

router.post('/getMyCustomerStores', function (req, res) {
    var token = req.body.token
    var userid = req.body.userid

    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })


        var sql = `select * from store_connection where user_id = '${userid}' and con_type = "customer"`;
        db.query(sql, function (err, result) {
            if (err) throw err;

            return res.status(200).send({ data: { company: result }, status: true, message: "Store found" });

        })
    })

}
)


//////////////////////////////////////////////////// get my company Store //////////////////////////////////////////////

router.post('/getMyCompanyStore', function (req, res) {
    var token = req.body.token
    var userid = req.body.userid

    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })


        var sql = `select * from store_connection where user_id = '${userid}' and con_type = "company"`;
        db.query(sql, function (err, result) {
            if (err) throw err;

            return res.status(200).send({ data: { company: result }, status: true, message: "Store found" });

        })
    })

}
)



/////////////////////////////////////////////////////// get my store company ////////////////////////////////////////////////

router.post('/getMyStoreCompany', function (req, res) {
    var token = req.body.token
    var userid = req.body.userid

    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })


        var sql = `select * from company_connection where user_id = '${userid}' and con_type = "store"`;
        db.query(sql, function (err, result) {
            if (err) throw err;

            return res.status(200).send({ data: { company: result }, status: true, message: "Store found" });

        })
    })

}
)


///////////////////////////////////////////////////////// rate a user //////////////////////////////////////////////////////////////////////

router.post('/rateuser', function (req, res) {
    var token = req.body.token
    var ratedby = req.body.ratedbyid
    var rate = req.body.rate
    var ratedto = req.body.ratedtoid
    
    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })


        var sql = `select * from scrap_user where user_id='${ratedby}'`;
        db.query(sql, function (err, result) {
            if (err) throw err;

            var sql1 = `select * from scrap_user where user_id = '${ratedto}'`
            db.query(sql1, function (err, new_result) {
                console.log(result)
                if (err) throw err;
                var sql2 = `select * from rate_list where rated_to = '${ratedto}'`
                db.query(sql2, function (err, new2_result) {
                    console.log(new2_result)
                    if (err) throw err;
                    if (new2_result.length == 0) {
                        new_rate = parseInt(rate, 10);
                    } else {
                        new_rate = (parseInt(new_result[0].user_rating, 10) * new2_result.length + parseInt(rate, 10)) / (new2_result.length + 1);
                    }
                    console.log(new_rate)

                    var sql3 = `update scrap_user set user_rating = '${new_rate}' where user_id ='${ratedto}'`
                    db.query(sql3, function (err, new3_result) {
                        if (err) throw err;

                        var sql4 = `insert into rate_list (rated_by ,rated_to,user_rating ) values ('${ratedby}','${ratedto}','${rate}' )`
                        db.query(sql4, function (err, new4_result) {
                            if (err) throw err;

                            return res.send({ data: {}, status: true, message: "User rated successfully" })
                        })

                    })


                })


            })
        })
    })
})

//////////////////////////////////////////////////// get Recommendation /////////////////////////////////////////////////////////////


router.post('/getrecommendation', function (req, res) {
    var token = req.body.token
    var userid = req.body.userid
    var category = req.body.category

    jwt.verify(token, hash.secret, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(500).send({ data: {}, status: false, message: "jwt Token Expired/ Data improper" });
        }
        var email = decoded.id

        if (db.state == "disconnected")
            db.connect((err) => { if (err) throw err; })

        var sql = `select * from video_recommendation where category='${category}'`;

        db.query(sql, function (err, video_result) {
            if (err) throw err;
            var sql1 = `select * from blog_recommendation where category ='${category}'`;
            db.query(sql1, function (err, blog_result) {
                if (err) throw err;
                return res.status(200).send({ data: { video: video_result, blog : blog_result }, status: true, message: "Recommendation found" });
            })
        })
    })

}
)



module.exports = router;