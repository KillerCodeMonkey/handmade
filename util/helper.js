/*global define*/
define([
    'mkdirp',
    'bluebird',
    'path',
    'fs',
    'underscore'
], function (mkdirp, Promise, path, fs, _) {
    'use strict';

    var gm = require('gm').subClass({imageMagick: true});

    function regExpEscape(val) {
        return val.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
    }

    // helper to remove dir async, recursive https://github.com/LightSpeedWorks/rmdir-recursive/blob/master/lib/rmdir-recursive.js
    function rmdirRecursive(dir, cb) {
        var ctx = this,
            called,
            results;

        // rmdirRecursiveCallback(err)
        function rmdirRecursiveCallback(err) {
            if (err && err.code === 'ENOENT') {
                err = null;
                arguments[0] = null;
            }

            if (!results) {
                results = arguments;
            }
            if (!cb || called) {
                return;
            }
            called = true;
            cb.apply(ctx, results);
        }

        // fs.readdir callback...
        function readdirCallback(err, files) {
            if (err) {
                return rmdirRecursiveCallback(err);
            }

            var n = files.length;
            if (n === 0) {
                return fs.rmdir(dir, rmdirRecursiveCallback);
            }

            files.forEach(function (name) {
                rmdirRecursive(path.resolve(dir, name), function (fsErr) {
                    if (fsErr) {
                        return rmdirRecursiveCallback(fsErr);
                    }
                    if (--n === 0) {
                        return fs.rmdir(dir, rmdirRecursiveCallback);
                    }
                }); // rmdirRecursive
            }); // files.forEach
        } // readdirCallback

        // check arguments
        if (typeof dir !== 'string') {
            return rmdirRecursiveCallback('rmdirRecursive: directory path required');
        }
        if (cb !== undefined && typeof cb !== 'function') {
            return rmdirRecursiveCallback('rmdirRecursive: callback must be function');
        }

        fs.exists(dir, function existsCallback(exists) {
            // already removed? then nothing to do
            if (!exists) {
                return rmdirRecursiveCallback(null);
            }

            fs.stat(dir, function statCallback(err, stat) {
                if (err) {
                    return rmdirRecursiveCallback(err);
                }
                if (!stat.isDirectory()) {
                    return fs.unlink(dir, rmdirRecursiveCallback);
                }

                fs.readdir(dir, readdirCallback);
            }); // fs.stat callback...
        }); // fs.exists
    }

    function deleteFile(filepath) {

        return new Promise(function (resolve, reject) {
            fs.unlink(filepath, function (err) {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }

    function imageRemove(imageObject) {
        var i = 0,
            deleteTasks = [];

        if (imageObject && imageObject.path) {
            // unlink original file
            deleteTasks.push(deleteFile(process.cwd() + '/static/public/' + imageObject.path));
            for (i; i < imageObject.variants.length; i = i + 1) {
                // unlink all variants
                deleteTasks.push(deleteFile(process.cwd() + '/static/public/' + imageObject.variants[i].path));
            }
        }
        return Promise.settle(deleteTasks);
    }

    function resize(originalFile, relativePath, width, height, path, name, extension, image) {
        var filePath = path + name + '_' + width + 'x' + height + extension;
        return new Promise(function (resolve, reject) {
            gm(originalFile)
                .resize(width, height, '^>')
                .gravity('Center')
                .write(filePath, function (err) {
                    if (err) {
                        return reject(err);
                    }
                    image.variants.push({
                        width: width,
                        path: relativePath + name + '_' + width + 'x' + height + extension
                    });
                    resolve();
                });
        });
    }

    function thumb(originalFile, relativePath, width, height, path, name, extension, image) {
        var filePath = path + name + '_' + width + 'x' + height + extension;

        return new Promise(function (resolve, reject) {
            gm(originalFile)
                .quality(80)
                .resize(width, height, '>')
                .gravity('Center')
                .noProfile()
                .write(filePath, function (err) {
                    if (err) {
                        return reject(err);
                    }
                    image.variants.push({
                        width: width,
                        path: relativePath  + name + '_' + width + 'x' + height + extension
                    });
                    resolve();
                });
        });
    }

    function upload(fieldname, file, filename, targetDir, options) {
        var resizeTasks = [],
            fstream,
            image = {
                variants: []
            },
            i = 0,
            extension = path.extname(filename),
            fileName = options.name || path.basename(filename, extension),
            relative = targetDir + '/',
            basePath = process.cwd() + '/static/public/' + relative;

        return new Promise(function (resolve, reject) {
            // check if request has restriction for fieldname
            if (!options.fieldname || options.fieldname === fieldname) {
                mkdirp(basePath, function (err) {
                    if (err) {
                        return q.reject(err);
                    }
                    //Path where image will be uploaded
                    var fullPath = basePath + '/' + fileName + extension;
                    // create writestream to write data-stream to file
                    fstream = fs.createWriteStream(fullPath);
                    // pipe stream
                    file.pipe(fstream);
                    // upload finished
                    fstream.on('close', function () {
                        // create image object
                        gm(fullPath).size(function (err, size) {
                            if (err) {
                                Promise.settle([deleteFile(fullPath)]).then(function () {
                                    return reject(err);
                                });
                            }
                            if (!size || !size.width || !size.height) {
                                Promise.settle([deleteFile(fullPath)]).then(function () {
                                    return reject('missing_image_size');
                                });
                            }

                            image = {
                                path: relative + fileName + extension,
                                width: size.width,
                                height: size.height,
                                variants: []
                            };

                            // check if thumbnail should created
                            if (options.thumb) {
                                resizeTasks.push(thumb(fullPath, relative, 80, 80, basePath, fileName, extension, image));
                            }
                            // check if there are sizes to generate
                            if (options.sizes && options.sizes.length) {
                                // for each size resize original and write it to own file
                                for (i; i < options.sizes.length; i = i + 1) {
                                    resizeTasks.push(resize(fullPath, relative, options.sizes[i].width, options.sizes[i].height, basePath, fileName, extension, image, options.compress));
                                }
                            }
                            Promise.settle(resizeTasks).then(function () {
                                resolve(image);
                            }, function (err) {
                                imageRemove(image).finally(function () {
                                    reject(err);
                                });
                            });
                        });
                    });
                });
            } else {
                resolve(image);
            }
        });
    }

    return {
        rmdirRecursiveAsync: function (removePath, cb) {
            rmdirRecursive(removePath, cb);
        },
        setPager: function (query) {
            var pager = {},
                validFilter = {};

            // build up pager object
            pager.page = query.page ? parseInt(query.page, 10) : undefined; // requested pager
            pager.limit = query.limit ? parseInt(query.limit, 10) : undefined; // number of entries per page
            pager.skip = pager.limit && pager.page ? pager.limit * (pager.page - 1) : undefined; // calculate skip value
            pager.filter = query.filter ? query.filter instanceof Array ? query.filter : [query.filter] : []; // set filter
            pager.value = query.value ? query.value instanceof Array ? query.value : [query.value] : []; // filter value
            pager.orderBy = query.orderBy || undefined; // orderBy
            pager.orderDesc = query.orderDesc && query.orderBy ? query.orderDesc === 'true' || query.orderDesc === '1' ? true : false : undefined; // sortOrder

            _.each(pager.filter, function (filter, index) {
                if (pager.value[index]) {
                    validFilter[filter] = pager.value[index];
                }
            });
            pager.filter = validFilter;
            delete pager.value;
            return pager;
        },
        queryFormatter: {
            bool: function (val) {
                if (val === 'true' || val === 1 || val === '1') {
                    return true;
                }
                return false;
            },
            isDate: function (val) {
                val = parseInt(val, 10);
                return !isNaN(Date.parse(new Date(val)));
            },
            string: function (val, regex) {
                if (regex) {
                    return new RegExp('^' + regExpEscape(val.toString()), 'i');
                }
                return val.toString();
            },
            array: function (val, empty, selector, key) {
                if (empty) {
                    var temp = {},
                        temp2 = {};
                    if (!selector.$or) {
                        selector.$or = [];
                    }
                    temp[key] = {
                        $in: val instanceof Array ? val : [val]
                    };

                    selector.$or.push(temp);
                    temp2[key] = {
                        $size: 0
                    };
                    selector.$or.push(temp2);
                    return selector.$or;
                }
                return {
                    $in: val instanceof Array ? val : [val]
                };
            },
            greater: function (val, equal) {
                if (equal) {
                    return {
                        $gte: val
                    };
                }
                return {
                    $gt: val
                };
            },
            less: function (val, equal) {
                if (equal) {
                    return {
                        $lte: val
                    };
                }
                return {
                    $lt: val
                };
            },
            greaterAndLess: function (val, equal) {
                if (equal) {
                    return {
                        $gte: val,
                        $lt: val
                    };
                }
                return {
                    $gt: val,
                    $lt: val
                };
            },
            lessAndGreater: function (val, equal) {
                if (equal) {
                    return {
                        $gt: val,
                        $lte: val
                    };
                }
                return {
                    $gt: val,
                    $lt: val
                };
            },
            exists: function (selector, key) {
                var temp = {},
                    temp2 = {};

                if (!selector.$or) {
                    selector.$or = [];
                }
                temp[key] = {
                    $ne: null
                };

                selector.$or.push(temp);
                temp2[key] = {
                    $size: 0
                };
                selector.$or.push(temp2);
                return selector.$or;
            }
        },
        generateRandomString: function (length) {
            length = length ? -length : -8;
            return Math.random().toString(36).slice(length);
        },
        regExpEscape: regExpEscape,
        getPage: function (Model, selector, populates, limiting, skipping, selecting, sorting, sortDesc, slices, lean) {
            var query;

            // Build up query for Pager
            selector = selector || {};
            query = Model.find(selector);

            if (populates && populates.length) {
                _.each(populates, function (populating) {
                    query.populate(populating);
                });
            }
            if (limiting) {
                query.limit(limiting);
            }
            if (skipping) {
                query.skip(skipping);
            }

            if (selecting) {
                query.select(selecting);
            }
            if (sorting) {
                if (typeof sorting === 'string') {
                    sorting = sortDesc ? '-' + sorting : sorting;
                }
                query.sort(sorting);
            }
            if (slices && slices.length) {
                _.each(slices, function (slice) {
                    if (slice.path && slice.value) {
                        query.slice(slice.path, slice.value);
                    }
                });
            }
            if (lean || lean === undefined) {
                query.lean();
            }
            return new Promise(function (resolve, reject) {
                query.exec(function (err, documents) {
                    if (err) {
                        return reject(err);
                    }
                    Model.count(selector).exec(function (countErr, counter) {
                        if (countErr) {
                            return reject(countErr);
                        }
                        resolve([documents, counter]);
                    });
                });
            });
        },
        imageRemove: imageRemove,
        /*
           options: {
               name - optional target name (without extention)
               fieldame - optional fieldname (like 'image') then only the file of the field image is written
               thumb - optional flag if thumbnail should generated
               sizes: [{
                   width: 400,
                   height: 300
               }]
           }
        */
        imageUpload: function (req, targetDir, options, multiple) {
            var uploadTasks = [];

            return new Promise(function (resolve, reject) {
                // handle upload
                req.pipe(req.busboy);
                req.busboy.on('file', function (fieldname, file, filename) {
                    if (!uploadTasks.length || multiple) {
                        uploadTasks.push(upload(fieldname, file, filename, targetDir, options));
                    }
                });

                req.busboy.on('finish', function () {
                    Promise.all(uploadTasks).then(function (imageObjects) {
                        if (uploadTasks.length === 1) {
                            return resolve(imageObjects[0]);
                        }
                        resolve(imageObjects);
                    }, reject);
                });
            });
        }
    };
});
