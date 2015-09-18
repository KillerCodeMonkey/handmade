/*globals before, after, it, describe, process, require */
var request = require('supertest'),
    expect = require('expect.js'),
    require = require('../../config/require'),
    testHandler = require('util/testHandler'),
    app,
    user,
    admin,
    publicProject,
    privateProject,
    testuser,
    restURL;

describe('project model', function () {
    'use strict';
    this.timeout(5000);
    before(function (done) {
        require(['appServer'], function (appServer) {
            appServer.then(function (server) {
                app = server;
                testHandler.init(app, 'project').then(function () {
                    restURL = testHandler.getUrl();
                    admin = testHandler.getAdmin();
                    testHandler.register('lasmaranda.densivilla@schnitten.sx', 'kicken', 'testname').then(function (newUser) {
                        testuser = newUser;
                        testHandler.login(testuser.email, testuser.password, false, testuser).then(function () {
                            done();
                        }, done);
                    }, done);
                }, done);
            }, done);
        });
    });

    after(function (done) {
        testHandler.finish().then(done, done);
    });

    describe('POST /project - create new project', function () {
        it('200', function (done) {
            request(app)
                .post(restURL)
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .send({
                    'title': 'Test',
                    'description': 'test description'
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.title).to.be('Test');
                    expect(data.description).to.be('test description');
                    publicProject = data;
                    done();
                });
        });
        it('200 - second project', function (done) {
            request(app)
                .post(restURL)
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .send({
                    'title': 'second tests'
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.title).to.be('second tests');
                    expect(data.description).to.be(undefined);
                    privateProject = data;
                    done();
                });
        });
        it('400 - empty title', function (done) {
            request(app)
                .post(restURL)
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .send({
                    'title': ''
                })
                .expect(400, done);
        });
        it('400 - without title', function (done) {
            request(app)
                .post(restURL)
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .expect(400, done);
        });
    });
});
