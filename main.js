require('dotenv').config()
const database = require('mysql2');
const ejs = require('ejs');
const moment = require('moment');
const logger = require('pino')();

const connection = database.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
const nodemailer = require('nodemailer');

const email_not_send = 2
const email_send = 1

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST, port: process.env.MAIL_PORT, secure: false, auth: {
        user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD,
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
    if (records.length < 1) {
        logger.info('No Records Found');
    } else {
        for (const ticket of records) {
            ticket.createdAt = moment(ticket.created).format('DD-MM-YYYY')
            ejs.renderFile(__dirname + '/src/views/emails.ejs', {ticket}, async function (err, template) {
                if (err) {
                    logger.error(`Template can't be loaded`)
                } else {
                    const mailOptions = {
                        from: process.env.MAIL_DEPARTMENT,
                        to: 'sergio.ag.nunes@madeira.gov.pt',
                        subject: 'Inquérito de satisfação do Ticket #' + ticket.ticket_number,
                        html: template,
                        attachments: [{
                            filename: 'Logo_SRETC_DRABL_Branco.png',
                            path: __dirname + '/src/assets/Logo_SRETC_DRABL_Branco.png',
                            cid: 'logo'
                        }]
                    };
                    try {
                        let actualDate = moment().format('YYYY-MM-DD');
                        const sql = 'INSERT INTO `ost_notification_emails`(`email`, `ticket`, `subject`, `status`, `createdAt`) VALUES (?, ?, ?, ?, ?)';
                        const values = [ticket.address, ticket.ticket_number, ticket.subject, email_send, actualDate];
                        await transporter.sendMail(mailOptions);
                        await connection.execute({sql, values});
                        logger.info(`Email has send to - ${ticket.address}`)

                    } catch (error) {
                        let actualDate = moment().format('YYYY-MM-DD');
                        const sql = 'INSERT INTO `ost_notification_emails`(`email`, `ticket`, `subject`, `status`, `createdAt`) VALUES (?, ?, ?, ?, ?)';
                        const values = [ticket.address, ticket.ticket_number, ticket.subject, email_not_send, actualDate];
                        await connection.execute({sql, values});
                        logger.error(`Error sending email to - ${ticket.address}`)
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
    }, 50000)
}

main();