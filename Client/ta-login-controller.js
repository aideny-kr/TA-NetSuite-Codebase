angular.module('taApp').controller('loginController', ['$scope', 'taDataFactory', '$window', function($scope, taDataFactory, $window) {
	var loginCtrl = $scope;
	loginCtrl.formData = {};
	loginCtrl.isProcessing = false;
	loginCtrl.nsProcessUser = function() {
   
    loginCtrl.isProcessing = true;
    taDataFactory.loginUser(loginCtrl.formData)
    .then(function (data) {
      console.log(data);
      if(data.error){
        if(!data.success && data.error.hasOwnProperty('message')) {
        	loginCtrl.errorMessage = data.error.message;
        	loginCtrl.isProcessing = false;
        }
      }
      else {
        if(!data.success) {
          if(data.error.hasOwnProperty('email') || data.error.hasOwnProperty('password')){
        	  loginCtrl.errorEmail = data.error.email;
        	  loginCtrl.errorPassword = data.error.password;
        	  loginCtrl.isProcessing = false;
          }
        } else {
          $window.location.href = data.nextUrl;
        }
      }
    }).catch(function(e) {
    	loginCtrl.responseText = JSON.stringify(e);
      console.log(e);
    });

  }

}]);