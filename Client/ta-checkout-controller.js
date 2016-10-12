
// CHECKOUT CONTROLLER
angular.module('taApp').controller('checkoutController', ['$scope','$http','orderService', function($scope, $http, orderService){
  var chkout = $scope;
	chkout.confirmClass = 'confirm-purchase';		
	chkout.submitted = false; 
  chkout.shoppingOrder = orderService.shoppingOrder;
  chkout.currentPage = 'payment';
  chkout.registeredUser = orderService.registeredUser;
  chkout.countries = nlCountries;
  chkout.states = nlStates;
  chkout.payment = {};
  chkout.billing = {};
  chkout.billing.country = 'US';
  chkout.payment.ccdefault = 'T';
  chkout.billing.addressee = '';
  chkout.billing.defaultbilling = 'T';
  chkout.paymentTypes = {
    "Master": 4,
    "Visa": 5,
    "Amex": 6,
    "Discover": 3
  };
  
  // Pre populate user infomation
  if(chkout.registeredUser.creditcards) {
	var defaultCreditCard = chkout.registeredUser.creditcards.filter(function(card) {
		return card.ccdefault == "T";
	});
	console.log(defaultCreditCard);

	chkout.payment.ccname = defaultCreditCard[0].ccname || '';
  }
  


  $scope.$watch('payment.paymentmethod', function(method) {
    console.log(method);
    switch (method) {
      case '4':
        chkout.paymentTypeString = "Master";
        break;
      case '5':
        chkout.paymentTypeString = "Visa";
        break;
      case '6':
        chkout.paymentTypeString = "American Express";
        break;
      case '3':
        chkout.paymentTypeString = "Discover";
        break;
      default:
        chkout.paymentTypeString = "Discover";
    }
  });

  // Changes Select Options for State When Different Country is Selected
  $scope.$watch('billing.country', function(countrycode) {

    angular.forEach(chkout.states, function(country){
      if(country.countrycode === countrycode) {
        chkout.selectedStates = country.states;
      }
    });
  });

  // Assign chkout.payment.ccname as billing.addressee
  $scope.$watch('payment.ccname', function(ccname) {
    chkout.billing.addressee = ccname;
  })

  chkout.dataOut = {
    payment: chkout.payment,
    billing: chkout.billing
  }


  chkout.changeCurrentPage = function(page) {
    chkout.currentPage = page;
  }

  //
  chkout.addPayment = function() {
    $http({
      method: 'POST',
      url: 'checkoutScript.ss',
      data: chkout.dataOut,
      headers: { 'Content-Type': 'application/json' }
    })
    .then(function(data) {
      var data = data.data;
      console.log(data);
      if(data.success) {
        chkout.currentPage = 'review';
      } else {
        console.log('Something went wrong');
      }
    }).catch(function(e) {
      console.log(e);
    });
  }

  //  Submit Order
  chkout.submitOrder = function() {
		chkout.submitted = true;
    $http({
      method: 'POST',
      url: 'checkoutSubmitScript.ss',
      data: chkout.payment,
      headers: { 'Content-Type': 'application/json' }
    }).
    success(function(data) {
    	if(data.success) {
				chkout.currentPage = 'thankyou'
			} else {
				chkout.submitted = false;
				chkout.errorMessage = 'There was error in processing your order. Please try again or contact our support team'
			}
    }).catch(function(e) {

    });
  }
}]);