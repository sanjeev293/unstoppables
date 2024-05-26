const express = require('express');
const cors = require('cors')
const dns = require('dns');
const nodemailer = require('nodemailer');
const emailValidator = require('deep-email-validator');



const app = express();
const port = 3000;



app.use(cors());

app.use(express.json());

// Regular expression to validate email syntax
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isEmailSyntaxValid = (email) => emailRegex.test(email);

const getMxRecords = (domain) => {
  return new Promise((resolve, reject) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err) {
        reject(err);
      } else {
        resolve(addresses);
      }
    });
  });
};

const verifyEmailSmtp = async (email) => {
  console.log(email , 'EMAILCHECK' )
  const domain = email.split('@')[1];

  if (domain !== 'gmail.com') {
    console.log(`Invalid domain: ${domain}`);
    return false;
  }
  let mxRecords;

  try {
    mxRecords = await getMxRecords(domain);
    console.log(mxRecords)
  } catch (error) {
    return false;
  }

  if (mxRecords.length === 0) {
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: mxRecords[0].exchange,
    // port: 465,
    service: 'gmail',
    // secure: true, // use SSL
    auth:{
      user: 'sanjeevranjan293@gmail.com',
      pass: 'ytaczszsdlgrnprg'
    },
    // tls: {
    //   rejectUnauthorized: false
    // }
  });
  console.log(transporter)

  try {
    await transporter.verify();
    const response = await transporter.sendMail({
      from: 'sanjeevranjan293@gmail.com',
      to: email,
      subject: 'Email Verification',
      text: 'This is a test email for verification purposes.'
    });
    console.log(response , "response");


    
        const isValidEmail =  await emailValidator.validate(email);
        return isValidEmail?.valid
    // return true;
  } catch (error) {
    console.log("checking verify error")
    return false;
  }
};

app.post('/verify-emails', async (req, res) => {
  const { emails } = req.body;
  if (!Array.isArray(emails)) {
    return res.status(400).send('Emails should be an array.');
  }

  const results = await Promise.all(
    emails.map(async (email) => {
      const syntaxValid = isEmailSyntaxValid(email);
      if (!syntaxValid) {
        return { email, valid: false, reason: 'Invalid Syntax' };
      }

      const smtpValid = await verifyEmailSmtp(email);
      console.log(smtpValid,"check")
      if (!smtpValid) {
        return { email, valid: false, reason: 'SMTP Verification Failed' };
      }

      return { email, valid: true };
    })
  );

  res.json(results);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});