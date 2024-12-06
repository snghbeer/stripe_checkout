import { Schema, model } from 'mongoose';


interface IProduct {
    name: String,
    category: Schema.Types.ObjectId,
    price: Number,
    description: String,
    quantity: Number,
    image: String,
  }

const productSchema = new Schema({
    name: String,
    category: { type: Schema.Types.ObjectId, ref: "Category" }, //one to one, each product has only 1 category
    price: Number,
    description: String,
    quantity: Number,
    image: String,
  });

export const ProductModel = model<IProduct>('Product', productSchema);
