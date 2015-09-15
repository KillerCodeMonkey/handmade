define([
    'mongoose',
    'models/image'
], function (mongoose, image) {
    'use strict';

    var Schema = mongoose.Schema,
        Material = new Schema({
            name: {
                type: String,
                required: true
            },
            amount: {
                type: String
            }
        }),
        Step = new Schema({
            title: {
                type: String,
                required: true
            },
            description: {
                type: String
            },
            images: [image.schema],
            finish: {
                type: Boolean,
                required: true,
                'default': false
            }
        }),
        // Project
        Project = new Schema({
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            title: {
                type: String,
                required: true
            },
            description: {
                type: String
            },
            steps: [Step],
            materials: [Material],
            images: [image.schema],
            'public': {
                type: Boolean,
                required: true,
                'default': false
            },
            finished: {
                type: Boolean,
                required: true,
                'default': false
            },
            data: {}
        }),
        Model = mongoose.model('Project', Project);

    return {
        model: Model,
        schema: Project
    };
});
