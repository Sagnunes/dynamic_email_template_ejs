require('dotenv').config()
const database = require('mysql2');
const ejs = require('ejs');

const connection = database.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});


const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
    }
});

async function getTickets() {
    try {

        await connection.connect();
        const [rows] = await connection.query(`SELECT * FROM view WHERE closed BETWEEN '2024-10-14 00:00:00' AND '2024-10-14 23:59:59'`);
        return rows
    } catch (error) {
        console.log(error);
    }
}

async function sendEmails(records) {

    ejs.renderFile(__dirname + '/views/emails.ejs', {records}, function (err, template) {
        if (err) {
            console.log(err);
        } else {
            for (const ticket of records) {

                const mailOptions = {
                    from: process.env.MAIL_DEPARTMENT,
                    to: ticket.address,
                    subject: ticket.subject,
                    html: template
                };

                transporter.sendMail(mailOptions, function (err, info) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(info);
                        console.log('Message send successfully.');
                    }
                });
            }
        }
    })
}

let records = await getTickets();
sendEmails(records).then(r => console.log(r));