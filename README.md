# Pippin

> "What about second breakfast?"
>
> - J. R. R. Tolkien

Pippin is a suggestion box for movies. Pretty simple: people request movies, and Pippin organizes the submissions into a spreadsheet for you.

This project is based on [Gamgee](https://github.com/AverageHelper/Gamgee).

## Authors & Contributors

It's only me for now. Most of this code was copied from [Gamgee](https://github.com/AverageHelper/Gamgee), and you can thank those contributors for their contributions. I'll add contributors here as they crop up!

## Prerequisites

This project requires [NodeJS](https://nodejs.org/) (version 18.17 or later), [NPM](https://npmjs.org/), and a [Discord bot account token](https://www.howtogeek.com/364225/how-to-make-your-own-discord-bot/).
To make sure you have them available on your machine,
try running the following command:

```sh
$ npm -v && node -v
9.6.7
v18.17.1
```

## Clone the Repo

```sh
$ cd path/to/parent
$ git clone https://git.average.name/AverageHelper/Pippin.git
$ cd Pippin
```

## Table of contents

- [Pippin](#Pippin)
  - [Authors & Contributors](#authors--contributors)
  - [Prerequisites](#prerequisites)
  - [Clone the Repo](#clone-the-repo)
  - [Table of contents](#table-of-contents)
  - [Usage](#usage)
    - [Get your own bot token](#get-your-own-bot-token)
    - [Invite your bot to your server](#invite-your-bot-to-your-server)
    - [Compile the bot](#compile-the-bot)
    - [Register Slash Commands](#register-slash-commands)
    - [Run the bot](#run-the-bot)
      - [Selecting a database file location](#selecting-a-database-file-location)
    - [Autogenerated Files](#autogenerated-files)
    - [Supported Media Platforms](#supported-media-platforms)
  - [Commands](#commands)
    - [`help`](#help)
    - [`ping`](#ping)
    - [`suggest`](#suggest-url)
    - [`test`](#test)
    - [`version`](#version)
  - [Contributing](#contributing)
  - [Built With](#built-with)
  - [License](#license)

## Usage

Pippin is designed for use in one Discord server (or "guild") at a time. If used in multiple guilds, movie submissions and user limits will be shared between them in a global queue.

To get your own Movie Suggestions queue, you can run your own instance of the bot:

### Get your own bot token

Note that, by running Pippin, you agree to be bound by the Discord's [Developer Terms of Service](https://support-dev.discord.com/hc/en-us/articles/8562894815383) and [Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327), as well as [Pippin's own license](/LICENSE). With that in mind, you'll need a token for a Discord bot account. See [this awesome tutorial on how to get one](https://www.howtogeek.com/364225/how-to-make-your-own-discord-bot/).

Create a file called `.env` in the root of this project folder. Paste the following info into that file:

```sh
# .env

DISCORD_TOKEN=YOUR_TOKEN_GOES_HERE
# required, token for your Discord bot

LOG_LEVEL={silly | debug | verbose | info | warn | error}
# optional, the level of logs you should see in the console
# must be one of [silly, debug, verbose, info, warn, error]
# defaults to `info` in production mode, `error` in test mode, and `debug` in any other mode

DATABASE_SHEET_URL="https://sheets.google.com/1234"
# required, the Google Sheets doc where the database tables should live.
```

**Do not commit this file to git** or your bot _will_ get "hacked".

### Invite your bot to your server

Go to https://discordapi.com/permissions.html#377957215296 and paste in your bot's client ID to get an invite link.

### Compile the bot

The first time you download the source, and each time the source code changes, you'll need to run this command before you run the bot:

```sh
$ npm run setup
```

### Register Slash Commands

If you want support for Discord [Slash Commands](https://support.discord.com/hc/en-us/articles/1500000368501-Slash-Commands-FAQ), you'll need to deploy the commands directly.

Once you have your bot's account token in the .env file, run the following command to tell Pippin to tell Discord about our commands:

```sh
$ npm run commands:deploy
```

### Run the bot

Since Pippin is just a Node script, any Node process manager will do.

```sh
$ node .
# or
$ npm start
# or
$ pm2 start .
```

### Autogenerated Files

Pippin generates some files as needed. This is normal, and you should not bother with most of them.

- `node_modules/` contains our dependent packages. This folder is _massive_, and that's on purpose. You don't need to worry about what's behind this curtain.
- `dist/` contains the compiled bot code. What, did you think we ran the TypeScript directly? SMH my head, mate.
- `logs/` contains log files for events that the server thinks might be useful one day. Most of these have to do with the many smol-but-important things Pippin does in the background that you shouldn't worry about. Feel free to look in here if you're ever curious. These logs rotate automatically every day, with only the last 30 days retained.

### Supported Media Platforms

We only support [TheMovieDB](https://www.themoviedb.org/) for now, because their API is reasonable.

If you'd like us to support another platform, please [submit an issue](https://git.average.name/AverageHelper/Pippin/issues/new?template=.gitea%2fISSUE_TEMPLATE%2ffeature_request.md)!

## Commands

We use Discord Slash Commands. Type `/` in any Discord chat to see all available commands.

### `help`

Prints instructions for how to use the media request queue. Anyone may use this command.

### `ping`

Responds with "Pong!"

#### `suggest <url>`

Submits a movie to the queue. For media to be considered, submissions must be a valid media link from a [supported platform](#supported-music-platforms).

### `test`

Runs test queries against each of our [supported platforms](#supported-music-platforms), and responds with useful statistics. This is handy for making sure that Pippin still knows how to talk to external services whose API may change without notice.

### `version`

Display's the current version of Pippin Core. (see [package.json](https://git.average.name/AverageHelper/Pippin/src/branch/main/package.json#L3))

## Contributing

This project lives primarily at [git.average.name](https://git.average.name/AverageHelper/Pippin). Read-only mirrors also exist on [Codeberg](https://codeberg.org/AverageHelper/Pippin) and [GitHub](https://github.com/AverageHelper/Pippin). Issues or pull requests should be filed at [git.average.name](https://git.average.name/AverageHelper/Pippin). You may sign in or create an account directly, or use one of several OAuth 2.0 providers.

This project is entirely open source. Do with it what you will. If you're willing to help me improve this project, consider [filing an issue](https://git.average.name/AverageHelper/Pippin/issues/new/choose).

See [CONTRIBUTING.md](/CONTRIBUTING.md) for ways to contribute.

## Built With

- [Visual Studio Code](https://code.visualstudio.com/)
- [Discord.js](https://discord.js.org/)
- Love

## License

Pippin's source is licensed under the [GNU General Public License v3.0](LICENSE).

Furthermore, by installing and running an instance of Pippin yourself, you agree
to be bound by the terms of the [Discord Developer Terms of Service](https://support-dev.discord.com/hc/en-us/articles/8562894815383) and the [Discord Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327). If you wish not to be bound by these terms, and instead use a hosted instance of Pippin, send a DM to [@oddmusicpony](https://twitter.com/oddmusicpony) on Twitter.
