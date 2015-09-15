define([
    'mongoose'
], function (mongoose) {
    'use strict';

    var Schema = mongoose.Schema,
        Image = new Schema({
            path: {
                type: String,
                required: true
            },
            width: {
                type: Number,
                required: true
            },
            date: {
                type: Date,
                required: true
            },
            variants: [{
                path: {
                    type: String,
                    required: true
                },
                width: {
                    type: Number,
                    required: true
                }
            }]
        }),
        Model = mongoose.model('Image', Image);

    return {
        model: Model,
        schema: Image
    };
});
