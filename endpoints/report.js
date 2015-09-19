define([
    'appConfig'
], function (appConfig) {
    'use strict';

    var rest = {};

    /**
    * @api {get} /report Get Reports
    * @apiName GetReports
    * @apiDescription Gets report list (admin)
    * @apiGroup Project
    * @apiVersion 1.0.0
    * @apiPermission Admin
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
    rest.read = {
        permissions: [appConfig.permissions.admin],
        pager: true,
        models: ['report'],
        exec: function (req, res, Report) {
            Report.find().sort('-creationDate').lean().exec(function (err, reports) {
                if (err) {
                    return res.status(500).send();
                }

                return res.send(reports);
            });
        }
    };

    /**
    * @api {delete} /report/id/:id Remove Report
    * @apiName RemoveReport
    * @apiDescription Removes a project report (admin)
    * @apiGroup Project
    * @apiVersion 1.0.0
    * @apiPermission Admin
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
    rest.remove = {
        permissions: [appConfig.permissions.admin],
        object: true,
        models: [],
        exec: function (req, res) {
            req.object.remove(function (err) {
                if (err) {
                    return res.status(500).send();
                }

                res.send();
            });
        }
    };
    return {
        v1: {
            get: {
                '': rest.read
            },
            'delete': {
                'object': rest.removeOne
            }
        }
    };
});
