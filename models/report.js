define([
    'mongoose'
], function (mongoose) {
    'use strict';

    var Schema = mongoose.Schema,
        Report = new Schema({
            creationDate: {
                'default': Date.now,
                type: Date,
                required: true
            },
            reporter: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            abuse: {
                required: true,
                type: String
            },
            project: {
                type: Schema.Types.ObjectId,
                ref: 'Project',
                required: true
            }
        }),
        Model = mongoose.model('Report', Report);

    return {
        model: Model,
        schema: Report
    };
});
