define([
    'appConfig',
    'underscore'
], function (appConfig, _) {
    'use strict';

    var rest = {};

    rest.create = {
        permissions: [appConfig.permissions.user],
        params: {
            'title': {
                type: String,
                required: true
            },
            'description': {
                type: String
            }
        },
        models: ['project'],
        exec: function (req, res, Project) {
            var newProject = new Project(req.params);

            newProject.save(function (err, savedProject) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }

                res.send(savedProject.toObject());
            });
        }
    };

    rest.createStep = {
        permissions: [appConfig.permissions.user],
        params: {
            'title': {
                type: String,
                required: true
            },
            'description': {
                type: String
            }
        },
        object: true,
        exec: function (req, res) {
            if (req.object.steps.length === 10) {
                return res.status(400).send({
                    error: 'steps_limit_reached'
                });
            }

            req.object.save(function (err, saved) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }
                res.send(saved.toObject());
            });
        }
    };

    rest.update = {
        permissions: [appConfig.permissions.user, appConfig.permissions.admin],
        params: {
            'title': {
                type: String
            },
            'description': {
                type: String,
                optional: true
            },
            'materials': {
                type: Array
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
            _.extend(req.object, req.params);

            req.object.save(function (err, saved) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }

                res.send(saved.toObject());
            });
        }
    };

    rest.updateStep = {
        permissions: [appConfig.permissions.user, appConfig.permissions.admin],
        params: {
            '_id': {
                type: String,
                required: true
            },
            'title': {
                type: String
            },
            'description': {
                type: String,
                optional: true
            },
            'complete': {
                type: Boolean
            }
        },
        object: true,
        exec: function (req, res) {
            if (req.user.permissions.indexOf(appConfig.permissions.admin) === -1 && !req.object.user.equals(req.user._id)) {
                return res.status(403).send();
            }
            var step = req.object.materials.id(req.params._id);
            if (step) {
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

                res.send(saved.toObject());
            });
        }
    };

    /**
    * @api {get} /project Get Project list
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
                type: Boolean,
                optional: true,
                query: true
            }
        },
        pager: true,
        exec: function (req, res, Project) {
            var selector = {};

            if (req.user.permissions.indexOf(appConfig.permissions.admin) === -1) {
                selector.public = true;
            }
            if (req.params.me) {
                selector.user = req.user._id;
            } else {
                selector.user = {
                    $ne: req.user._id
                };
            }

            Project.find(selector).lean().exec(function (err, projects) {
                if (err) {
                    return res.status(500).send({
                        error: err
                    });
                }

                res.send(projects);
            });
        }
    };

    rest.readOne = {
        permissions: [appConfig.permissions.user, appConfig.permissions.admin],
        object: true,
        exec: function (req, res) {
            if (req.object.user.equals(req.user._id) || req.object.public || req.user.permissions.indexOf(appConfig.permissions.admin) !== -1) {
                return res.send(req.object.toObject());
            }

            res.status(403).send();
        }
    };

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

    rest.removeOne = {
        permissions: [appConfig.permissions.user, appConfig.permissions.admin],
        object: true,
        models: [],
        exec: function (req, res) {
            if (req.user.permissions.indexOf(appConfig.permissions.admin) === -1 && req.user._id.equals(req.object._id)) {
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
            var step = req.object.materials.id(req.params._id);

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

    return {
        v1: {
            // post: {
            //     // create new project
            //     '': rest.create,
            //     // create new step
            //     'step': rest.createStep
            // },
            // put: {
            //     'object': rest.update,
            //     'step': rest.updateStep
            // },
            // get: {
            //     '': rest.read,
            //     'object': rest.readOne
            // },
            // 'delete': {
            //     '': rest.remove,
            //     'object': removeOne,
            //     'step': removeStep
            // }
        }
    };
});
