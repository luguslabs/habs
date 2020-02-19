const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const mainRoutes = require('./routes/main');
const { rootDir } = require('./utils');

// Main function
async function main () {
    const app = express();

    app.use(bodyParser.urlencoded({extended: false}));

    app.use(express.static(path.join(rootDir, 'public')));

    app.use(mainRoutes.routes);

    app.use((req, res, next) => {
        res.status(404).sendFile(path.join(rootDir, 'views', '404.html'));
    });

    app.listen(3000);

}

main();
