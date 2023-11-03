const { response } = require("express");
const express = require("express");
const bcrypt = require("bcrypt")
const { Op } = require("sequelize");
const nodemailer = require('nodemailer');
const Joi = require('joi');
const jwt = require("jsonwebtoken");
const JWT_KEY = 'tugasakhir'

const config = require('../config/config');
const User = require("../models/User");
const router = express.Router();


const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: config.email,
    pass: config.password,
  },
});

async function checkUniqueEmail(email) {
    const cekUsers = await User.findAll({
      where: {
        email: {
          [Op.eq]: email
        }
      }
    });
    if (cekUsers.length >= 1) {
      throw new Error("Email sudah terdaftar!");
    }
  }
async function checkUniqueUsername(username) {
    const cekUsers = await User.findAll({
      where: {
        username: {
          [Op.eq]: username
        }
      }
    });
    if (cekUsers.length >= 1) {
      throw new Error("Username sudah ada!");
    }
}
async function cekPass(cpassword, password) {
  if (cpassword !== password) {
      throw new Error("Password dan confirm password tidak sesuai!");
  }
}

router.post("/register", async (req, res) => {
    let { username, email, alamat, norek, password, cpassword, role } = req.body;
    let pass = null;
    const schema = Joi.object({
        username: Joi.string().external(checkUniqueUsername).required().messages({
            "any.required": "Username harus diisi!",
            "string.empty": "Username tidak boleh kosong!",
        }),
        email: Joi.string().email().external(checkUniqueEmail).required().messages({
            "any.required": "Email harus diisi!",
            "string.empty": "Email tidak boleh kosong!",
            "string.email": "Email harus valid!",
        }),
        alamat: Joi.string().required().messages({
          "any.required": "Alamat harus diisi!",
          "string.empty": "Alamat tidak boleh kosong!",
        }),
        norek: Joi.string().required().messages({
          "any.required": "No Rekening harus diisi!",
          "string.empty": "No Rekening tidak boleh kosong!",
        }),
        password: Joi.string().required().messages({
          "any.required": "Password harus diisi!",
          "string.empty": "Password tidak boleh kosong!",
        }),
        cpassword: Joi.string().external(((cpassword, { }) => {
            return cekPass(cpassword, password)
          })).required().messages({
            "any.required": "Confirm password harus diisi!",
            "string.empty": "Confirm password tidak boleh kosong!",
        }),
        role: Joi.string().valid("Penjual", "Pembeli").required().messages({
          "any.required": "Role harus diisi!",
          "string.empty": "Role tidak boleh kosong!",
          "any.only": "Role harus Penjual atau Pembeli",
        }),
      });
    try {
        await schema.validateAsync(req.body);
        const pass = await bcrypt.hash(password, 10);
        token = jwt.sign({
          username: username,
          email: email,
          role: role,
          isVerified: 0
        }, JWT_KEY);
        // <a href="https://192.168.1.6:3000/api/verify?token=${token}"></a>
        const mailOptions = {
          from: config.email,
          to: email, 
          subject: 'Email Verification',
          text: "Click the following button to verify your email:", 
          html: `<b>Click the button below to verify your email:</b> <br>
                 <a href="https://projectta6854.000webhostapp.com/api/verify?token=${token}">
                   <button style="background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 3px; cursor: pointer;">Verify Email</button>
                 </a>`,
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
            res.status(500).json({ error: 'Failed to send verification email' });
          } else {
            console.log('Email sent:', info.response);
            res.status(200).json({ success: 'Verification email sent' });
          }
        });
        // let users = await User.create({
        //     username: username,
        //     email: email,
        //     alamat: alamat,
        //     norek: norek,
        //     password: pass,
        //     role: role,
        //     isVerified: 0
        // });
        return res.status(200).send({
            "message": username+" berhasil mendaftarkan akun"
        });
    } catch (error) { 
        console.error(error);
        return res.status(404).send({
            "message": error.message
        });
    } 
});

router.get("/verify", async (req, res) => {
  const token = req.query.token;
  try {
    let userdata = jwt.verify(token, JWT_KEY);
    await User.update(
      {
        isVerified: 1
      },
      {
        where: {
          email: {
            [Op.eq]: userdata.email
          }
        }
      }
    );

    res.send('Email verified successfully!');
  } catch (err) {
    return res.status(400).send({ message: err.message });
  }
});
module.exports = router;