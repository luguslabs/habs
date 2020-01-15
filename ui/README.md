# Archipel Front End 

Front end created thanks to [substrate-front-end-template](git clone https://substrate-developer-hub/substrate-front-end-template.git) base.


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

* `REACT_APP_PROVIDER_SOCKET` overriding `config[PROVIDER_SOCKET]`
* `REACT_APP_DEVELOPMENT_KEYRING` overriding `config[DEVELOPMENT_KEYRING]`

More on [React environment variables](https://create-react-app.dev/docs/adding-custom-environment-variables).

When writing and deploying your own front end, you should configure:

* `CUSTOM_TYPES` in `src/config/common.json`. See
  [Extending types](https://polkadot.js.org/api/start/types.extend.html).
* `PROVIDER_SOCKET` in `src/config/production.json` pointing to your own
  deployed node.
* `DEVELOPMENT_KEYRING` in `src/config/common.json` be set to `false`.
  See [Keyring](https://polkadot.js.org/api/start/keyring.html).

