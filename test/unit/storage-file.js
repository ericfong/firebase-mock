'use strict'

var os = require('os')
var fs = require('fs')
var path = require('path')
var chai = require('chai')
var sinon = require('sinon')
var Promise = require('rsvp').Promise
var _ = require('lodash')

chai.use(require('chai-as-promised'))
chai.use(require('sinon-chai'))

var expect = chai.expect
var Storage = require('../../src/storage')
var StorageBucket = require('../../src/storage-bucket')
var StorageFile = require('../../src/storage-file')

describe('StorageFile', function() {
  var storage, bucket
  beforeEach(function() {
    storage = new Storage()
    bucket = new StorageBucket(storage, 'name')
  })

  describe('constructor', function() {
    it('should add bucket reference', function() {
      var file = new StorageFile(bucket, 'filename')
      expect(file.bucket).to.equal(bucket)
    })
  })

  describe('#get', function() {
    it('should get file', function() {
      var file = new StorageFile(bucket, 'filename')
      return file.get().then(function(results) {
        expect(results.length).to.equal(2)
        expect(results[0]).to.not.equal(file)
        expect(results[0]).to.deep.equal(file)
      })
    })
  })

  describe('#save', function() {
    it('should save contents', function() {
      var file = new StorageFile(bucket, 'filename')
      return file.save('abc').then(function() {
        expect(file._contents).to.equal('abc')
      })
    })
  })

  describe('#exists', function() {
    it('should not exist when no content', function() {
      var file = new StorageFile(bucket, 'filename')
      expect(file.exists()).to.eventually.equal(false)
    })

    it('should exist when content added', function() {
      var file = new StorageFile(bucket, 'filename')
      file._contents = 'abc'
      expect(file.exists()).to.eventually.equal(true)
    })
  })

  describe('#getSignedUrl', function() {
    it('should get url', function() {
      var file = new StorageFile(bucket, 'filename')
      return file.getSignedUrl().then(function(url) {
        expect(url).to.be.a('array').that.is.not.empty // jshint ignore:line
      })
    })
  })

  describe('#download', function() {
    it('should download file', function() {
      var file = new StorageFile(bucket, 'filename')
      var filePath = path.join(os.tmpdir(), 'filename.txt')
      return file
        .download({
          destination: filePath,
        })
        .then(function() {
          expect(fs.existsSync(filePath)).to.equal(true)
        })
    })
  })

  describe('#delete', function() {
    it('should delete file from bucket', function() {
      var file = new StorageFile(bucket, 'filename')
      return file.delete().then(function() {
        expect(bucket.files['filename']).to.not.be.ok // jshint ignore:line
      })
    })

    it('should not exist after file deleted', function() {
      var file = new StorageFile(bucket, 'filename')
      return file.delete().then(function() {
        expect(file.exists()).to.eventually.equal(false)
      })
    })
  })

  describe('#move', function() {
    it('should move file using string', function() {
      var file = new StorageFile(bucket, 'filename')
      return file.move('newfilename').then(function() {
        expect(bucket.files['filename']).to.not.be.ok // jshint ignore:line
        expect(bucket.files['newfilename']).to.be.ok // jshint ignore:line
      })
    })

    it('should move file using File', function() {
      var file = new StorageFile(bucket, 'filename')
      var newFile = new StorageFile(bucket, 'newfilename')
      return file.move(newFile).then(function() {
        expect(bucket.files['filename']).to.not.be.ok // jshint ignore:line
        expect(bucket.files['newfilename']).to.be.ok // jshint ignore:line
      })
    })

    it('should move file using Bucket', function() {
      var file = new StorageFile(bucket, 'filename')
      var newBucket = new StorageBucket(storage, 'newbucket')
      return file.move(newBucket).then(function() {
        expect(bucket.files['filename']).to.not.be.ok // jshint ignore:line
        expect(newBucket.files['filename']).to.be.ok // jshint ignore:line
        expect(newBucket.files['filename'].bucket).to.equal(newBucket) // jshint ignore:line
      })
    })
  })

  describe('#getMetadata', function() {
    it('should get metadata', function() {
      var file = new StorageFile(bucket, 'filename')
      file._metadata = {
        metadata: {
          public: true,
        },
      }
      return file.getMetadata().then(function(results) {
        expect(results.length).to.equal(2)
        expect(results[0])
          .to.have.property('metadata')
          .to.have.property('public', true)
      })
    })
  })

  describe('#setMetadata', function() {
    it('should set metadata', function() {
      var file = new StorageFile(bucket, 'filename')
      return file
        .setMetadata({
          metadata: {
            public: true,
          },
        })
        .then(function() {
          expect(file._metadata)
            .to.have.property('metadata')
            .to.have.property('public', true)
        })
    })
  })
})
