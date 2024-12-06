import { NextFunction, Router } from 'express';
import {StripeRouter} from './stripeRoute'
import { RabbitServer } from '../micro/rabbitmq';
const express = require('express');
const path = require('path');

export class IndexRouter{
    declare router;
    declare stripeRouter;

    constructor(rabbitServer: RabbitServer){
        this.router = Router();
        this.stripeRouter = new StripeRouter(rabbitServer)
        this.stripeRouter.initRoutes()

        this.router.use('/stripe', express.static(path.join(__dirname, 'public')));
        this.router.use('/stripe', this.stripeRouter.stripeRoute)
    }
}

