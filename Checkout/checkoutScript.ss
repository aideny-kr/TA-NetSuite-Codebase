/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 Aug 2016     Chan
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function service(request, response){
	var dataIn = JSON.parse(request.getBody());
	var order = nlapiGetWebContainer().getShoppingSession().getOrder();
	var paymentObj = dataIn.payment;
	var billingObj = dataIn.billing;
	
	var error = {};
	var dataOut = {};
	
	
	// Handle expire date 
	var expmonth = paymentObj.expiration.slice(0,2);
	var expyear = paymentObj.expiration.slice(3);
	paymentObj.expmonth = expmonth;
	paymentObj.expyear = expyear;

	delete paymentObj.expiration;
	
	nlapiLogExecution('debug', 'Data In', JSON.stringify(dataIn));
	
	// Set Billing Address for the customer
	billingObj.phone = '0000000000';
	var addressId = nlapiGetWebContainer().getShoppingSession().getCustomer().addAddress(billingObj);
	order.setBillingAddress(addressId);
	
	// Process Payment
	if(paymentObj.ccStore) {

		delete paymentObj.ccStore;
		
		nlapiLogExecution('DEBUG', 'Data In after modification', JSON.stringify(paymentObj));
		var creditcard = paymentObj;
		
		var ccid;
		try {
			ccid = nlapiGetWebContainer().getShoppingSession().getCustomer().addCreditCard(creditcard);
			
		} catch(e) {
			dataOut.success = false;
			error = e;
			dataOut.error = error;
		}
		
		if (ccid && addressId) {
			setPayment();
		}
		
	} 
	
	// User doesn't want to store card in file
	else {
		setPayment();
	}
	
	response.writeLine(JSON.stringify(dataOut));
	
	function setPayment() {
		try {
			order.setPayment({
				'internalid' : ccid, 
				'paymentmethod': paymentObj.paymentmethod,
				creditcard: {
					'ccname': paymentObj.ccname,
					'ccnumber': paymentObj.ccnumber,
					'expyear': paymentObj.expyear,
					'expmonth': paymentObj.expmonth,
					'paymentmethod': paymentObj.paymentmethod,
					'ccsecuritycode': paymentObj.ccsecuritycode
				}
			});
			dataOut.success = true;
		} catch(e) {
			nlapiLogExecution('ERROR', 'Error in processing order', e.details);
			dataOut.success = false;
			dataOut.error = e.details;
		}
	}
	

}


