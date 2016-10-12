angular.module('taApp').factory('taDataFactory', taDataFactory);

function taDataFactory($http) {
	return {
		loginUser : loginUser
	}
	
	function loginUser($params) {
		return $http({
	      method : 'POST',
	      url : 'loginScript.ss',
	      data : $scope.formData,
	      headers : { 'Content-Type': 'application/json' }
	    }).success(completed).catch(failed);
	}
	
	function completed(response) {
		return response;
	}
	
	function failed(err) {
		return console.log(err);
	}
	
}