/*globals before, require, after, it, describe */
var request = require('supertest'),
    expect = require('expect.js'),
    require = require('../../config/require'),
    testHandler = require('util/testHandler'),
    app,
    admin,
    report,
    project,
    restURL,
    user;


describe('Report model', function () {
    'use strict';
    before(function (done) {
        this.timeout(8000);
        require(['appServer'], function (appServer) {
            appServer.then(function (server) {
                app = server;
                testHandler.init(app, 'report').then(function () {
                    restURL = testHandler.getUrl();
                    admin = testHandler.getAdmin();
                    testHandler.register('lasmaranda.densivilla@schnitten.sx', 'kicken', 'testname').then(function (newUser) {
                        user = newUser;
                        testHandler.login(user.email, user.password, false, user).then(function () {
                            request(app)
                                .post('/api/v1/project')
                                .set('Authorization', 'Bearer ' + user.accessToken)
                                .send({
                                    'title': 'Test',
                                    'description': 'test description'
                                })
                                .expect(200)
                                .end(function (err, res) {
                                    if (err) {
                                        return done(err);
                                    }

                                    project = res.body;
                                    request(app)
                                        .post('/api/v1/project/id/' + project._id + '/report')
                                        .set('Authorization', 'Bearer ' + admin.accessToken)
                                        .send({
                                            'abuse': 'Test'
                                        })
                                        .expect(200, done);
                                });
                        });
                    });
                }, done);
            }, done);
        });
    });

    after(function (done) {
        testHandler.finish(app).then(done, done);
    });

    describe('GET /report - get reports', function () {
        it('403 - as user', function (done) {
            request(app)
                .get(restURL)
                .set('Authorization', 'Bearer ' + user.accessToken)
                .expect(403, done);
        });
        it('200 - as admin', function (done) {
            request(app)
                .get(restURL)
                .set('Authorization', 'Bearer ' + admin.accessToken)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.entries.length).to.be(1);
                    report = data.entries[0];
                    done();
                });
        });
        it('403 - unauthorized', function (done) {
            request(app)
                .get(restURL)
                .expect(403, done);
        });
    });
    describe('DELETE /report/id/:id - delete report', function () {
        it('403 - as user', function (done) {
            request(app)
                .del(restURL + '/id/' + report._id)
                .set('Authorization', 'Bearer ' + user.accessToken)
                .expect(403, done);
        });
        it('403 - unauth', function (done) {
            request(app)
                .del(restURL + '/id/' + report._id)
                .expect(403, done);
        });
        it('200 - as admin', function (done) {
            request(app)
                .del(restURL + '/id/' + report._id)
                .set('Authorization', 'Bearer ' + admin.accessToken)
                .expect(200)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }

                    request(app)
                        .get(restURL)
                        .set('Authorization', 'Bearer ' + admin.accessToken)
                        .expect(200)
                        .end(function (err, res) {
                            if (err) {
                                return done(err);
                            }

                            var data = res.body;

                            expect(data).not.to.be(null);
                            expect(data).to.be.an('object');
                            expect(data.entries.length).to.be(0);
                            done();
                        });
                });
        });
    });
});
