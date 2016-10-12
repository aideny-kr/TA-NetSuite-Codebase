/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       25 Aug 2016     Chan
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function service(request, response){
	var error = {};
	var dataOut = {};
	var order = nlapiGetWebContainer().getShoppingSession().getOrder();
	try{
		var processResult = order.submit();
		nlapiLogExecution('DEBUG', 'processResult', processResult.internalid);
	} catch (e) {
		dataOut.success = false;
		error.details = e.details;
		dataOut.error = error;
	}
	
	if (processResult.internalid) {
		var nsServiceResponse = chargeSalesOrder(processResult.internalid);
		
		var nsResponse = nsServiceResponse.getBody();
		nlapiLogExecution('DEBUG', 'In nsResponse', nsResponse);
		nsResponse = JSON.parse(nsResponse);
		nlapiLogExecution('DEBUG', 'In nsResponse After Parse', nsResponse.success);
		if(nsResponse.csId) {
			dataOut.success = true;
		}
		else {
			dataOut.success = false;
			error.details = dataOut.details
			dataOut.error = error;
		}
	}
	
	nlapiLogExecution('DEBUG', 'Data Out', JSON.stringify(dataOut));
	response.writeLine(JSON.stringify(dataOut));
}

function chargeSalesOrder(internalId) {
	var context = nlapiGetContext();
	var ENV = context.getEnvironment();

	var postdata = {internalId: internalId};
	//postdata.push (paymentObj);
	//nlapiLogExecution('DEBUG', 'ENV', ENV);
	var url = (ENV === 'SANDBOX') ? 'https://rest.sandbox.netsuite.com/app/site/hosting/restlet.nl?script=260&deploy=1':'';
	
	var cred = new Credentials();
	var headers = {"User-Agent-x": "SuiteScript-Call",
            "Authorization": "NLAuth nlauth_account=" + cred.account + ", nlauth_email=" + cred.email + 
                             ", nlauth_signature= " + cred.sandbox_password + ", nlauth_role=" + cred.role,
            "Content-Type": "application/json"};
	postdata = JSON.stringify(postdata);
	return nlapiRequestURL(url, postdata, headers);
	
}


function Credentials() {
	this.email = 'web.service@tax.org';
	this.account = '1257021';
	this.role = '3';
	this.sandbox_password = 'Ingenia##1';
	this.prod_password = 'Peru1004?!';
}