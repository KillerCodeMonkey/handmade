define([
    'appConfig',
    'bluebird',
    'underscore',
    'util/mailer',
    'util/helper'
], function (appConfig, Promise, _, Mailer, helper) {
    'use strict';
    var rest = {},
        fields = [
            'username',
            'avatar',
            '_id'
        ];

    function stripUser(user) {
        delete user.hashedPassword;
        delete user.salt;
    }

    function getUser(selector, User) {
        return new Promise(function (resolve, reject) {
            User.findOne(selector, function (err, user) {
                if (err) {
                    return reject(err);
                }
                if (!user) {
                    return resolve(false);
                }
                return resolve(true);
            });
        });
    }

    /**
    * @api {get} /user Get User list
    * @apiName GetUsers
    * @apiDescription Gets the list of all users exclude self
    * @apiGroup User
    * @apiVersion 1.0.0
    * @apiPermission everyone
    * @apiHeader {String} [Authorization] Set TOKENTYPE ACCESSTOKEN for possible authorization
    * @apiHeaderExample {json} Authorization-Header-Example:
                     { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
    * @apiSuccess {Object[]} UserList list of user objects.
    *
    * @apiSuccessExample Success-Response:
    *     HTTP/1.1 200 OK
    *     [{
    *       "username": "killercodemonkey",
    *       "_id": "507f191e810c19729de860ea"
    *     }]
    *
    * @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 500 Internal Server Error
    *     {
    *       "error": "MONGODB ERROR OBJECT"
    *     }
    */
    rest.get = {
        permissions: [],
        models: ['user'],
        pager: true,
        exec: function (req, res, User) {
            var selector = {},
                getAllFields = true;
            if (req.user) {
                selector._id = { // remove own user
                    $ne: req.user._id
                };
            }

            if (req.user && req.user.permissions.indexOf(appConfig.permissions.admin) === -1) {
                getAllFields = false;
            }
            User.getPaged(selector, req.pager, undefined, getAllFields, fields, function (err, result) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }
                return res.send(result);
            });
        }
    };

     /**
     * @api {get} /user/account Get Account
     * @apiName GetAccount
     * @apiDescription Gets the current logged in user
     * @apiGroup User
     * @apiVersion 1.0.0
     * @apiPermission authorized User
     * @apiHeader {String} Authorization Set TOKENTYPE ACCESSTOKEN for possible authorization
     * @apiHeaderExample {json} Authorization-Header-Example:
                      { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
     * @apiSuccess {String} username username of the User.
     * @apiSuccess {String} normalizedUsername username in lowercase.
     * @apiSuccess {String} email email address of the User.
     * @apiSuccess {String} creationDate registration date of the User.
     * @apiSuccess {String[]} permissions the permissions/roles of the user.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "username": "killercodemonkey",
     *       "_id": "507f191e810c19729de860ea",
     *       "email": "bengtler@gmail.com",
     *       "permissions": [
     *          'user',
     *          'admin'
     *       ]
     *     }
     */
    rest.account = {
        permissions: [appConfig.permissions.user],
        models: [],
        exec: function (req, res) {
            res.send(req.user.toObject());
        }
    };

     /**
     * @api {get} /user/id/:id Get User
     * @apiName GetUser
     * @apiDescription Gets a user (no admins!)
     * @apiGroup User
     * @apiVersion 1.0.0
     * @apiPermission everyone
     * @apiParam {String} id objectid of the user
     * @apiHeader {String} [Authorization] Set TOKENTYPE ACCESSTOKEN for possible authorization
     * @apiHeaderExample {json} Authorization-Header-Example:
                      { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
     * @apiSuccess {String} username username of the User.
     * @apiSuccess {String} email email address of the User.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "username": "killercodemonkey",
     *       "_id": "507f191e810c19729de860ea",
     *       "email": "bengtler@gmail.com"
     *     }
     *
     * @apiError (Error 403) Forbidden Trying to get admin user.
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 403 Forbidden
     *     {
     *       "error": "permission_denied"
     *     }
     */
    rest.getOne = {
        object: true,
        permissions: [],
        models: [],
        exec: function (req, res) {
            if (req.object.permissions.indexOf(appConfig.permissions.admin) !== -1) {
                return res.status(403).send({
                    error: 'permission_denied'
                });
            }
            var user = req.object.toObject();

            return res.send({
                username: user.username,
                email: user.email,
                _id: user._id
            });
        }
    };

     /**
     * @api {delete} /user/id/:id Remove user
     * @apiName RemoveUser
     * @apiDescription removes a user as admin
     * @apiGroup User
     * @apiVersion 1.0.0
     * @apiPermission admin
     * @apiParam {String} id objectid of the user
     * @apiHeader {String} Authorization Set TOKENTYPE ACCESSTOKEN for possible authorization
     * @apiHeaderExample {json} Authorization-Header-Example:
                      { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *
     * @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 500 Internal Server Error
     *     {
     *       "error": "MONGODB ERROR OBJECT"
     *     }
     */
    rest.remove = {
        object: true,
        permissions: [appConfig.permissions.admin],
        models: [],
        exec: function (req, res) {
            // delete user
            req.object.remove(function (removeErr) {
                if (removeErr) {
                    return res.status(500).send({
                        error: removeErr
                    });
                }

                res.send();
            });
        }
    };

     /**
     * @api {head} /user/check Check User
     * @apiName CheckUser
     * @apiDescription checks if a user with email or username exists
     * @apiGroup User
     * @apiVersion 1.0.0
     * @apiPermission everyone
     * @apiParam {String} email email address to check
     * @apiParamExample {string} [email]
                   ?email=bengtler@gmail.com
     * @apiParam {String} username user name to check
     * @apiParamExample {string} [username]
                   ?username=killercodemonkey
     * @apiHeader {String} [Authorization] Set TOKENTYPE ACCESSTOKEN for possible authorization
     * @apiHeaderExample {json} Authorization-Header-Example:
                      { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *
     * @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 500 Internal Server Error
     *     {
     *       "error": "MONGODB ERROR OBJECT"
     *     }
     *
     * @apiError (Error 404) MissingParameter a required parameter is missing
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "missing_parameter"
     *     }
     * @apiError (Error 400) InvalidStructure parameter value is invalid.
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "invalid_structure",
     *       "param": "email"
     *     }
     * @apiError (Error 400) WrongDatatype parameter has wrong type
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "wrong_type",
     *       "param": "email"
     *     }
     *
     * @apiError (Error 404) NotFound user not exists
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 404 Not Found
     */
    rest.check = {
        permissions: [],
        params: {
            email: {
                type: String,
                optional: true,
                regex: /^[a-zA-Z0-9\.\-\_]+@[a-zA-Z0-9\.\-\_]+\.[a-zA-Z]{2,}$/,
                query: true
            },
            username: {
                type: String,
                optional: true,
                query: true
            }
        },
        models: ['user'],
        exec: function (req, res, User) {
            var selector = {};
            if (!req.params.email && !req.params.username) {
                return res.status(400).send({
                    error: 'missing_parameter',
                    param: 'email'
                });
            }
            if (req.params.email) {
                selector.email = req.params.email;
            } else {
                selector.username = req.params.username;
            }

            getUser(selector, User).then(function (exists) {
                if (exists) {
                    return res.send();
                }
                return res.status(404).send();
            }, function (err) {
                return res.status(500).send({
                    error: err
                });
            });
        }
    };

     /**
     * @api {put} /user/sendPassword Send new password
     * @apiName SendPassword
     * @apiDescription sends password for email
     * @apiGroup User
     * @apiVersion 1.0.0
     * @apiPermission unauthorized
     * @apiParam {String} email email address to send new pw
     * @apiParamExample {json} request body
                   { "email": "bengtler@gmail.com" }
     * @apiSuccess {Object} user the user object.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "username": "killercodemonkey",
     *       "_id": "507f191e810c19729de860ea",
     *       "email": "bengtler@gmail.com"
     *     }
     *
     * @apiError (Error 5xx) InternalServerError An error while processing mongoDB query occurs.
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 500 Internal Server Error
     *     {
     *       "error": "MONGODB ERROR OBJECT"
     *     }
     *
     * @apiError (Error 400) MissingParameter a parameter is missing
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "missing_parameter"
     *     }
     * @apiError (Error 400) InvalidStructure structure of a parameter is invalid
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "invalid_structure",
     *       "param": "email"
     *     }
     * @apiError (Error 400) WrongDatatype type of parameter is invalid
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "wrong_type",
     *       "param": "email"
     *     }
     *
     * @apiError (Error 400) AlreadyLoggedIn valid authorization header is set
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "user_already_loggedin"
     *     }
     * @apiError (Error 404) NotFound User not found
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 404 Not Found
     *     {
     *       "error": "user_not_found"
     *     }
     */
    rest.sendPassword = {
        permissions: [],
        params: {
            email: {
                type: String,
                regex: /^[a-zA-Z0-9\.\-\_]+@[a-zA-Z0-9\.\-\_]+\.[a-zA-Z]{2,}$/
            }
        },
        models: ['user'],
        exec: function (req, res, User) {
            if (req.user) {
                return res.status(400).send({
                    error: 'user_already_loggedin'
                });
            }
            User.findOne({
                email: req.params.email
            }, function (err, user) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }
                if (!user || !user.active) {
                    return res.status(404).send({
                        error: 'user_not_found'
                    });
                }
                var password = helper.generateRandomString(),
                    object = {};

                user.password = password;
                user.isTempPassword = true;

                user.save(function (saveErr) {
                    if (saveErr) {
                        return res.status(500).send({
                            error: saveErr
                        });
                    }
                    if (process.env.NODE_ENV !== 'production') {
                        object.password = password;
                    }
                    stripUser(object);

                    var Mail = new Mailer();
                    Mail.send(user.email, 'passwordRecovery', null, {
                        password: password,
                        user: user.username
                    }, function (mailErr) {
                        if (mailErr) {
                            console.log('mailsending error: passwordRecovery ', mailErr);
                        }
                        return res.send(object);
                    });
                });
            });
        }
    };

     /**
     * @api {post} /user Register User
     * @apiName Register
     * @apiDescription Register a new User
     * @apiGroup User
     * @apiVersion 1.0.0
     * @apiPermission unauthorized
     * @apiParam {String} email email address to send new pw
     * @apiParam {String} username userame of the user
     * @apiParam {String} password account password
     * @apiParamExample {json} request body
                   { "email": "bengtler@gmail.com",
                     "username": "killercodemonkey",
                     "password": "123456" }
     * @apiSuccess {Object} user the user object.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "username": "bengt",
     *       "_id": "507f191e810c19729de860ea",
     *       "email": "bengtler@gmail.com"
     *     }
     *
     * @apiError (Error 5xx) InternalServerError An error while processing mongoDB query occurs.
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 500 Internal Server Error
     *     {
     *       "error": "MONGODB ERROR OBJECT"
     *     }
     *
     * @apiError (Error 400) MissingParameter a parameter is missing
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "missing_parameter"
     *     }
     * @apiError (Error 400) InvalidStructure structure of a parameter is invalid
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "invalid_structure",
     *       "param": "email"
     *     }
     * @apiError (Error 400) WrongDatatype type of parameter is invalid
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "wrong_type",
     *       "param": "email"
     *     }
     *
     * @apiError (Error 400) AlreadyLoggedIn valid authorization header is set
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "user_already_loggedin"
     *     }
     * @apiError (Error 400) UserExists a user with the given email already exists
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "email_exists"
     *     }
     */
    rest.register = {
        params: {
            'email': {
                type: String,
                regex: /^[a-zA-Z0-9\.\-\_]+@[a-zA-Z0-9\.\-\_]+\.[a-zA-Z]{2,}$/
            },
            'username': {
                type: String,
                regex: /.{3,15}/
            },
            'password': {
                type: String,
                regex: /^\S{6,}$/
            }
        },
        models: ['user'],
        exec: function (req, res, User) {
            var params = req.params,
                user;

            if (req.user) {
                return res.status(400).send({
                    error: 'already_logged_in'
                });
            }
            Promise.all([getUser({
                email: params.email
            }, User), getUser({
                username: params.username
            }, User)]).then(function (results) {
                if (results[0]) {
                    return res.status(400).send({
                        error: 'email_exists'
                    });
                }
                if (results[1]) {
                    return res.status(400).send({
                        error: 'username_exists'
                    });
                }

                user = new User({
                    email: params.email,
                    username: params.username,
                    password: params.password
                });

                // save user
                user.save(function (saveErr, newUser) {
                    if (saveErr) {
                        return res.status(500).send({
                            error: saveErr
                        });
                    }

                    var object = newUser.toObject(),
                        Mail = new Mailer();

                    if (process.env.NODE_ENV !== 'production') {
                        object.password = params.password;
                    }
                    stripUser(object);

                    Mail.send(newUser.email, 'welcome', null, {}, function (mailErr) {
                        if (mailErr) {
                            console.log('mailsending error: welcome ', mailErr);
                        }
                        return res.send(object);
                    });
                });
            }, function (err) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }
            });
        }
    };

     /**
     * @api {put} /user/account Update User
     * @apiName UpdateAccount
     * @apiDescription Update current loggedin user
     * @apiGroup User; Admin
     * @apiVersion 1.0.0
     * @apiPermission User
     * @apiParam {String} [website] optional website or blog link
     * @apiParam {String} [bio] little text about the user
     * @apiParam {String} [email] email address to send new pw
     * @apiParam {String} [password] account password to set new email, password
     * @apiParam {String} [newPassword] new account password
     * @apiParam {String} [username] set unique username
     * @apiParam {Boolean} [active] activate/deactivate as admin
     * @apiParamExample {json} request body
                   { "email": "bengtler@gmail.com",
                     "username": "killercodemonkey",
                     "password": "123456",
                     "newPassword": "123457" }
     * @apiHeader {String} Authorization Set TOKENTYPE ACCESSTOKEN for possible authorization
     * @apiHeaderExample {json} Authorization-Header-Example:
                      { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
     * @apiSuccess {Object} user the user object.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "username": "killercodemonkey",
     *       "_id": "507f191e810c19729de860ea",
     *       "email": "bengtler@gmail.com"
     *     }
     *
     * @apiError (Error 5xx) InternalServerError An error while processing mongoDB query occurs.
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 500 Internal Server Error
     *     {
     *       "error": "MONGODB ERROR OBJECT"
     *     }
     *
     * @apiError (Error 400) MissingParameter a parameter is missing
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "missing_parameter"
     *     }
     * @apiError (Error 400) InvalidStructure structure of a parameter is invalid
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "invalid_structure",
     *       "param": "email"
     *     }
     * @apiError (Error 400) WrongDatatype type of parameter is invalid
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "wrong_type",
     *       "param": "email"
     *     }
     *
     * @apiError (Error 400) InvalidPassword old password is wrong
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "invalid_password"
     *     }
     * @apiError (Error 400) EmailExists a user with the given email already exists
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "email_exists"
     *     }
     * @apiError (Error 400) UsernameExists a user with the given email already exists
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "username_exists"
     *     }
     */
    rest.update = {
        params: {
            'email': {
                type: String,
                regex: /^[a-zA-Z0-9\.\-\_]+@[a-zA-Z0-9\.\-\_]+\.[a-zA-Z]{2,}$/,
                optional: true
            },
            'password': {
                type: String,
                regex: /^\S{6,}$/,
                optional: true
            },
            'newPassword': {
                type: String,
                regex: /^\S{6,}$/,
                optional: true
            },
            'username': {
                type: String,
                regex: /^\S{4,20}$/,
                optional: true
            },
            'bio': {
                type: String,
                optional: true
            },
            'website': {
                type: String,
                optional: true
            },
            'active': {
                type: Boolean,
                optional: true
            }
        },
        permissions: [appConfig.permissions.user],
        models: ['user'],
        exec: function (req, res, User) {
            var params = req.params,
                user = req.user,
                setUsername = false,
                setEmail = false,
                tasks = [];

            // only admin can activate or deactivate users
            if (req.user.permissions.indexOf(appConfig.permissions.admin) === -1) {
                delete req.params.active;
            }

            // check if old password was sent if new email or/and new password
            if ((params.email || params.newPassword) && !params.password) {
                return res.status(400).send({
                    error: 'missing_parameter',
                    param: 'password'
                });
            }
            if (params.email === user.email) {
                delete params.email;
            }
            if (params.username === user.username) {
                delete params.username;
            }

            // if old password is wrong -> return
            if (params.email || params.newPassword) {
                if (!params.password || !user.checkPassword(params.password)) {
                    return res.status(400).send({
                        error: 'invalid_password'
                    });
                }
            }

            // change email -> check if someone exists with email
            if (params.email) {
                tasks.push(getUser({
                    email: params.email
                }, User));
                setEmail = true;
            }
            // change username -> check if username exists
            if (params.username) {
                tasks.push(getUser({
                    username: params.username
                }, User));
                setUsername = true;
            }
            Promise.all(tasks).then(function (results) {
                if (tasks.length && results && results.length) {
                    if (setEmail && results[0]) {
                        return res.status(400).send({
                            error: 'email_exists'
                        });
                    }
                    if ((setEmail && setUsername && results[1]) || (setUsername && results[0])) {
                        return res.status(400).send({
                            error: 'username_exists'
                        });
                    }
                }
                tasks.length = 0;

                // set password to new one
                if (params.newPassword) {
                    params.password = params.newPassword;
                }

                // set new values
                _.extend(user, params);

                // if new password -> reset temp pw flag
                if (params.newPassword) {
                    user.isTempPassword = false;
                }

                // save user
                user.save(function (err, saved) {
                    if (err) {
                        return res.status(500).send({
                            error: err
                        });
                    }
                    return res.send(saved.toObject());
                });
            }, function (err) {
                res.status(500).send({
                    error: err
                });
            });
        }
    };

    /**
    * @api {post} /user/avatar Upload Avatar
    * @apiName UploadAvatar
    * @apiDescription upload an user image
    * @apiGroup User
    * @apiVersion 1.0.0
    * @apiPermission User
    * @apiSuccess {Object} user the user object.
    *
    * @apiSuccessExample Success-Response:
    *     HTTP/1.1 200 OK
    *     {
    *       "username": "bengt",
    *       "_id": "507f191e810c19729de860ea",
    *       "email": "bengtler@gmail.com",
    *       "avatar": [{...}]
    *     }
    *
    * @apiError (Error 5xx) InternalServerError An error while processing mongoDB query occurs.
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 500 Internal Server Error
    *     {
    *       "error": "MONGODB ERROR OBJECT"
    *     }
    */
    rest.uploadAvatar = {
        file: true,
        permissions: [appConfig.permissions.user],
        exec: function (req, res) {
            var task = [];
            if (req.user.avatar.length) {
                task.push(helper.imageRemove(req.user.avatar[0]));
            }
            Promise.settle(task).then(function () {
                var opts = {
                    name: 'avatar',
                    field: 'image',
                    sizes: [{
                        width: 160,
                        height: null
                    }, {
                        width: 320,
                        height: null
                    }, {
                        width: 640,
                        height: null
                    }, {
                        width: 1280,
                        height: null
                    }],
                    thumb: true
                };
                if (task.length) {
                    req.user.avatar[0].remove();
                }
                req.user.save(function (err) {
                    if (err) {
                        return res.status(500).send({
                            error: err
                        });
                    }
                    helper.imageUpload(req.originalRequest, 'users/' + req.user._id, opts).then(function (imageObject) {
                        req.user.avatar.addToSet(imageObject);
                        req.user.save(function (err, saved) {
                            if (err) {
                                helper.imageRemove(imageObject);
                                return res.status(500).send({
                                    error: err
                                });
                            }
                            res.send(saved.toObject());
                        });
                    }, function (err) {
                        return res.status(500).send({
                            error: err
                        });
                    });
                });
            });
        }
    };

    /**
    * @api {delete} /user/avatar Remove avatar
    * @apiName RemoveAvatar
    * @apiDescription removes user image
    * @apiGroup User
    * @apiVersion 1.0.0
    * @apiPermission user
    * @apiHeader {String} Authorization Set TOKENTYPE ACCESSTOKEN for possible authorization
    * @apiHeaderExample {json} Authorization-Header-Example:
                     { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
    *
    * @apiSuccessExample Success-Response:
    *     HTTP/1.1 200 OK
    *
    * @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 500 Internal Server Error
    *     {
    *       "error": "MONGODB ERROR OBJECT"
    *     }
    */
    rest.removeAvatar = {
        permissions: [appConfig.permissions.user],
        exec: function (req, res) {
            if (!req.user.avatar.length) {
                return res.send();
            }
            helper.imageRemove(req.user.avatar[0]).then(function () {
                req.user.avatar[0].remove();
                req.user.save(function (err) {
                    if (err) {
                        return res.status(500).send({
                            error: err
                        });
                    }
                    res.send();
                });
            });
        }
    };

    return {
        v1: {
            post: {
                '': rest.register,
                'avatar': rest.uploadAvatar
            },
            get: {
                'account': rest.account,
                'object': rest.getOne,
                '': rest.get
            },
            head: {
                'check': rest.check
            },
            put: {
                'sendPassword': rest.sendPassword,
                'account': rest.update
            },
            'delete': {
                'object': rest.remove,
                'avatar': rest.removeAvatar
            }
        }
    };
});
