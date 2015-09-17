define([
    'mongoose',
    'util/helper'
], function (mongoose, helper) {
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

    Image.post('remove', function (image) {
        helper.imageRemove(image);
    });

    return {
        model: Model,
        schema: Image
    };
});
