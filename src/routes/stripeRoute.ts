import { Router, Request, Response } from 'express';
import { RabbitServer } from '../micro/rabbitmq';
import { cancelSellProduct, confirmRecord, fetchRecord, linkRecord } from '../controllers/recordController';
import { PaySession } from '../interfaces/PaySession';
import { PaymentIntent } from '@stripe/stripe-js';
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();

require('dotenv').config();
const path = require('path');

const stripe = require('stripe')(process.env.STRIPE_SECRET)
const TEST_CONNECTED_ACCOUNT = (process.env.STRIPE_CUSTOMER)

function round(num:number) {
  return (Math.round((num + Number.EPSILON) * 100)/100);
}

export class StripeRouter{
  declare stripeRoute;
  declare private rb;

  constructor(rabbitServer: RabbitServer){
    this.stripeRoute = Router();
    this.rb = rabbitServer
  }

  initRoutes(){
    
    this.stripeRoute.post('/create-checkout-session', jsonParser, async (req: Request, res: Response) => {
      const orderUuid = req.body.uuid;
      if(!orderUuid || typeof orderUuid !== "string") return res.sendStatus(400);
      const anOrder = await fetchRecord(orderUuid)
      if(!anOrder) return res.sendStatus(400)
      const orderData = req.body.order;
      const hostUrl =  `${process.env.SERVER_URL}` //`${process.env.SERVER_URL}:${process.env.PORT}`
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Order at ${TEST_CONNECTED_ACCOUNT}`,
              },
              unit_amount: round(orderData.total*100),
            },
            quantity: 1,
          },
        ],
        payment_method_types: ['card', 'bancontact', 'ideal'],
        mode: 'payment',
        success_url: `${hostUrl}/stripe/success?uuid=${orderUuid}`,
        cancel_url: `${hostUrl}/stripe/cancel?uuid=${orderUuid}`,
      }, {
        stripeAccount: TEST_CONNECTED_ACCOUNT,
      });
      await linkRecord(orderUuid, session.id) //add checkout sessionid to an order
      //console.log(session)
      res.status(200).json({ url: session.url, session: session, uuid: orderUuid });
    });
    
    this.stripeRoute.get('/payment-status', async (req: Request, res: Response) => {
      try {
        let sessionId = req.query.id;
        if (!sessionId || typeof sessionId !== "string") return res.status(400).json({ message: "Bad request", succes: false });
        else {
          const session = await stripe.checkout.sessions.retrieve(sessionId,
            {
              stripeAccount: TEST_CONNECTED_ACCOUNT,
            });
          res.status(200).json({ session: session })
        }
      }
      catch (err) {
        res.status(400).json({ message: "Bad request", succes: false });
      }
    });
    
    
    //Redirection urls
    
    //whenever a payment has been successful
    this.stripeRoute.get('/success', async (req: Request, res: Response) => {
      try{
        let sessionId = req.query.uuid;
        if(!sessionId || typeof sessionId !== "string") return res.sendStatus(400);
        const sess = await fetchRecord(sessionId as string)
        if(!sess) return res.status(401).json({ message: "Session does not exist", succes: false });
        const session = await stripe.checkout.sessions.retrieve(sess.checkoutId,
          {
            stripeAccount: TEST_CONNECTED_ACCOUNT,
          }) as PaySession;

        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent,{
          stripeAccount: TEST_CONNECTED_ACCOUNT,
        }) as PaymentIntent;  
        const method = paymentIntent.payment_method_types[0]
        if(session.payment_status === "paid"){
          await confirmRecord(sessionId as string, method)
          this.rb.sendMsg(JSON.stringify({
            message: "Payment successful!",
            uuid: sessionId
          }));
        }
        res.sendFile(path.join(__dirname, 'public/success.html'));
      }
      catch(err){
        console.error(err);
        res.status(400).json({ message: "Bad request", succes: false });
      }
    });
    
    this.stripeRoute.get('/cancel', async (req: Request, res: Response) => {
      try{
        let sessionId = req.query.uuid;
        if(!sessionId || typeof sessionId !== "string") return res.sendStatus(400);
        const cancelled = await cancelSellProduct(sessionId as string)
        if(!cancelled) return res.status(400).json({ message: "Order does not exist", succes: false });
        res.sendFile(path.join(__dirname, 'public/cancel.html'));
      }
      catch(err){
        console.error(err);
        res.status(400).json({ message: "Order does not exist", succes: false });
      }
    });
  }
}