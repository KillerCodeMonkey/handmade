/* global define */
define([
    'mongoose',
    'crypto',
    'appConfig',
    'models/image',
    'models/project',
    'models/authentication',
    'util/helper'
], function (mongoose, crypto, appConfig, image, project, authentication, helper) {
    'use strict';

    var Schema = mongoose.Schema,
        UserModel,
        // User
        User = new Schema({
            username: {
                type: String,
                unique: true
            },
            normalizedUsername: String,
            email: {
                type: String,
                required: true
            },
            hashedPassword: {
                type: String,
                required: true
            },
            salt: {
                type: String,
                required: true
            },
            creationDate: {
                type: Date,
                'default': Date.now
            },
            permissions: {
                type: [String],
                'default': [appConfig.permissions.user]
            },
            isTempPassword: {
                type: Boolean,
                'default': false
            },
            website: String,
            bio: String,
            avatar: [image.schema],
            active: {
                type: Boolean,
                required: true,
                'default': true
            },
            data: {}
        });

    User.methods.encryptPassword = function (password) {
        return crypto.pbkdf2Sync(password, this.salt, 10000, 512).toString('hex');
    };

    User.statics.getPaged = function (selector, pager, lean, getAllFields, fields, cb) {
        selector = selector || {};
        pager = pager || {};
        var populates = [],
            filter = pager.filter || {};

        selector.permissions = {
            $nin: [appConfig.permissions.admin] // remove admins
        };

        // if there is a pager
        if (pager) {
            // if there are filter
            if (filter.username) {
                selector.username = new RegExp(helper.regExpEscape(filter.username.toString()), 'i');
            }
            if (filter.email) {
                selector.email = new RegExp(helper.regExpEscape(filter.email.toString()), 'i');
            }
            if (!pager.orderBy || (typeof pager.orderBy === 'string' && !User.path(pager.orderBy))) {
                pager.orderBy = 'normalizedUsername';
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

    User.virtual('userId')
        .get(function () {
            return this.id;
        });

    User.virtual('password')
        .set(function (password) {
            this.salt = crypto.randomBytes(128).toString('base64');
            this.hashedPassword = this.encryptPassword(password);
        });


    User.methods.checkPassword = function (password) {
        return this.encryptPassword(password) === this.hashedPassword;
    };

    User.pre('save', function (next) {
        // save normalized username
        if (this.username) {
            this.normalizedUsername = this.username.toLowerCase();
        }
        next();
    });

    User.post('save', function (user) {
        // if user is not active
        if (!user.active) {
            // deactivate projects
            project.model.update({
                user: user._id
            }, {
                active: false
            }).exec();
            // remove authentications
            authentication.model.remove({
                user: user._id
            }).exec();
        } else {
            // activate projects
            project.model.update({
                user: user._id
            }, {
                active: true
            }).exec();
        }
    });

    User.post('remove', function (user) {
        user.avatar.forEach(function (image) {
            image.remove();
        });
        project.model.remove({
            user: user._id
        }).exec();
        authentication.model.remove({
            user: user._id
        }).exec();
    });

    UserModel = mongoose.model('User', User);

    return {
        model: UserModel,
        schema: User
    };
});
