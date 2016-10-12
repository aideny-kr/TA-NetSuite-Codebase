//REGISTER CONTROLLER
angular.module('taApp').controller('registerController', ['$scope', '$http', '$window',function($scope, $http, $window) {

  $scope.registerData = {};

  $scope.nsRegisterForm = function() {
    $http({
      method : 'POST',
      url : 'RegisterScript.ss',
      data : $scope.registerData,
      headers : { 'Content-Type': 'application/json' }
    })
    .success(function (data) {
      console.log(data);
      if(data.success){
        $window.location.href = data.nextUrl;
      }
    })
  }
}]);