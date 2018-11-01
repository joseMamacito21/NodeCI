const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);
const { exec } = mongoose.Query.prototype;

mongoose.Query.prototype.cache = function(options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || '');
  return this;
}

mongoose.Query.prototype.exec = async function() { // Reassign mongoose.Query.prototype.exec func
  if(!this.useCache) {
    return exec.apply(this, arguments);
  }
  // mongooseCollection.name is to Get current model(collection) name
  const key = JSON.stringify(Object.assign({}, this.getQuery(), {
    collection: this.mongooseCollection.name,
  }));

  // See if we have a value for key in redis
  const cacheValue = await client.hget(this.hashKey, key);
  // Return that value
  if (cacheValue) {
    const doc = JSON.parse(cacheValue);
    return Array.isArray(doc) 
      ? doc.map(d => new this.model(d))      
      : new this.model(doc);
  }
  // Otherwise. issue the query and store the result in redis
  const result = await exec.apply(this, arguments);
  client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10); // Expires in 10 seconds
  return result;
}

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
};