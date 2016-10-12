angular.module('taApp').controller('loginController', ['$scope', 'taDataFactory', '$window', function($scope, taDataFactory, $window) {

  $scope.formData = {};
  $scope.isProcessing = false;
  $scope.nsProcessUser = function() {
    $scope.isProcessing = true;
    
    taDataFactory.loginUser(formData)
    .success(function (data) {
      //console.log(data);
      if(data.error){
        if(!data.success && data.error.hasOwnProperty('message')) {
          $scope.errorMessage = data.error.message;
          $scope.isProcessing = false;
        }
      }
      else {
        if(!data.success) {
          if(data.error.hasOwnProperty('email') || data.error.hasOwnProperty('password')){
            $scope.errorEmail = data.error.email;
            $scope.errorPassword = data.error.password;
            $scope.isProcessing = false;
          }
        } else {
          $window.location.href = data.nextUrl;
        }
      }
    }).catch(function(e) {
      $scope.responseText = JSON.stringify(e);
      console.log(e);
    });

  }

}]);