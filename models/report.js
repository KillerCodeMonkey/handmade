define([
    'mongoose',
    'appConfig',
    'util/helper'
], function (mongoose, appConfig, helper) {
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

    Report.statics.getPaged = function (selector, pager, lean, getAllFields, fields, populates, cb) {
        selector = {};
        pager = pager || {};
        populates = populates || [];

        selector.permissions = {
            $nin: [appConfig.permissions.admin] // remove admins
        };

        // if there is a pager
        if (pager) {
            if (!pager.orderBy || (typeof pager.orderBy === 'string' && !Report.path(pager.orderBy))) {
                pager.orderBy = 'creationDate';
            }
            if (pager.orderDesc === undefined) {
                pager.orderDesc = false;
            }
        }

        helper.getPage(this, selector, populates, pager.limit, pager.skip, !getAllFields ? fields.join(' ') : undefined, pager.orderBy, pager.orderDesc, lean).then(function (results) {
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
        schema: Report
    };
});
