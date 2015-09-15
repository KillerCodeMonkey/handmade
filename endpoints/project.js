define([
    'jsonwebtoken',
    'appConfig',
    'databaseConfig',
    'node-promise'
], function (jwt, appConfig, dbConfig, promise) {
    'use strict';

    var Promise = promise.Promise,
        rest = {};

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
        models: ['project'],
        object: true,
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
