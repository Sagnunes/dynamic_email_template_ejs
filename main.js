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
    secure: 'null',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
    }
});

async function getTickets() {
    try {

        await connection.connect();
        const [rows] = await connection.promise().query(`SELECT * FROM view_closed_tickets WHERE closed BETWEEN '2024-10-14 00:00:00' AND '2024-10-14 23:59:59'`);
        return rows
    } catch (error) {
        console.log(error);
    }
}

async function sendEmails(records) {

    ejs.renderFile(__dirname + '/src/views/emails.ejs', {records: records}, async function (err, template) {
        if (err) {
            console.log(err);
        } else {
            for (const ticket of records) {

                console.log(ticket)
                const mailOptions = {
                    from: process.env.MAIL_DEPARTMENT,
                    to: 'sergio.ag.nunes@madeira.gov.pt',
                    subject: ticket.subject,
                    html: template
                };

                try {
                    await transporter.sendMail(mailOptions);
                    console.log('Email enviado com sucesso.');
                } catch (error) {
                    console.error('Erro ao enviar o email:', error);
                }
            }
        }
    })
}

async function main() {
    let records = await getTickets();
    await sendEmails(records);
}

main();