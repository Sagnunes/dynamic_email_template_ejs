require('dotenv').config()
const database = require('mysql2');
const ejs = require('ejs');
const moment = require('moment');

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
    let actualDate = moment().format('YYYY-MM-DD');
    try {
        await connection.connect();
        const [rows] = await connection.promise().query(`SELECT * FROM view_closed_tickets WHERE closed BETWEEN '${actualDate} 00:00:00' AND '${actualDate} 23:59:59'`);
        return rows
    } catch (error) {
        console.log(error)
    }
}

async function sendEmails(records) {

    if (!records) {
        console.log('no records')
    } else {
        for (const ticket of records) {

            ticket.createdAt = moment(ticket.created).format('DD-MM-YYYY')
            ejs.renderFile(__dirname + '/src/views/emails.ejs', {ticket}, async function (err, template) {
                if (err) {
                    console.log(err);
                } else {
                    const mailOptions = {
                        from: process.env.MAIL_DEPARTMENT,
                        to: 'sergio.ag.nunes@madeira.gov.pt',
                        subject: 'Inquérito de satisfação do ' + ticket.subject,
                        html: template,
                        attachments: [{
                            filename: 'Logo_SRETC_DRABL_Branco.png',
                            path: __dirname + '/src/assets/Logo_SRETC_DRABL_Branco.png',
                            cid: 'logo'
                        }]
                    };

                    try {
                        //await transporter.sendMail(mailOptions);
                        console.log('Email enviado com sucesso.');
                    } catch (error) {
                        console.error('Erro ao enviar o email:', error);
                    }
                }
            })
        }
    }

}

async function main() {
    let records = await getTickets();
    await sendEmails(records);

    setTimeout(() => {
        process.exit(0);
    }, 5 * 60 * 1000)
}

main();