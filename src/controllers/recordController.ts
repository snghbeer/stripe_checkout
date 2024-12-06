import mongoose from 'mongoose';
import { IRecord } from '../interfaces/record';
import { RecordModel } from '../models/record';
import { ProductModel } from '../models/product';
import { PaymentMethods } from '../interfaces/paymentIntent';

export async function fetchRecord(uuid: string) {
    try {
        const record = RecordModel.findOne({ uuid: uuid })
        return record
    }
    catch (err) {
        console.error(err)
    }
}

export async function linkRecord(uuid: string, checkoutId: string) {
    try {
        const record = RecordModel.findOneAndUpdate({ uuid: uuid }, {checkoutId: checkoutId}, { new: true })
        return record
    }
    catch (err) {
        console.error(err)
    }
}

export async function confirmRecord(uuid: string, paymentMethod: PaymentMethods|string) {
    try {
        const record = await RecordModel.findOneAndUpdate({ uuid: uuid }, 
            { confirmed: true,
              payment_method: paymentMethod
            }, { new: true })
        return record
    }
    catch (err) {
        console.error(err)
    }
}

export async function cancelSellProduct(uuid: string) {
    try {
        const deleted = await RecordModel.findOneAndDelete({ uuid: uuid }, { useFindAndModify: false });
/*         const recordPromises = deleted!.records!.map(async (recordItem) => {
            await ProductModel.findOneAndUpdate({ name: recordItem.product },
                { $inc: { quantity: recordItem.amount } }).exec();
        });
        await Promise.all(recordPromises); */
        return deleted
    }
    catch (err) {
        console.error(err);
        return false
    }
}