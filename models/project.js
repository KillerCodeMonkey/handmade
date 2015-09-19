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
            complete: {
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
            complete: {
                type: Boolean,
                required: true,
                'default': false
            },
            creationDate: {
                type: Date,
                'default': Date.now
            },
            active: {
                type: Boolean,
                required: true,
                'default': true
            },
            data: {}
        }),
        Model = mongoose.model('Project', Project);

    Project.post('remove', function (project) {
        project.images.forEach(function (image) {
            image.remove();
        });
        project.materials.forEach(function (material) {
            material.remove();
        });
        project.steps.forEach(function (step) {
            step.remove();
        });
    });

    Step.post('remove', function (step) {
        step.images.forEach(function (image) {
            image.remove();
        });
    });

    return {
        model: Model,
        schema: Project
    };
});
