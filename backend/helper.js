// for jwt
import jwt from "jsonwebtoken";
import crypto from "bcryptjs";
import mailer from "nodemailer";
import { mailTemplate , messageTemplate} from "./templates.js";
import User from "./models/user.js";
import fs from "fs/promises";
import path from "path";
import Redis from "redis";
import {log} from "./middlewares/logger.js"
import compressor from "lz-string";
import multer from "multer";
import mongoose from "mongoose"
const ObjectId = mongoose.Types.ObjectId

const { HASH_KEY, HASH_ROUNDS, SENDER_MAIL, MAIL_APP_KEY, TOKEN_EXPIRE_TIME, CACHE_EXPIRE_TIME } =
    process.env;

// for json web token
const createToken = (data, expiresIn = false) => {
    return expiresIn
        ? jwt.sign(data, HASH_KEY, { expiresIn })
        : jwt.sign(data, HASH_KEY);
};

const getTokenData = token => {
    return !token ? new Error() : jwt.verify(token, HASH_KEY);
}

// for cypto
const hash = data => crypto.hashSync(data, HASH_KEY, parseInt(HASH_ROUNDS));
const compareHashes = crypto.compareSync;
const randomHash = HASH_ROUNDS => crypto.genSalt(parseInt(HASH_ROUNDS));

// for nodemailer
const config = {
    port: 587,
    host: "smtp.gmail.com",
    secure: false,
    auth: {
        user: SENDER_MAIL,
        pass: MAIL_APP_KEY
    }
};

const transporter = mailer.createTransport(config);
const sendMail = (receiver, subject, body) => {
    const options = {
        subject,
        from: SENDER_MAIL,
        to: receiver,
        html: body
    };

    return transporter.sendMail(options);
};

// for confirmation

const sendMailConfirmation = async (email, req, callback, title = "Snet Email Confirmation", 
buttonText = "Confirm Account", description = "Please Click On The Link Below To Confirm Your Account", url) => {
    try {
        let confirmToken;
        if(!url) confirmToken = await createToken(
            {
                email
            },
            TOKEN_EXPIRE_TIME
        );
        
        url = !url ? `${req.protocol}://${req.domain}/api/user/verify?token=${confirmToken}` : url;
        console.log(url)
        
        const body = mailTemplate(url, title, buttonText, description)
        await sendMail(email, title, body);
        if (callback) callback(true);
    } catch (er) {
        log(er, "bad");
        if (callback) callback(false);
    }
};

// fs for adding and retrieving files
const readFile = (url, callback) => {
    return fs.readFile(url)
};

function writeFile(path, buffer) {
    return fs.writeFile(path, buffer)
}

const deleteFile = (url, callback) => {
    return fs.unlink(url)
};

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// helper for managing files to upload folder 
const getFileData = file => {
    const { mimetype, buffer, size } = file;
    const ext = mimetype.split("/")[1];
    
    return {
        type: mimetype, 
        size, 
        ext,
        buffer
    }
}

const uploadFile = async (file, folder) => {
const {type, size, ext, buffer} = getFileData(file);

const fileName = `${new ObjectId().toString()}.${ext}`;
    console.log(fileName)
    const savePath = path.join(__dirname, "uploads", folder, fileName); // adjust to your structure
    await fs.writeFile(savePath, buffer);

    return {
    name: fileName,
    type,
    size,
    url: `uploads/${folder}/${fileName}`
    }
}

const rewriteFile = async (file, location) => {
    const {type, buffer, size, ext} = getFileData(file);
    const savePath = path.join(__dirname, location); // adjust to your structure
    await fs.writeFile(savePath, buffer);
    return {
    name: location,
    type,
    size,
    url: location
    }
}

const cacheMem = Redis.createClient();

const setCache = (key, data, expiring = true) => {
    const serializedData = JSON.stringify(data);
    if (expiring === true) {
        return cacheMem.set(key, serializedData, {
            EX: CACHE_EXPIRE_TIME,
        });
    } else if (typeof expiring === "number") {
        return cacheMem.set(key, serializedData, {
            EX: expiring
        });
    } else {
        return cacheMem.set(key, serializedData);
    }
    
    log("cache added/updated: " + expiring, "warning")
};

const getCache = key => {
    return new Promise((res, rej) => {
        cacheMem.get(key)
            .then(data => {
                try {
                    res(JSON.parse(data));
                } catch (err) {
                    res(data);
                }
                if(data) log("cache hitted!!")
            })
            .catch(err =>{
            log("cache missed!!!", "bad")
            rej(err)
            })
    });
};

const checkCache = async (key, notFoundCb) => {
    try {
        const data = await getCache(key);
        if (data){
            return data;
        }
        
        if(!notFoundCb) return
        const [freshData, expiring = false] = await notFoundCb();
        await setCache(key, freshData, expiring);
        
        return freshData;
    } catch (err) {
        throw err;
    }
};

// for compressing and decompressing data 
const compressData = compressor.compress;
const decompressData = compressor.decompress

async function restoreDoc(doc, model) {
    /*if (!doc) return null;
    if (doc instanceof model) return doc; */
    /*
    const restoredDoc = model.hydrate(doc);
    restoredDoc.$__.wasPopulated = true;
    restoredDoc.isNew = false; // or restoredDoc.markNotNew() doesn't exist but we can manually set isNew to false
    return restoredDoc*/
    return !doc ? false : model.wrapDoc(doc, model)
}

// to tell user something and redirect eg in email confirmation if confirmed
const sendMessage = (res, message, redirect, img = "/images/success.png") => {
    res.send(messageTemplate(message, redirect, img))
}

/* for.multer upload files */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});


process.__dirname = __dirname

// for socket io 

export {
    createToken,
    getTokenData,
    hash,
    compareHashes,
    sendMail,
    randomHash,
    sendMailConfirmation,
    readFile,
    writeFile,
    deleteFile,
    __dirname,
    path,
    cacheMem,
    checkCache,
    compressData,
    decompressData,
    getCache,
    setCache,
    restoreDoc,
    sendMessage,
    upload,
    uploadFile,
    rewriteFile
};
