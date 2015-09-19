define([
    'mongoose',
    'appConfig',
    'models/image',
    'models/report',
    'util/helper'
], function (mongoose, appConfig, image, report, helper) {
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
        report.model.remove({
            user: project.user,
            project: project._id
        }).exec();
    });

    Step.post('remove', function (step) {
        step.images.forEach(function (image) {
            image.remove();
        });
    });

    Project.statics.getPaged = function (selector, pager, lean, getAllFields, fields, populates, cb) {
        selector = selector || {};
        pager = pager || {};
        populates = populates || [];
        var self = this;

        selector.permissions = {
            $nin: [appConfig.permissions.admin] // remove admins
        };

        // if there is a pager
        if (pager) {
            if (!pager.orderBy || (typeof pager.orderBy === 'string' && !Project.path(pager.orderBy))) {
                pager.orderBy = 'creationDate';
            }
            if (pager.orderDesc === undefined) {
                pager.orderDesc = false;
            }
        }

        helper.getPage(self, selector, populates, pager.limit, pager.skip, !getAllFields ? fields.join(' ') : undefined, pager.orderBy, pager.orderDesc, lean).then(function (results) {
            var rows = results[0],
                counter = results[1];

            pager.count = counter;
            if (pager.limit) {
                pager.pages = Math.floor(pager.count / pager.limit);
                if (pager.count % pager.limit) {
                    pager.pages = pager.pages + 1;
                }
            }

            cb(null, {
                entries: rows,
                pager: pager
            });
        }, cb);
    };

    return {
        model: Model,
        schema: Project
    };
});
