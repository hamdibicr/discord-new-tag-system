'use strict';
const process = require('node:process');
const Base = require('./Base');
const TextBasedChannel = require('./interfaces/TextBasedChannel');
const { Error } = require('../errors');
const SnowflakeUtil = require('../util/SnowflakeUtil');
const UserFlags = require('../util/UserFlags');
const { calculateUserDefaultAvatarIndex } = require('@discordjs/rest');


let tagDeprecationEmitted = false;
class User extends Base {
  constructor(client, data) {
    super(client);
    this.id = data.id;

    this.bot = null;

    this.system = null;

    this.flags = null;

    this._patch(data);
  }

  _patch(data) {
    if ('username' in data) {
      this.globalName = data.username;
    } else {
      this.globalName ??= null;
    }

    if ('global_name' in data) {
        if(data.global_name) {
          this.username = data.global_name;
         } else {
          this.username = data.username || null;
        }



    } else {
      this.username ??= data.username;
    }

    if ('bot' in data) {
      this.bot = Boolean(data.bot);
    } else if (!this.partial && typeof this.bot !== 'boolean') {
      this.bot = false;
    }

    if ('discriminator' in data) {
      this.discriminator = data.discriminator;
    } else {
      this.discriminator ??= null;
    }

    if ('avatar' in data) {
      this.avatar = data.avatar;
    } else {
      this.avatar ??= null;
    }

    if ('banner' in data) {
      this.banner = data.banner;
    } else if (this.banner !== null) {
      this.banner ??= undefined;
    }

    if ('accent_color' in data) {
      this.accentColor = data.accent_color;
    } else if (this.accentColor !== null) {
      this.accentColor ??= undefined;
    }

    if ('system' in data) {
      this.system = Boolean(data.system);
    } else if (!this.partial && typeof this.system !== 'boolean') {
      this.system = false;
    }

    if ('public_flags' in data) {
      this.flags = new UserFlags(data.public_flags);
    }
  }
 
 get partial() {
    return typeof this.username !== 'string';
  }


  get createdTimestamp() {
    return SnowflakeUtil.timestampFrom(this.id);
  }

  get createdAt() {
    return new Date(this.createdTimestamp);
  }

  avatarURL({ format, size, dynamic } = {}) {
    if (!this.avatar) return null;
    return this.client.rest.cdn.Avatar(this.id, this.avatar, format, size, dynamic);
  }

  get defaultAvatarURL() {
    return this.client.rest.cdn.DefaultAvatar(this.discriminator % 5);
  }

  displayAvatarURL(options) {
    return this.avatarURL(options) ?? this.defaultAvatarURL;
  }

  get hexAccentColor() {
    if (typeof this.accentColor !== 'number') return this.accentColor;
    return `#${this.accentColor.toString(16).padStart(6, '0')}`;
  }

  bannerURL({ format, size, dynamic } = {}) {
    if (typeof this.banner === 'undefined') throw new Error('USER_BANNER_NOT_FETCHED');
    if (!this.banner) return null;
    return this.client.rest.cdn.Banner(this.id, this.banner, format, size, dynamic);
  }

  get tag() {
    if (!tagDeprecationEmitted) {
      process.emitWarning('User#tag is deprecated. Use User#username instead.', 'DeprecationWarning');
      tagDeprecationEmitted = true;
    }

    return typeof this.username === 'string'
      ? this.discriminator === '0'
        ? this.username
        : `${this.username}#${this.discriminator}`
      : null;
  }

  get displayName() {
    return this.globalName ?? this.username;
  }

  get dmChannel() {
    return this.client.users.dmChannel(this.id);
  }

  createDM(force = false) {
    return this.client.users.createDM(this.id, force);
  }

  deleteDM() {
    return this.client.users.deleteDM(this.id);
  }

  equals(user) {
    return (
      user &&
      this.id === user.id &&
      this.username === user.username &&
      this.globalName === user.globalName &&
      this.discriminator === user.discriminator &&
      this.avatar === user.avatar &&
      this.flags?.bitfield === user.flags?.bitfield &&
      this.banner === user.banner &&
      this.accentColor === user.accentColor
    );
  }

  _equals(user) {
    return (
      user &&
      this.id === user.id &&
      this.username === user.username &&
      this.globalName === user.globalName &&
      this.discriminator === user.discriminator &&
      this.avatar === user.avatar &&
      this.flags?.bitfield === user.public_flags &&
      ('banner' in user ? this.banner === user.banner : true) &&
      ('accent_color' in user ? this.accentColor === user.accent_color : true)
    );
  }

  fetchFlags(force = false) {
    return this.client.users.fetchFlags(this.id, { force });
  }

  fetch(force = true) {
    return this.client.users.fetch(this.id, { force });
  }

  toString() {
    return `<@${this.id}>`;
  }

  toJSON(...props) {
    const json = super.toJSON(
      {
        createdTimestamp: true,
        defaultAvatarURL: true,
        hexAccentColor: true,
        tag: true,
      },
      ...props,
    );
    json.avatarURL = this.avatarURL();
    json.displayAvatarURL = this.displayAvatarURL();
    json.bannerURL = this.banner ? this.bannerURL() : this.banner;
    return json;
  }
}

TextBasedChannel.applyToClass(User);

module.exports = User;
