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
    step,
    testuser,
    testuser2,
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
                            testHandler.register('lasmaranda2.densivilla@schnitten.sx', 'kicken', 'testname2').then(function (newUser2) {
                                testuser2 = newUser2;
                                testHandler.login(testuser2.email, testuser2.password, false, testuser2).then(function () {
                                    done();
                                });
                            });
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
        it('400 - whitespace title', function (done) {
            request(app)
                .post(restURL)
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .send({
                    'title': '    '
                })
                .expect(400, done);
        });
        it('403 - unauthorized', function (done) {
            request(app)
                .post(restURL)
                .send({
                    'title': 'Test'
                })
                .expect(403, done);
        });
    });
    describe('POST /project/id/:id/step - create new step for a project', function () {
        it('200', function (done) {
            request(app)
                .post(restURL + '/id/' + publicProject._id + '/step')
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .send({
                    'title': 'First Step',
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
                    expect(data.steps.length).to.be(1);
                    expect(data.steps[0].title).to.be('First Step');
                    expect(data.steps[0].description).to.be('test description');
                    step = data.steps[0];
                    done();
                });
        });
        it('200 - second step', function (done) {
            request(app)
                .post(restURL + '/id/' + publicProject._id + '/step')
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
                    expect(data.steps.length).to.be(2);
                    expect(data.steps[1].title).to.be('second tests');
                    expect(data.steps[1].description).to.be(undefined);
                    done();
                });
        });
        it('400 - empty title', function (done) {
            request(app)
                .post(restURL + '/id/' + publicProject._id + '/step')
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .send({
                    'title': ''
                })
                .expect(400, done);
        });
        it('400 - whitespace title', function (done) {
            request(app)
                .post(restURL + '/id/' + publicProject._id + '/step')
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .send({
                    'title': '    '
                })
                .expect(400, done);
        });
        it('400 - without title', function (done) {
            request(app)
                .post(restURL + '/id/' + publicProject._id + '/step')
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .expect(400, done);
        });
        it('403 - unauthorized', function (done) {
            request(app)
                .post(restURL + '/id/' + publicProject._id + '/step')
                .send({
                    'title': 'Test'
                })
                .expect(403, done);
        });
    });
    describe('PUT /project/id/:id - update project', function () {
        it('200', function (done) {
            request(app)
                .put(restURL + '/id/' + publicProject._id)
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .send({
                    'title': 'First Step',
                    'public': true,
                    'materials': [{
                        'name': 'My Material',
                        'amount': '5'
                    }]
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.public).to.be(true);
                    expect(data.steps.length).to.be(2);
                    expect(data.materials.length).to.be(1);
                    expect(data.materials[0].name).to.be('My Material');
                    expect(data.materials[0].amount).to.be('5');
                    publicProject = data;
                    done();
                });
        });
        it('400 - empty title', function (done) {
            request(app)
                .put(restURL + '/id/' + publicProject._id)
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .send({
                    'title': ''
                })
                .expect(400, done);
        });
        it('400 - whitespace title', function (done) {
            request(app)
                .put(restURL + '/id/' + publicProject._id)
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .send({
                    'title': '    '
                })
                .expect(400, done);
        });
        it('400 - without title', function (done) {
            request(app)
                .put(restURL + '/id/' + publicProject._id)
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .expect(400, done);
        });
        it('403 - unauthorized', function (done) {
            request(app)
                .put(restURL + '/id/' + publicProject._id)
                .send({
                    'title': 'Test'
                })
                .expect(403, done);
        });
        it('403 - as other user', function (done) {
            request(app)
                .put(restURL + '/id/' + publicProject._id)
                .set('Authorization', 'Bearer ' + testuser2.accessToken)
                .send({
                    'title': 'Test'
                })
                .expect(403, done);
        });
    });
    describe('PUT /project/id/:id/step - update project step', function () {
        it('200', function (done) {
            request(app)
                .put(restURL + '/id/' + publicProject._id + '/step')
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .send({
                    '_id': step._id,
                    'title': 'editStep',
                    'complete': true
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.steps.length).to.be(2);
                    expect(data.steps[0].complete).to.be(true);
                    expect(data.steps[0].title).to.be('editStep');
                    expect(data.steps[0].description).not.to.be(undefined);
                    step = data.steps[0];
                    done();
                });
        });
        it('400 - empty title', function (done) {
            request(app)
                .put(restURL + '/id/' + publicProject._id + '/step')
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .send({
                    '_id': step._id,
                    'title': ''
                })
                .expect(400, done);
        });
        it('400 - whitespace title', function (done) {
            request(app)
                .put(restURL + '/id/' + publicProject._id + '/step')
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .send({
                    '_id': step._id,
                    'title': '    '
                })
                .expect(400, done);
        });
        it('400 - without title', function (done) {
            request(app)
                .put(restURL + '/id/' + publicProject._id + '/step')
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .send({
                    '_id': step._id
                })
                .expect(400, done);
        });
        it('400 - empty _id', function (done) {
            request(app)
                .put(restURL + '/id/' + publicProject._id + '/step')
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .send({
                    '_id': ''
                })
                .expect(400, done);
        });
        it('400 - whitespace _id', function (done) {
            request(app)
                .put(restURL + '/id/' + publicProject._id + '/step')
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .send({
                    '_id': '    '
                })
                .expect(400, done);
        });
        it('400 - without _id', function (done) {
            request(app)
                .put(restURL + '/id/' + publicProject._id + '/step')
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .expect(400, done);
        });
        it('403 - unauthorized', function (done) {
            request(app)
                .put(restURL + '/id/' + publicProject._id + '/step')
                .send({
                    '_id': step._id,
                    'title': 'Test'
                })
                .expect(403, done);
        });
        it('403 - as other user', function (done) {
            request(app)
                .put(restURL + '/id/' + publicProject._id + '/step')
                .set('Authorization', 'Bearer ' + testuser2.accessToken)
                .send({
                    '_id': step._id,
                    'title': 'Test'
                })
                .expect(403, done);
        });
    });
    describe('GET /project - get projects', function () {
        it('200 - other public projects', function (done) {
            request(app)
                .get(restURL)
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.length).to.be(0);
                    done();
                });
        });
        it('200 - other public projects 2', function (done) {
            request(app)
                .get(restURL)
                .set('Authorization', 'Bearer ' + testuser2.accessToken)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.length).to.be(1);
                    done();
                });
        });
        it('200 - own projects', function (done) {
            request(app)
                .get(restURL + '?me=true')
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.length).to.be(2);
                    done();
                });
        });
        it('200 - own projects 2', function (done) {
            request(app)
                .get(restURL + '?me=true')
                .set('Authorization', 'Bearer ' + testuser2.accessToken)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var data = res.body;

                    expect(data).not.to.be(null);
                    expect(data).to.be.an('object');
                    expect(data.length).to.be(0);
                    done();
                });
        });
        it('403 - unauthorized', function (done) {
            request(app)
                .put(restURL + '/id/' + publicProject._id + '/step')
                .send({
                    '_id': step._id,
                    'title': 'Test'
                })
                .expect(403, done);
        });
    });
    describe('GET /project/id/:id - get one project', function () {
        it('200 - other public project', function (done) {
            request(app)
                .get(restURL + '/id/' + publicProject._id)
                .set('Authorization', 'Bearer ' + testuser2.accessToken)
                .expect(200, done);
        });
        it('200 - other private projects', function (done) {
            request(app)
                .get(restURL + '/id/' + privateProject._id)
                .set('Authorization', 'Bearer ' + testuser2.accessToken)
                .expect(403, done);
        });
        it('200 - own project', function (done) {
            request(app)
                .get(restURL + '/id/' + privateProject._id)
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .expect(200, done);
        });
        it('403 - unauthorized', function (done) {
            request(app)
                .get(restURL + '/id/' + publicProject._id)
                .expect(403, done);
        });
    });
    describe('DELETE /project/id/:id/step?_id=:stepid - remove a step of project', function () {
        it('403 - other project', function (done) {
            request(app)
                .del(restURL + '/id/' + publicProject._id + '/step?_id=' + step._id)
                .set('Authorization', 'Bearer ' + testuser2.accessToken)
                .expect(403, done);
        });
        it('403 - unauthorized', function (done) {
            request(app)
                .del(restURL + '/id/' + publicProject._id + '/step?_id=' + step._id)
                .expect(403, done);
        });
        it('200 - own project', function (done) {
            request(app)
                .del(restURL + '/id/' + publicProject._id + '/step?_id=' + step._id)
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .expect(200)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    request(app)
                        .get(restURL + '/id/' + publicProject._id)
                        .set('Authorization', 'Bearer ' + testuser.accessToken)
                        .expect(200)
                        .end(function (err, res) {
                            if (err) {
                                return done(err);
                            }
                            expect(res.body.steps.length).to.be(1);

                            done();
                        });
                });
        });
    });
    describe('DELETE /project/id/:id - remove a project', function () {
        it('403 - other project', function (done) {
            request(app)
                .del(restURL + '/id/' + publicProject._id)
                .set('Authorization', 'Bearer ' + testuser2.accessToken)
                .expect(403, done);
        });
        it('403 - unauthorized', function (done) {
            request(app)
                .del(restURL + '/id/' + publicProject._id)
                .expect(403, done);
        });
        it('200 - own project', function (done) {
            request(app)
                .del(restURL + '/id/' + publicProject._id)
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .expect(200)
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    request(app)
                        .get(restURL + '/id/' + publicProject._id)
                        .set('Authorization', 'Bearer ' + testuser.accessToken)
                        .expect(404)
                        .end(function (err) {
                            if (err) {
                                return done(err);
                            }
                            request(app)
                                .get(restURL + '?me=true')
                                .set('Authorization', 'Bearer ' + testuser.accessToken)
                                .expect(200)
                                .end(function (err, res) {
                                    if (err) {
                                        return done(err);
                                    }

                                    expect(res.body.length).to.be(1);
                                    done();
                                });
                        });
                });
        });
    });
    describe('DELETE /project - remove all own projects', function () {
        it('200 - user 2 projects', function (done) {
            request(app)
                .del(restURL)
                .set('Authorization', 'Bearer ' + testuser2.accessToken)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    request(app)
                        .get(restURL + '?me=true')
                        .set('Authorization', 'Bearer ' + testuser.accessToken)
                        .expect(200)
                        .end(function (err, res) {
                            if (err) {
                                return done(err);
                            }

                            expect(res.body.length).to.be(1);
                            done();
                        });
                });
        });
        it('403 - unauthorized', function (done) {
            request(app)
                .del(restURL)
                .expect(403, done);
        });
        it('200 - user 1', function (done) {
            request(app)
                .del(restURL)
                .set('Authorization', 'Bearer ' + testuser.accessToken)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    request(app)
                        .get(restURL + '?me=true')
                        .set('Authorization', 'Bearer ' + testuser.accessToken)
                        .expect(200)
                        .end(function (err, res) {
                            if (err) {
                                return done(err);
                            }

                            expect(res.body.length).to.be(0);
                            done();
                        });
                });
        });
    });
});
