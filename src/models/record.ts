import { Schema, model, connect } from 'mongoose';
import { IRecord } from '../interfaces/record';



const SaleRecordSchema = new Schema<IRecord>({
  records: [
    {
      product: String,  // { type: Schema.Types.ObjectId, ref: "Product" } one to many, 1 record has many products
      amount: Number,
      price: Number,
      note: String,
    }
  ],
  date: { type: Date, default: () => Date.now()},
  total: Number,
  fulfilled: { type: Boolean, default: false}, //order is fulfilled
  by: Number, //ordered by
  waiter: { type: String, default: "" },
  confirmed: { type: Boolean, default: false}, //when the order IS PAID, then it is confirmed
  uuid: String,
  checkoutId: String,
  payment_method: String
});


export const RecordModel = model<IRecord>('Record', SaleRecordSchema);
