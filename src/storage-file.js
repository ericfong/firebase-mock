/*
  Mock for @google-cloud/storage File
  https://cloud.google.com/nodejs/docs/reference/storage/1.6.x/File
*/

'use strict'
var fs = require('fs')
const os = require('os')
const Path = require('path')
const fse = require('fs-extra')
var _ = require('lodash')

const TMP_DIR = `${os.tmpdir()}/firebase-mock`
fse.removeSync(TMP_DIR)

function MockStorageFile(bucket, name) {
  this.bucket = bucket
  this.name = name
  this._contents = null
  this._metadata = null
  if (!this.bucket.files[name]) {
    this.bucket.files[name] = this
  }
}

MockStorageFile.prototype.clone = function() {
  var file = new MockStorageFile(this.bucket, this.name)
  file._contents = this._contents
  file._metadata = this._metadata
  return file
}

MockStorageFile.prototype.get = function() {
  return Promise.resolve([this.clone(), null])
}

MockStorageFile.prototype.save = function(data) {
  this._contents = _.clone(data)
  return Promise.resolve()
}

MockStorageFile.prototype.exists = function() {
  return Promise.resolve([this._contents !== null])
}

MockStorageFile.prototype.getSignedUrl = function() {
  return Promise.resolve([`mockstorage:///${this.bucket.name}/${this.name}`])
}

MockStorageFile.prototype.download = function(args) {
  var self = this
  return new Promise(function(resolve, reject) {
    fs.writeFile(args.destination, self._contents, function(err) {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

MockStorageFile.prototype.delete = function() {
  this._contents = null
  return this.bucket.deleteFile(this.name)
}

MockStorageFile.prototype.move = function(destination) {
  var oldPath = this.name

  if (typeof destination === 'string') {
    // destination is a path string
    return this.bucket.moveFile(oldPath, destination)
  } else if (typeof destination.bucket !== 'undefined') {
    // destination is a File object
    return this.bucket.moveFile(oldPath, destination.name)
  } else {
    // destination is a Bucket object
    var newFile = destination.file(this.name)
    newFile._metadata = this._metadata
    newFile._contents = this._contents
    return this.delete()
  }
}

MockStorageFile.prototype.setMetadata = function(data) {
  this._metadata = _.clone(data)
  return Promise.resolve()
}

MockStorageFile.prototype.getMetadata = function() {
  return Promise.resolve([_.clone(this._metadata), null])
}

Object.assign(MockStorageFile.prototype, {
  createReadStream(options) {
    const filepath = `${TMP_DIR}/${this.bucket.name}/${this.name}`
    fse.ensureDirSync(Path.dirname(filepath))
    return fs.createReadStream(filepath)
  },
  createWriteStream(options) {
    const filepath = `${TMP_DIR}/${this.bucket.name}/${this.name}`
    fse.ensureDirSync(Path.dirname(filepath))
    return fs.createWriteStream(filepath)
  },
})

module.exports = MockStorageFile
