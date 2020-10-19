let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let crypto = require('crypto');
const axios = require("axios")
let FormData = require("form-data");

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
const {v4: uuidv4} = require('uuid');


let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);


function getUTCDate() {
    let now = new Date();
    let now_utc = now.getUTCFullYear() + '-' + appendZero(now.getUTCMonth() + 1) + '-' + appendZero(now.getUTCDate()) + 'T' + appendZero(now.getUTCHours()) + ':' + appendZero(now.getUTCMinutes()) + ':' + appendZero(now.getUTCSeconds()) + 'Z';
    return now_utc;
}

function appendZero(digit) {
    if (digit < 10) {
        return '0' + digit;
    } else {
        return digit;
    }
}

function generateRandom(length) {
    let result = '';
    let characters = '0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


app.use('/sign', (req, res) => {
    let signedFieldNames = 'access_key,profile_id,transaction_uuid,signed_field_names,unsigned_field_names,signed_date_time,locale,transaction_type,reference_number,amount,currency,payment_method,bill_to_forename,bill_to_surname,bill_to_email,bill_to_phone,bill_to_address_line1,bill_to_address_city,bill_to_address_state,bill_to_address_country,bill_to_address_postal_code,auth_trans_ref_no';
    let payment = {
        access_key: 'a6fcaf71650738088bad7a17be9d32e7', // codeavatar
        profile_id: 'BC56D4B8-E664-43CF-9BB6-684190EE5926', // codeavtar
        signed_field_names: signedFieldNames,
        unsigned_field_names: 'card_type,card_number,card_expiry_date',
        locale: 'en-us',
        transaction_uuid: uuidv4().toString(),
        signed_date_time: getUTCDate(), //"2017-02-28T14:38:33Z",
        transaction_type: 'sale',
        reference_number: Math.floor((Math.random() * 10000) + 1).toString(),
        amount: '1.00',
        currency: 'USD',
        payment_method: 'card',
        bill_to_forename: 'N/A',
        bill_to_surname: 'N/A',
        bill_to_email: 'ali.rajim12@gmail.com',
        bill_to_phone: '9849428177',
        bill_to_address_line1: 'N/A',
        bill_to_address_city: 'N/A',
        bill_to_address_state: 'N/A',
        bill_to_address_country: 'NP',
        bill_to_address_postal_code: 'N/A',
        card_type: '001',
        card_number: '',
        card_expiry_date: '',
        signature: '',
        auth_trans_ref_no: generateRandom(20)
    };

    let signedFields = signedFieldNames.split(",");
    let fieldValues = [];
    signedFields.forEach((item) => {
        fieldValues.push(item + "=" + req.body[item]);
    });
    const hash = crypto.createHmac('sha256', 'fa4079f7996546d48263441bdeaf9985c57b51aee0344b00a814082d0c4e3368b2a47006707f4b61a9395382c0a581f49264ec3fb5e04ade810cf86e6ea02493d198fac2e6c0492f92b7bb679db3a61a5d041d0f3cf545b0a1fdd3394ee31a10f506a7a506a04f5f9d913279e5383d41dfce4c0034c841c5a7afbc34bd712e06')
        .update(fieldValues.join(","))
        .digest('base64');

    console.log(`date: ${getUTCDate()} hash:${hash}`)


    let form = new FormData();
    form.append("access_key", payment.access_key);
    form.append("profile_id", payment.profile_id);
    form.append("signed_field_names", payment.signed_field_names);
    form.append("unsigned_field_names", payment.unsigned_field_names);
    form.append("locale", payment.locale);
    form.append("transaction_uuid", payment.transaction_uuid);
    form.append("signed_date_time", payment.signed_date_time);
    form.append("transaction_type", payment.transaction_type);
    form.append("reference_number", payment.reference_number);
    form.append("amount", payment.amount);
    form.append("currency", payment.currency);
    form.append("payment_method", payment.payment_method);
    form.append("bill_to_forename", payment.bill_to_forename);
    form.append("bill_to_surname", payment.bill_to_surname);
    form.append("bill_to_email", payment.bill_to_email);
    form.append("bill_to_phone", payment.bill_to_phone);
    form.append("bill_to_address_line1", payment.bill_to_address_line1);
    form.append("bill_to_address_city", payment.bill_to_address_city);
    form.append("bill_to_address_state", payment.bill_to_address_state);
    form.append("bill_to_address_country", payment.bill_to_address_country);
    form.append("bill_to_address_postal_code", payment.bill_to_address_postal_code);
    form.append("card_type", payment.card_type);
    form.append("card_number", payment.card_number);
    form.append("card_expiry_date", payment.card_expiry_date);
    form.append("signature", hash);
    form.append("auth_trans_ref_no", payment.auth_trans_ref_no);

    console.log(`body :${JSON.stringify(payment)}`)

    // axios.interceptors.request.use(request => {
    //     console.log('Starting Request', JSON.stringify(request, null, 2))
    //     return request
    // })
    //
    // axios.interceptors.response.use(response => {
    //     console.log('Response:', JSON.stringify(response, null, 2))
    //     return response
    // })


    axios.post("https://testsecureacceptance.cybersource.com/pay", form)
        .then(response => {
                console.log(`success response ${response}`);
            }
        ).catch((reason => {
        console.log(`error response ${reason}`)
    }));


    res.send({'hash': hash});
})


app.use('/pay', (req, res) => {
    let payment = initPayment()
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
