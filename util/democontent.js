/*global define, setTimeout*/
/*jslint node:true, vars:true,nomen:true*/
define([
    'bluebird',
    'mongoose',
    'databaseConfig',
    'util/modelEndpointHandler'
], function (Promise, mongoose, databaseConfig, meHandler) {
    'use strict';
    var connection;

    return function () {
        var reinstallTask = new Promise(),
            tasks = [];

        // DB connection
        var adminConnection = mongoose.createConnection(databaseConfig.host, databaseConfig.dbname, databaseConfig.port);

        adminConnection.on('error', function (err) {
            reinstallTask.reject(err);
        });

        adminConnection.on('open', function () {
            adminConnection.db.dropDatabase(function (err) {
                adminConnection.close();
                if (err) {
                    return reinstallTask.reject(err);
                }

                connection = mongoose.createConnection(databaseConfig.host, databaseConfig.dbname, databaseConfig.port);

                connection.on('error', function (connectionErr) {
                    connection.close();
                    reinstallTask.reject(connectionErr);
                });

                connection.on('open', function () {
                    meHandler.load().then(function () {
                        meHandler.init(connection, function (models) {
                            var user = new models.User({
                                    username: 'meisterLampe',
                                    email: 'test@test.test',
                                    password: '123456'
                                }),
                                user1 = new models.User({
                                    username: 'meisterPetz',
                                    email: 'test2@test.test',
                                    password: '123456'
                                }),
                                user2 = new models.User({
                                    username: 'meisterKlecks',
                                    email: 'test3@test.test',
                                    password: '123456'
                                });

                            tasks.push(user.save());
                            tasks.push(user1.save());
                            tasks.push(user2.save());

                            setTimeout(function () {
                                connection.close();
                                reinstallTask.resolve();
                            }, 2000);
                        });
                    });
                });
            });
        });

        return reinstallTask;
    };
});
