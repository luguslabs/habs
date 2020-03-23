# Archipel UI

Archipel UI connects to Archipel Chain and shows it's state.

## Installation

The code can be installed using [git](https://git-scm.com/) and [yarn](https://yarnpkg.com/).

```bash
# Clone the repository
git clone https://github.com/luguslabs/archipel.git
cd ./ui
```

```bash
yarn install
```

## Build with Docker
```bash
# Clone the repository
git clone https://github.com/luguslabs/archipel.git
cd ./ui
docker build -t luguslabs/archipel-ui .
```

## Usage

You can start the template in development mode to connect to a locally running node

```bash
yarn start
```

You can also build the app in production mode,

```bash
yarn build
```
and open `build/index.html` in your favorite browser.

## Run with Docker
```bash
docker run -it -p 8080:80 luguslabs/archipel-ui
```
You can set REACT_APP_API_URL env at runtime with :
```bash
docker run -it -p 8080:80 --env REACT_APP_API_URL=http://127.0.1.1:3000 luguslabs/archipel-ui
```

* After run you can access the Archipel UI at http://localhost:8080.

## Publish on IPFS

- connect to your dappnode wifi ( to target IPFS )
- launch :
```bash
npm install
npm run publish
```

Expected result :

```bash
To point an .eth domain to this website, use this hash as value:

   QmZMUfKEsXAR8goa8LnJDDSkGqPpLaNkzdRd6k4d357Fed

To preview you website immediately go to:

   http://my.ipfs.dnp.dappnode.eth:8080/ipfs/QmZMUfKEsXAR8goa8LnJDDSkGqPpLaNkzdRd6k4d357Fed
```

## Configuration

The template's configuration is stored in the `src/config` directory, with
`common.json` being loaded first, then the environment-specific json file,
and finally environment variables, with precedence.

* `development.json` affects the development environment
* `test.json` affects the test environment, triggered in `yarn test` command.
* `production.json` affects the production environment, triggered in
`yarn build` command.

Some environment variables are read and integrated in the template `config` object,
including:

* `REACT_APP_API_URL` overriding `config[API_URL]`

## References
* [Based on Substrate Front End Template](https://github.com/substrate-developer-hub/substrate-front-end-template)
