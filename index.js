/* @flow weak */
'use strict'

class SourceCache {

  constructor(api) {
    this.api = api;
    this.hashCache = new Map();
    this.uriCache = new Map();
    this.debug = true
  }

  /**
   * Handle the change of a file
   *
   */
  isCached(meta) {

    if (this.debug) console.log("SourceCache.checkIfShouldOpen("+meta.uri+")")

    if (this.debug) console.log("\n\nSourceCache.checkIfShouldOpen: "+JSON.stringify(meta, null, 2));

    const hasKnownHash = this.hashCache.has(meta.hash);
    const hasknownUri  = this.uriCache.has(meta.uri);

    const knownHash = this.hashCache.get(meta.hash);
    const knownUri  = this.uriCache.get(meta.uri);

      // file wasn't moved and didn't change
    if (hasKnownHash && hasknownUri) {
      if (this.debug) console.log("SourceCache.checkIfShouldOpen: uri didn't change, hash didn't change");
      knownHash.date = meta.date; // update
      knownUri.date = meta.date; // normally this isn't necessary as our meta object reference is the same
    } else if (hasKnownHash && !hasknownUri) {
      if (this.debug) console.log("SourceCache.checkIfShouldOpen: uri changed, hash didn't change");
      knownHash.date = meta.date;    // update
      knownHash.uri.add(meta.uri); // update
      this.uriCache.set(meta.hash, knownHash); // overwrite
    } else if (!hasKnownHash && hasknownUri) {
      if (this.debug) console.log("SourceCache.checkIfShouldOpen: uri didn't change, hash changed");

      // note: this is a major event so we have to cut the remove to the uri
      // and create a brand new object for the new uri
      const oldHash = knownUri.hash;
      const oldObj = this.hashCache.get(oldHash);
      if (oldObj) {
        if (this.debug) console.log("SourceCache.checkIfShouldOpen: delete old uri for old hash "+oldHash);
        oldObj.uri.delete(meta.uri);
      }
      const changedObj = {
        uri: new Set(meta.uri),
        hash: meta.hash,
        date: meta.date
      }
      if (this.debug) console.log("SourceCache.checkIfShouldOpen: created new uri reference");
      this.hashCache.set(meta.hash, changedObj); // new
      this.uriCache.set(meta.uri, changedObj); // overwrite
      return true;
      // this.api.open(meta); // call and forget
    } else if (!hasKnownHash && !hasknownUri) {
      if (this.debug) console.log("SourceCache.checkIfShouldOpen: uri is new, hash is new");
      const newObj = {
        uri: new Set(meta.uri),
        hash: meta.hash,
        date: meta.date
      }
      if (this.debug) console.log("SourceCache.checkIfShouldOpen: created new uri reference");
      this.hashCache.set(meta.hash, newObj); // new
      this.uriCache.set(meta.uri, newObj); // new
      // this.api.open(meta); // call and forget
      return true;
    }
    return false;
  }

  onDelete(meta) {
    if (this.debug) console.log("SourceCache.onDelete: deleting "+meta.uri);

    const hasknownUri = this.uriCache.has(meta.uri);
    const knownUri    = this.uriCache.get(meta.uri);

    const hasKnownHash = this.hashCache.has(hasknownUri ? knownUri.hash : '');
    const knownHash    = this.hashCache.get(hasknownUri ? knownUri.hash : '');

      // file wasn't moved and didn't change
    if (hasknownUri) {
      if (this.debug) console.log("SourceCache.onDelete: known uri");
      knownUri.uri.delete(meta.uri);
      knownUri.delete(meta.uri);
      this.api.delete({ uri: meta.uri, hash: knownHash }); // call and forget
    } else if (!hasknownUri) {
      if (this.debug) console.log("SourceCache.onDelete: unknown uri");
    } else {
      const obj = uriCache.delete(uri);
      if (obj){
        this.api.delete({ uri: uri, hash: knownHash }); // call and forget
      } else {
        if (this.debug) console.log("SourceCache.onDelete: nothing to delete, file was not in cache");
      }
    }
  }
}

module.exports = SourceCache
