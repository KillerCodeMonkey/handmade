/* global define */
define([
    'mongoose',
    'crypto',
    'appConfig',
    'models/image',
    'models/project',
    'models/authentication'
], function (mongoose, crypto, appConfig, image, project, authentication) {
    'use strict';

    var Schema = mongoose.Schema,
        UserModel,
        // User
        User = new Schema({
            username: {
                type: String,
                unqiue: true
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
            data: {}
        });

    User.methods.encryptPassword = function (password) {
        return crypto.pbkdf2Sync(password, this.salt, 10000, 512).toString('hex');
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
