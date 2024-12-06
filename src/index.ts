require('dotenv').config();
import express, { Request, Response, NextFunction } from 'express';
var cookieParser = require('cookie-parser');
var session = require('express-session');
import mongoose from 'mongoose';
import { ClientToServerEvents, ISessionCall, ServerToClientEvents, InterServerEvents, SocketData } from './interfaces/callSession';

import { RabbitServer } from './micro/rabbitmq'
import { IndexRouter } from './routes/index'
const rabbitmq = new RabbitServer()
const router = new IndexRouter(rabbitmq)
const app = express();
const cors = require('cors');
import { createServer } from 'http';
import  { Server } from "socket.io";


const PORT = process.env.PORT;
const dbURI = process.env.dbURI;
const dbName = process.env.dbName;

let isReceptionBusy = false;
let clients: ISessionCall[] = [];

mongoose.set('strictQuery', true);

app.use(cookieParser());
app.set("trust proxy", 1);
app.use(session({
    name: process.env.cookieName,
    secret: process.env.TOKEN_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 86400000, //24h
        secure: true //http, true for https
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = createServer(app);

const io = new Server<ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData>(server, {
        cors: {
            origin: "*", // Allow all origins
            methods: ["GET"], // Allow both GET and POST methods
            credentials: true
        }
    });

//Cors middleware
app.use(cors({
    credentials: true,
    origin: true
}));

function isThereAManager() {
    return clients.some((client) => client.type === "manager")
}

io.on("connection", (socket) => {
    console.log(socket.id)
    // Handle incoming call requests
    socket.on("callRequest", () => {
        if (isReceptionBusy) {
            // Reception is busy, decline the call request
            socket.emit("callDeclined");
        } else {
            // Reception is available, accept the call request
            socket.emit("callAvailable");
            isReceptionBusy = true;
            clients.push({
                type: "user",
                socket: socket
            })
        }
    });

    // Handle call end event
    socket.on("declineCall", () => {
        isReceptionBusy = false;
        clients.forEach((client) => {
            client.socket.emit("endCall");
        });
        clients = clients.filter(client => client.type === "manager")
    });

    // Handle call start event
    socket.on("acceptCall", () => {
        isReceptionBusy = true;
        const caller = clients.find(client => client.type === "user")
        caller?.socket.emit("callAccepted");
    });

    socket.on("registerManager", () => {
        if (!isThereAManager()) {
            clients.push({
                type: "manager",
                socket: socket
            })
            console.log("Manager registered")
        }
        else {
            console.log("Manager already registered")
            clients = clients.filter(client => client.type === "manager")
            clients[0] = {
                type: "manager",
                socket: socket
            }

        }
    })
});

app.use(router.router); //uses router

//0.0.0.0 is important for docker
server.listen(parseInt(PORT!), "0.0.0.0", async () => {
    try {
        console.log(`Server is running on port ${PORT}`);	
        rabbitmq.initServer(() => {
            //console.log(`App listening on port ${PORT}`)
            console.log(`Rabbitmq is live`)

        })
        mongoose.connect(`${dbURI}/${dbName}?retryWrites=true&w=majority`,
            { ssl: true, sslValidate: true })

        mongoose.connection.once("open", () => {
            console.log("Connection with database has been made!");
        })
    }
    catch (err) {
        console.log(err)
    }
})

//In case server shuts down, we need to close mongoose connection
process.on('SIGINT', () => {
    mongoose.connection.close(() => {
        console.log("Database connection closed!")
        process.exit(0);
    })
});