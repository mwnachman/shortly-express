var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',

  initialize: function() {
    this.on('creating', function(model, attrs, options) {
      var salt = /*bcrypt.genSaltSync(10);*/ 'sal';
      var hash = /*bcrypt.hashSync(password, salt);*/'papas';
      
    });
  }, 

  //method that reads?
});

module.exports = User;