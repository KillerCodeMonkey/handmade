define(function () {
    'use strict';

    return {
        port: '3000',
        host: 'http://localhost',
        secret: 'z}#{T=s40-;{Z?qnK.)7üflZ{O?}I=b-}ö;%:__H',
        tokenExpiresInMinutes: 5256000,
        isDev: true,
        permissions: {
            'admin': 'admin',
            'user': 'user' // enduser = user
        }
    };
});
