import { connect, Channel, Connection, } from 'amqplib';
require("dotenv").config();


/* const servers = [
  `amqp://${process.env.RABBITUSER}:${process.env.RABBITPASS}@217.182.187.51:${process.env.RABBITPORT}`,
  `amqp://${process.env.RABBITUSER}:${process.env.RABBITPASS}@141.95.40.32:${process.env.RABBITPORT}`,
  `amqp://${process.env.RABBITUSER}:${process.env.RABBITPASS}@178.32.226.75:${process.env.RABBITPORT}`
] */

const rabbitmqServer = `${process.env.RABBITHOST}:${process.env.RABBITPORT}`;
const routingKeys = ["*.order.*", "*.payment.*"];

export class RabbitServer {
    declare private rabbitConnection: Connection|null;
    declare private reconnectionTimeout;
    declare rabbitChannel: Channel|null;
    serverIndex = 0;


    sendMsg(msg: string) {
      try {
        let exchange = process.env.RABBITMQ_EXCHANGE;
        var key = "checkout.order.new";
  
        if (this.rabbitConnection && this.rabbitChannel) {
          this.rabbitChannel.assertExchange(exchange!, "topic");  
          const message = {
            msg: msg,
            time: Date.now()
          };
          this.rabbitChannel.publish(exchange!, key, Buffer.from(JSON.stringify(message)));
        }
      } catch (err) {
        console.error(err);
      }
  }

  async #initRoutingKeys(channel: Channel) {
    const exchangeName = "amq.topic";
    try {
      for (let i = 0; i < routingKeys.length; i++) {
        try {
          const routingKey = routingKeys[i];
          await channel.bindQueue("order", exchangeName, routingKey);
        } catch (err) {
          console.log(`Routing key already exists`);
        }
      }
    } catch (error) {
      console.log(`Exchange ${exchangeName} already exists`);
    }
  }

  async #initQueue(channel: Channel) {
    try {
      channel.assertQueue("order", {
        durable: true,
      });
    } catch (error) {
      console.log(`Queue planning already exists!`);
    }
  }
  private async initRabbit(callback: () => void) {
    //const server = servers[this.serverIndex]; // Use class level server index
    let connection;
    try{
      connection = await connect(/* server */rabbitmqServer)
    }
    catch(err){
        // try the next server or start from the first server if all servers have been tried
        //this.serverIndex = this.serverIndex + 1 < servers.length ? this.serverIndex + 1 : 0;

        // delay the reconnection attempt by 5 seconds
        this.reconnectionTimeout = setTimeout(
          () => this.initRabbit(callback),
          1000
        );
        return;
    }

    this.rabbitConnection = connection;
    //detect the error/disconnection
    connection.on("error", (err) => {
      if (err.message !== "Connection closing") {
        console.error("RabbitMQ connection error:", err.message);
      }
    });

    //Log whenever we are reconnected
    if (this.reconnectionTimeout) {
      console.log("Reconnected to RabbitMQ!");
    }
    // Clear the reconnection timeout since we have a successful connection
    clearTimeout(this.reconnectionTimeout);
    this.reconnectionTimeout = null;

    const channel = await connection.createChannel();

    this.rabbitChannel = channel
    const IntervalHeartbeat = setInterval(() => {
    }, 5000);
    this.rabbitConnection.on("close", () => {
        console.error("RabbitMQ connection closed");
        clearInterval(IntervalHeartbeat);

        this.rabbitConnection = null;
        this.reconnectionTimeout = setTimeout(
          () => this.initRabbit(callback),
          1000
        );
        console.log("Trying to reconnect to RabbitMQ...");
    });


    await this.#initQueue(channel);
    await this.#initRoutingKeys(channel);
    callback()
  }

  //MAIN
  initServer(callback: () => void) {
    this.initRabbit(callback);
  }
}

