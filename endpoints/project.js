define([
    'appConfig',
    'underscore'
], function (appConfig, _) {
    'use strict';

    var rest = {},
        fields = '_id username email avatar';

        /**
        * @api {post} /project Create Project
        * @apiName CreateProject
        * @apiDescription Creates a project (User)
        * @apiGroup Project
        * @apiVersion 1.0.0
        * @apiPermission authorized
        * @apiHeader {String} Authorization Set TOKENTYPE ACCESSTOKEN for possible authorization
        * @apiHeaderExample {json} Authorization-Header-Example:
                         { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
        * @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
        *
        * @apiErrorExample Error-Response:
        *     HTTP/1.1 500 Internal Server Error
        *     {
        *       "error": "MONGODB ERROR OBJECT"
        *     }
        * @apiError (Error 403) Forbidden No access to this project
        *
        * @apiErrorExample Error-Response:
        *     HTTP/1.1 403 Forbidden
        */
    rest.create = {
        permissions: [appConfig.permissions.user],
        params: {
            'title': {
                type: String,
                validate: function (title) {
                    if (!title || !title.replace(/\s/g, '').length) {
                        return false;
                    }
                    return true;
                }
            },
            'description': {
                type: String,
                optional: true
            }
        },
        models: ['project'],
        exec: function (req, res, Project) {
            req.params.user = req.user._id;
            var newProject = new Project(req.params);

            newProject.save(function (err, savedProject) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }

                savedProject.populate('user', fields, function (populateErr, populated) {
                    if (populateErr) {
                        return res.status(500).send({
                            error: populateErr
                        });
                    }
                    return res.send(populated.toObject());
                });
            });
        }
    };
    /**
    * @api {post} /project/id/:id/step Create Step
    * @apiName CreateProjectStep
    * @apiDescription create a project step (User)
    * @apiGroup Project
    * @apiVersion 1.0.0
    * @apiPermission authorized
    * @apiHeader {String} Authorization Set TOKENTYPE ACCESSTOKEN for possible authorization
    * @apiHeaderExample {json} Authorization-Header-Example:
                     { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
    * @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 500 Internal Server Error
    *     {
    *       "error": "MONGODB ERROR OBJECT"
    *     }
    * @apiError (Error 403) Forbidden No access to this project
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 403 Forbidden
    */
    rest.createStep = {
        permissions: [appConfig.permissions.user],
        params: {
            'title': {
                type: String,
                validate: function (title) {
                    if (!title || !title.replace(/\s/g, '').length) {
                        return false;
                    }
                    return true;
                }
            },
            'description': {
                type: String,
                optional: true
            }
        },
        object: true,
        exec: function (req, res) {
            req.object.steps.addToSet(req.params);

            req.object.save(function (err, saved) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }
                saved.populate('user', fields, function (populateErr, populated) {
                    if (populateErr) {
                        return res.status(500).send({
                            error: populateErr
                        });
                    }
                    return res.send(populated.toObject());
                });
            });
        }
    };
    /**
    * @api {put} /project/id/:id Update Step
    * @apiName UpdateProject
    * @apiDescription Updates a project (as admin, own)
    * @apiGroup Project
    * @apiVersion 1.0.0
    * @apiPermission authorized
    * @apiHeader {String} Authorization Set TOKENTYPE ACCESSTOKEN for possible authorization
    * @apiHeaderExample {json} Authorization-Header-Example:
                     { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
    * @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 500 Internal Server Error
    *     {
    *       "error": "MONGODB ERROR OBJECT"
    *     }
    * @apiError (Error 403) Forbidden No access to this project
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 403 Forbidden
    */
    rest.update = {
        permissions: [appConfig.permissions.user, appConfig.permissions.admin],
        params: {
            'title': {
                type: String,
                validate: function (title) {
                    if (!title || !title.replace(/\s/g, '').length) {
                        return false;
                    }
                    return true;
                }
            },
            'description': {
                type: String,
                optional: true
            },
            'materials': {
                type: Array,
                optional: true
            },
            'public': {
                type: Boolean,
                optional: true
            }
        },
        object: true,
        exec: function (req, res) {
            if (req.user.permissions.indexOf(appConfig.permissions.admin) === -1 && !req.object.user.equals(req.user._id)) {
                return res.status(403).send();
            }
            // if materials are set -_> remove all current
            if (req.params.materials) {
                req.object.materials.forEach(function (material) {
                    material.remove();
                });
            }

            _.extend(req.object, req.params);

            req.object.save(function (err, saved) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }

                saved.populate('user', fields, function (populateErr, populated) {
                    if (populateErr) {
                        return res.status(500).send({
                            error: populateErr
                        });
                    }
                    return res.send(populated.toObject());
                });
            });
        }
    };

    /**
    * @api {put} /project/id/:id/step Update Step
    * @apiName UpdateProjectStep
    * @apiDescription Updates a project step (as admin, own)
    * @apiGroup Project
    * @apiVersion 1.0.0
    * @apiPermission authorized
    * @apiHeader {String} Authorization Set TOKENTYPE ACCESSTOKEN for possible authorization
    * @apiHeaderExample {json} Authorization-Header-Example:
                     { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
    * @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 500 Internal Server Error
    *     {
    *       "error": "MONGODB ERROR OBJECT"
    *     }
    * @apiError (Error 403) Forbidden No access to this project
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 403 Forbidden
    */
    rest.updateStep = {
        permissions: [appConfig.permissions.user, appConfig.permissions.admin],
        params: {
            '_id': {
                type: String,
                validate: function (_id) {
                    if (!_id || !_id.replace(/\s/g, '').length) {
                        return false;
                    }
                    return true;
                }
            },
            'title': {
                type: String,
                validate: function (title) {
                    if (!title || !title.replace(/\s/g, '').length) {
                        return false;
                    }
                    return true;
                }
            },
            'description': {
                type: String,
                optional: true
            },
            'complete': {
                type: Boolean,
                optional: true
            }
        },
        object: true,
        exec: function (req, res) {
            if (req.user.permissions.indexOf(appConfig.permissions.admin) === -1 && !req.object.user.equals(req.user._id)) {
                return res.status(403).send();
            }

            var step = req.object.steps.id(req.params._id);
            if (!step) {
                return res.send();
            }

            delete req.params._id;
            _.extend(step, req.params);

            req.object.save(function (err, saved) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }

                saved.populate('user', fields, function (populateErr, populated) {
                    if (populateErr) {
                        return res.status(500).send({
                            error: populateErr
                        });
                    }
                    return res.send(populated.toObject());
                });
            });
        }
    };

    /**
    * @api {get} /project Get Projects
    * @apiName GetProjects
    * @apiDescription Gets a list of projects (filtered, as admin, own or other public)
    * @apiGroup Project
    * @apiVersion 1.0.0
    * @apiPermission authorized
    * @apiHeader {String} Authorization Set TOKENTYPE ACCESSTOKEN for possible authorization
    * @apiHeaderExample {json} Authorization-Header-Example:
                     { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
    * @apiSuccess {Object[]} ProjectList list of project objects.
    *
    * @apiSuccessExample Success-Response:
    *     HTTP/1.1 200 OK
    *     [{
    *       "public": false,
    *       "description": "asdf asdfsad fa",
    *       "title": "My Project",
    *       "materials": [{"name": "Hammer", "amount": "1"}],
    *       "steps": [{"title": "First", "description": "afsadf dsa fas", "images": [{}]}],
    *       "images": [{ ... }],
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
    rest.read = {
        permissions: [appConfig.permissions.user, appConfig.permissions.admin],
        models: ['project'],
        params: {
            me: {
                type: String,
                optional: true,
                query: true,
                regex: /^true|false$/
            }
        },
        pager: true,
        exec: function (req, res, Project) {
            var selector = {};

            if (req.user.permissions.indexOf(appConfig.permissions.admin) === -1 && (req.params.me === 'false' || !req.params.me)) {
                selector.public = true;
                selector.active = true;
            }
            if (req.params.me === 'true') {
                selector.user = req.user._id;
            } else {
                selector.user = {
                    $ne: req.user._id
                };
            }

            Project.getPaged(selector, req.pager, true, false, ['title', 'images', 'user', '_id', 'creationDate'], [{
                path: 'user',
                select: fields
            }], function (err, result) {
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
    * @api {get} /project/id/:id Get Project
    * @apiName GetProject
    * @apiDescription Gets a project (as admin, own or other public)
    * @apiGroup Project
    * @apiVersion 1.0.0
    * @apiPermission authorized
    * @apiHeader {String} Authorization Set TOKENTYPE ACCESSTOKEN for possible authorization
    * @apiHeaderExample {json} Authorization-Header-Example:
                     { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
    * @apiSuccess {Object} Project project object
    *
    * @apiSuccessExample Success-Response:
    *     HTTP/1.1 200 OK
    *     {
    *       "public": false,
    *       "description": "asdf asdfsad fa",
    *       "title": "My Project",
    *       "materials": [{"name": "Hammer", "amount": "1"}],
    *       "steps": [{"title": "First", "description": "afsadf dsa fas", "images": [{}]}],
    *       "images": [{ ... }],
    *       "_id": "507f191e810c19729de860ea",
    *       "user": "{...}"
    *     }
    *
    * @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 500 Internal Server Error
    *     {
    *       "error": "MONGODB ERROR OBJECT"
    *     }
    * @apiError (Error 403) Forbidden No access to this project
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 403 Forbidden
    */
    rest.readOne = {
        permissions: [appConfig.permissions.user, appConfig.permissions.admin],
        object: true,
        exec: function (req, res) {
            if (req.object.user.equals(req.user._id) || req.object.public || req.user.permissions.indexOf(appConfig.permissions.admin) !== -1) {
                if (!req.object.active) {
                    return res.status(404).send();
                }
                return req.object.populate('user', fields, function (err, populated) {
                    if (err) {
                        return res.status(500).send({
                            error: err
                        });
                    }
                    return res.send(populated.toObject());
                });
            }

            res.status(403).send();
        }
    };
    /**
    * @api {delete} /project Remove Projects
    * @apiName RemoveProjects
    * @apiDescription Removes all projects or all for user (as admin, own)
    * @apiGroup Project
    * @apiVersion 1.0.0
    * @apiPermission authorized
    * @apiHeader {String} Authorization Set TOKENTYPE ACCESSTOKEN for possible authorization
    * @apiHeaderExample {json} Authorization-Header-Example:
                     { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
    * @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 500 Internal Server Error
    *     {
    *       "error": "MONGODB ERROR OBJECT"
    *     }
    */
    rest.remove = {
        permissions: [appConfig.permissions.user, appConfig.permissions.admin],
        models: ['project'],
        exec: function (req, res, Project) {
            var selector = {};

            if (req.user.permissions.indexOf(appConfig.permissions.admin) === -1) {
                selector.user = req.user._id;
            }

            Project.remove(selector, function (err) {
                if (err) {
                    return res.status(500).send();
                }

                res.send();
            });
        }
    };

    /**
    * @api {delete} /project/id/:id Remove Project
    * @apiName RemoveProject
    * @apiDescription Remove a project (as admin, own)
    * @apiGroup Project
    * @apiVersion 1.0.0
    * @apiPermission authorized
    * @apiHeader {String} Authorization Set TOKENTYPE ACCESSTOKEN for possible authorization
    * @apiHeaderExample {json} Authorization-Header-Example:
                     { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
    * @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 500 Internal Server Error
    *     {
    *       "error": "MONGODB ERROR OBJECT"
    *     }
    * @apiError (Error 403) Forbidden No access to this project
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 403 Forbidden
    */
    rest.removeOne = {
        permissions: [appConfig.permissions.user, appConfig.permissions.admin],
        object: true,
        models: [],
        exec: function (req, res) {
            if (req.user.permissions.indexOf(appConfig.permissions.admin) === -1 && !req.user._id.equals(req.object.user)) {
                return res.status(403).send();
            }

            req.object.remove(function (err) {
                if (err) {
                    return res.status(500).send();
                }

                res.send();
            });
        }
    };

    /**
    * @api {delete} /project/id/:id/step?_id=:stepId Remove Step
    * @apiName RemoveProjectStep
    * @apiDescription Removes a project step (as admin, own)
    * @apiGroup Project
    * @apiVersion 1.0.0
    * @apiPermission authorized
    * @apiHeader {String} Authorization Set TOKENTYPE ACCESSTOKEN for possible authorization
    * @apiHeaderExample {json} Authorization-Header-Example:
                     { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
    * @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 500 Internal Server Error
    *     {
    *       "error": "MONGODB ERROR OBJECT"
    *     }
    * @apiError (Error 403) Forbidden No access to this project
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 403 Forbidden
    */
    rest.removeStep = {
        permissions: [appConfig.permissions.user, appConfig.permissions.admin],
        params: {
            '_id': {
                type: String,
                query: true,
                required: true
            }
        },
        object: true,
        models: [],
        exec: function (req, res) {
            var step = req.object.steps.id(req.params._id);

            if (req.user.permissions.indexOf(appConfig.permissions.admin) === -1 && !req.object.user.equals(req.user._id)) {
                return res.status(403).send();
            }

            if (!step) {
                return res.send();
            }
            step.remove();

            req.object.save(function (err) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }

                res.send();
            });
        }
    };

    /**
    * @api {post} /project/id/:id/report Create Project report
    * @apiName CreateReport
    * @apiDescription Creates a report for a project (User)
    * @apiGroup Project
    * @apiVersion 1.0.0
    * @apiPermission authorized
    * @apiHeader {String} Authorization Set TOKENTYPE ACCESSTOKEN for possible authorization
    * @apiHeaderExample {json} Authorization-Header-Example:
                     { "Authorization": "Bearer mF_9.B5f-4.1JqM" }
    * @apiError (Error 500) InternalServerError An error while processing mongoDB query occurs.
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 500 Internal Server Error
    *     {
    *       "error": "MONGODB ERROR OBJECT"
    *     }
    * @apiError (Error 403) Forbidden No access to this project
    *
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 403 Forbidden
    */
    rest.createReport = {
        permissions: [appConfig.permissions.user, appConfig.permissions.admin],
        object: true,
        params: {
            'abuse': {
                type: String,
                validate: function (abuse) {
                    if (!abuse || !abuse.replace(/\s/g, '').length) {
                        return false;
                    }
                    return true;
                }
            }
        },
        models: ['report'],
        exec: function (req, res, Report) {
            if (req.object.user.equals(req.user._id)) {
                return res.send();
            }
            req.params.reporter = req.user._id;
            req.params.project = req.object._id;

            var newReport = new Report(req.params);

            newReport.save(function (err) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }

                return res.send();
            });
        }
    };

    return {
        v1: {
            post: {
                // create new project
                '': rest.create,
                // create new step
                'step': rest.createStep,
                // create report
                'report': rest.createReport
            },
            put: {
                'object': rest.update,
                'step': rest.updateStep
            },
            get: {
                '': rest.read,
                'object': rest.readOne
            },
            'delete': {
                '': rest.remove,
                'object': rest.removeOne,
                'step': rest.removeStep
            }
        }
    };
});
