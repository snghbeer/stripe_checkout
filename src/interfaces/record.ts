
export interface IRecord {
    confirmed: boolean;
    uuid: string;
    records?:[
      {
        product: String,  
        amount: Number,
        price: Number,
        note: String,
      }
    ];
    date?: Date;
    total?: Number;
    fulfilled?: boolean; //order is fulfilled
    by?: number; //ordered by
    waiter?: string;
    checkoutId: string;
    payment_method: String;
  }