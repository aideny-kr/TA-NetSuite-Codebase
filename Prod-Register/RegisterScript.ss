/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Jun 2016     Chan
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function service(request, response){
	nlapiLogExecution('DEBUG', 'Begin', 'Script Begins');
	nlapiLogExecution('DEBUG', 'datain', request.getBody());
	var dataOut = {};
	var datain = JSON.parse(request.getBody());
	datain.companyname = datain.firstname + ' ' + datain.lastname;
	var context = nlapiGetContext();
	var env = context.getEnvironment();
	var customerObj = nlapiGetWebContainer().getShoppingSession().getCustomer();
	var session = nlapiGetWebContainer().getShoppingSession();

	//nlapiLogExecution('DEBUG', 'Cust Obj', JSON.stringify(customerObj));
	
	
	
	
	var cred = new Credentials();
	
	var headers = {"User-Agent-x": "SuiteScript-Call",
            "Authorization": "NLAuth nlauth_account=" + cred.account + ", nlauth_email=" + cred.email + 
                             ", nlauth_signature= " + cred.sandbox_password + ", nlauth_role=" + cred.role,
            "Content-Type": "application/json"};
	
	var url = env == 'SANDBOX' ? 'https://rest.sandbox.netsuite.com/app/site/hosting/restlet.nl?script=257&deploy=1' : ''; // @TODO: get restlet URL for production
	
	var getResponse = nlapiRequestURL(url, JSON.stringify(datain), headers);
	
	//nlapiLogExecution('DEBUG', 'Response', getCheckoutUrl());
	//var returnedValue = session.registerCustomer(newCustomer);
	
	var ssResponse = JSON.parse(getResponse.getBody());
	
	nlapiLogExecution('DEBUG', 'response after REST call', getResponse.getBody());
	

	
	if (ssResponse.success == true) {
		var customer = {
			email: datain.email,
			password: datain.password
		}
		var login = session.login(customer);
		dataOut.nextUrl = login.redirecturl;
		dataOut.success = true;
		//nlapiSetRedirectURL('external', login.redirecturl);
		
	}else {
		dataOut.success = false;
		dataOut.error = 'Something went wrong';
	}
	
	nlapiLogExecution('DEBUG', 'redirectURL', login.redirecturl);
	
	response.writeLine(JSON.stringify(dataOut));

}

function Credentials() {
	this.email = 'web.service@tax.org';
	this.account = '1257021';
	this.role = '3';
	this.sandbox_password = 'Ingenia##1';
	this.prod_password = 'Ingenia##1';
}
