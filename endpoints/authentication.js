define([
    'jsonwebtoken',
    'crypto',
    'appConfig',
    'bluebird'
], function (jwt, crypto, appConfig, Promise) {
    'use strict';

    var rest = {};

    // store new authentication for user
    function generateAuthentication(user, Authentication) {
        var secret = crypto.randomBytes(128).toString('base64'),
            userData = {
                id: user.user || user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                creationDate: user.creationDate,
                permissions: user.permissions,
                secret: secret,
                expiresInMinutes: appConfig.tokenExpiresInMinutes,
                tokenType: 'Bearer'
            },
            accessToken,
            refreshToken,
            auth;

        accessToken = jwt.sign(userData, appConfig.secret, { expiresInMinutes: appConfig.tokenExpiresInMinutes });
        userData.accessToken = accessToken;

        refreshToken = jwt.sign(userData, appConfig.secret);
        userData.refreshToken = refreshToken;

        auth = new Authentication({
            user: userData.id,
            secret: secret,
            accessToken: accessToken,
            refreshToken: refreshToken
        });

        return new Promise(function (resolve, reject) {
            auth.save(function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(userData);
                }
            });
        });
    }

     /**
     * @api {post} /authentication/login Login
     * @apiName Login
     * @apiDescription user login
     * @apiGroup Authentication
     * @apiVersion 1.0.0
     * @apiPermission unauthorized
     * @apiParam {String} [email] email address to send new pw
     * @apiParam {String} [password] account password to set new email, password
     * @apiParamExample {json} request body
                   { "login": "bengtler@gmail.com",
                     "password": "123456" }
     * @apiSuccess {Object} authentication the authentication with tokens and user.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "refreshToken": "refreshtoken",
     *       "accessToken": "token",
     *       "_id": "507f191e810c19729de860ea",
     *       "user": { ... } // user object
     *     }
     *
     * @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
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
     * @apiError (Error 400) InvalidLogin username/email and password combination is wrong
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "invalid_login_password_combination"
     *     }
     * @apiError (Error 400) AlreadyLoggedIn authorization header is set with valid user
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "error": "already_logged_in"
     *     }
     */
    rest.login = {
        permissions: [],
        params: {
            'login': {
                type: String
            },
            'password': {
                type: String
            }
        },
        models: ['user', 'authentication'],
        exec: function (req, res, User, Authentication) {
            var tasks = [];

            if (req.user) {
                return res.status(400).send({
                    error: 'already_logged_in'
                });
            }

            User.findOne({
                $or: [{
                    email: req.params.login
                }, {
                    username: req.params.login
                }]
            }, function (err, user) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }
                if (!user) {
                    return res.status(400).send({
                        error: 'user_not_exists'
                    });
                }
                if (!user.active || !user.checkPassword(req.params.password)) {
                    return res.status(400).send({
                        error: 'invalid_login_password_combination'
                    });
                }
                Promise.all(tasks).then(function () {
                    generateAuthentication(user, Authentication).then(function (userData) {
                        // generate new password after login.
                        userData.user = user.toObject();
                        delete userData.user.salt;
                        delete userData.user.hashedPassword;
                        res.send(userData);
                    }, function (err) {
                        res.status(500).send({
                            error: err
                        });
                    });
                }, function (err) {
                    res.status(500).send({
                        error: err
                    });
                });
            });
        }
    };

    /**
    * @api {post} /authentication/refresh Refresh
    * @apiName RefreshLogin
    * @apiDescription generated new access- and refreshtoken pair
    * @apiGroup Authentication
    * @apiVersion 1.0.0
    * @apiPermission unauthorized
    * @apiParam {String} accessToken current access token
    * @apiParam {String} refreshToken the refresh token
    * @apiParamExample {json} request body
                  { "accessToken": "adsfasdfdasfdasf",
                    "refreshToken": "asdfdasfdasf" }
    * @apiSuccess {Object} authentication the authentication with tokens and user.
    * @apiHeaderExample {json} Authorization-Header-Example:
                     { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
    * @apiSuccessExample Success-Response:
    *     HTTP/1.1 200 OK
    *     {
    *       "refreshToken": "refreshtoken",
    *       "accessToken": "token",
    *       "_id": "507f191e810c19729de860ea",
    *       "user": { ... } // user object
    *     }
    *
    * @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 500 Internal Server Error
    *     {
    *       "error": "MONGODB ERROR OBJECT"
    *     }
    * @apiError (Error 400) InvalidRefresh refreshtoken is incorrect
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 400 Bad Request
    *     {
    *       "error": "invalid_refresh_token"
    *     }
    * @apiError (Error 400) InvalidUser there is no user for authorization
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 400 Bad Request
    *     {
    *       "error": "user_not_found"
    *     }
    */
    rest.refresh = {
        params: {
            'accessToken': {
                type: String
            },
            'refreshToken': {
                type: String
            }
        },
        permissions: [],
        models: ['authentication', 'user'],
        exec: function (req, res, Authentication, User) {
            var params = req.params;

            Authentication.findOne({
                accessToken: params.accessToken
            }, function (err, authentication) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }
                if (!authentication) {
                    return res.status(403).send();
                }
                if (authentication.refreshToken !== params.refreshToken) {
                    return res.status(400).send({
                        error: 'invalid_refresh_token'
                    });
                }
                User.findById(authentication.user, function (usererr, user) {
                    if (usererr) {
                        return res.status(500).send({
                            error: err
                        });
                    }
                    if (!user) {
                        return res.status(400).send({
                            error: 'user_not_found'
                        });
                    }

                    authentication.remove(function (err) {
                        if (err) {
                            return res.status(500).send({
                                error: err
                            });
                        }
                        generateAuthentication(user, Authentication).then(function (userData) {
                            res.send(userData);
                        }, function (err) {
                            res.status(500).send({
                                error: err
                            });
                        });
                    });
                });
            });
        }
    };

     /**
     * @api {get} /authentication/logout Logout
     * @apiName Logout
     * @apiDescription removes current authentication --> logout
     * @apiGroup Authentication
     * @apiVersion 1.0.0
     * @apiPermission User, Admin
     * @apiHeaderExample {json} Authorization-Header-Example:
                      { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
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
     * @apiError (Error 403) UserNotFound there is no user for the accesstoken
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 403 Not Found
     */
    rest.logout = {
        permissions: [appConfig.permissions.user, appConfig.permissions.admin],
        models: ['authentication'],
        exec: function (req, res, Authentication) {
            Authentication.findOne({
                accessToken: req.accessToken
            }, function (err, authentication) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }
                if (!authentication) {
                    return res.status(403).send();
                }
                authentication.remove(function (err) {
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
                // /authentication
                'login': rest.login,
                // refresh access token / authentication
                'refresh': rest.refresh
            },
            // logout request
            get: {
                'logout': rest.logout
            }
        }
    };
});
