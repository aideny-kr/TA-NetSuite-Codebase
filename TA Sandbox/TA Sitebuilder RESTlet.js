/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 Jul 2016     Chan
 *
 */

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
function postRESTlet(dataIn) {
	var dataOut = {};
	var env = nlapiGetContext().getEnvironment();
	var userSearchResult;
	var error = {
		message: "error"
	};
	
	var roleId = env == 'PRODUCTION' ? '1050' : '1050';
	
	nlapiLogExecution('DEBUG', 'dataIn', JSON.stringify(dataIn));
	
	if(!dataIn.email) {
		error.code = 'DATAIN ERROR';
		nlapiCreateError(error.code, 'No email was presented');
		dataOut.error = error;
		return dataOut ;
	}
	
	if(!dataIn.firstname) {
		userSearchResult = nlapiSearchRecord("customrecord_contractuser",null,
				[
				   ["custrecord_contractuser_email","is", dataIn.email], 
				   "AND", 
				   ["custrecord_contractuser_activeflag","is","T"], 
				   "AND", 
				   ["custrecord_contractuser_endate","onorafter","today"]
				], 
				[
				   new nlobjSearchColumn("custrecord_contractuser_firstname",null,null), 
				   new nlobjSearchColumn("custrecord_contractuser_lastname",null,null), 
				   new nlobjSearchColumn("internalid","CUSTRECORD_CONTRACTUSER_CONTACT",null).setSort(true)
				]
		);
		
	}
	
	var firstname = dataIn.firstname || userSearchResult[0].getValue('custrecord_contractuser_firstname');
	var lastname = dataIn.lastname || userSearchResult[0].getValue('custrecord_contractuser_lastname');
	var companyname = dataIn.companyname || firstname + ' ' + lastname;
	var email = dataIn.email;
	var password = dataIn.password;
	var password2 = dataIn.password2 || password;
	var contactId = taGetContactId(email);
	
	// Duplicate Check
	// Search if user is already in NetSuite
	var customerSearch = nlapiSearchRecord("customer",null,
			[
			   ["stage","anyof","PROSPECT","CUSTOMER"], 
			   "AND", 
			   ["role","anyof", roleId], 
			   "AND", 
			   ["access","is","T"],
			   "AND",
			   ["email","is",email]
			], 
			[

			]
		);
	
	// Return Data
	if(customerSearch) {
		dataOut.success = true;
		dataOut.customerId = customerSearch[0].getId();
		return dataOut;
	}
	
	// Create a prospect with field values
	var newProspect = nlapiCreateRecord('prospect');
	newProspect.setFieldValue('companyname', companyname);
	newProspect.setFieldValue('email', email);
	newProspect.setFieldValue('giveaccess', 'T');
	newProspect.setFieldValue('accessrole', roleId);
	newProspect.setFieldValue('password', password);
	newProspect.setFieldValue('password2', password2);
	newProspect.selectNewLineItem('contact');
	newProspect.setCurrentLineItemValue('contact', 'firstname', firstname);
	newProspect.setCurrentLineItemValue('contact', 'firstname', lastname);
	
	// if contact id is found, set the id
	if(typeof contactId !== 'undefined'){
		newProspect.setCurrentLineItemValue('contact', 'id', contactId);
	} else {
		newProspect.setCurrentLineItemValue('contact', 'email', email);
	}
	newProspect.commitLineItem('contact');
	try {
		var customerId = nlapiSubmitRecord(newProspect, null, true);
		nlapiLogExecution('DEBUG', 'customerId', customerId);
	}
	catch(err) {
		error.code = err;
		error.detail = 'Error in creating a prospect';
	}
	
	// If customer is successfully created create dataOut object and return
	if(typeof customerId !== 'undefined') {
		dataOut.success = true; 
		dataOut.customerId = customerId;
	}
	// If there was any error, return the error 
	if(typeof error.code !== 'undefined'){
		dataOut.success = false;
		dataOut.error = error; 
	}
	
	nlapiLogExecution('DEBUG', 'dataOut', dataOut);
	return dataOut;
	
}
