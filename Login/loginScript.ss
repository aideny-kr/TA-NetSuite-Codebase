/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 Jul 2016     Chan
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function service(request, response){
	var error = {},
		dataOut = {},
		datain = JSON.parse(request.getBody()),
		session = nlapiGetWebContainer().getShoppingSession();
	
	var context = nlapiGetContext();
	var env = context.getEnvironment();
	
	nlapiLogExecution('DEBUG', 'email', datain);
	
	if (!datain.email) error.email = 'Email is required';
	if (!datain.password) error.password = 'Password is required';
	
	if(error.hasOwnProperty('email') || error.hasOwnProperty('password')) {
		dataOut.success = false;
		dataOut.error = error;
	} else {
		
	// Validate Password through taxnotes.com
		
		//getting token using oauth2 
		var tokenUrl = 'https://staging.taxnotes.com/oauth2/token';
		var tokenData = {
				grant_type: "client_credentials",
				client_id: 'uJrOb6231K23FvI2icOTexP7DXBVM9u4G',
				client_secret: 'a1oU9LESvLruzKMIsvafmeoKsgqyedec5tX22rLo0'
			};
		
		var tokenHeader = { "Content-Type": "application/json" };
		
		var nlResponseObjToken = nlapiRequestURL(tokenUrl, JSON.stringify(tokenData), tokenHeader, 'POST');
		nlapiLogExecution('DEBUG', 'Data Check', nlResponseObjToken.getBody());
		var authToken = JSON.parse(nlResponseObjToken.getBody());

		// Validate User Credential
		if(authToken.hasOwnProperty('access_token') && authToken.hasOwnProperty('token_type')) {
			
			var token_type = authToken.token_type;
			var access_token = authToken.access_token;
			
			var authString = token_type + " " + access_token;
			var validateUrl = 'https://staging.taxnotes.com/ps/user/1/password_sync';      

			// LOGIN VALIDATION
			var validateHeader = {};
			validateHeader["Content-Type"] = "application/json";
			validateHeader["Authorization"] = authString;
			
			var validateData = {
				"email": datain.email,
				"password": datain.password
			}
			
			nlResponseObjToken = nlapiRequestURL(validateUrl, JSON.stringify(validateData), validateHeader, 'POST');
			
			var drupalCode = nlResponseObjToken.getCode();
			var drupalResponse = nlResponseObjToken.getBody();
			
			
			nlapiLogExecution('DEBUG', 'Drupal Data', drupalResponse);
			nlapiLogExecution('DEBUG', 'Drupal Code', JSON.stringify(drupalCode));
			
			// Handling Drupal Response
			var drupalObj = JSON.parse(drupalResponse);
			
			
			// @TODO: Process logging in NetSuite first
			// if fails then call Drupal
			
			
			// drupalObj sample
			// {"error":{"code":404,"message":"User not exist"}}
			
			// Call NetSuite to create the user
			if(+drupalCode === 200) {
				var cred = new Credentials();
				
				var headers = {"User-Agent-x": "SuiteScript-Call",
			            "Authorization": "NLAuth nlauth_account=" + cred.account + ", nlauth_email=" + cred.email + 
			                             ", nlauth_signature= " + cred.sandbox_password + ", nlauth_role=" + cred.role,
			            "Content-Type": "application/json"};
				
				var url = env == 'SANDBOX' ? 'https://rest.sandbox.netsuite.com/app/site/hosting/restlet.nl?script=257&deploy=1' : ''; // @TODO: get restlet URL for production
				var requestObj = nlapiRequestURL(url, JSON.stringify(datain), headers);
				var nsResponseBody = requestObj.getBody();
				nlapiLogExecution('DEBUG', 'After Drupal Validation CODE 200', nsResponseBody);
				
				
				// Log in user after NetSuite creates the user.
				var login;
				try {
					login = session.login({ email: datain.email, password: datain.password });
				} catch(e) {
					error.message = e.details;
					dataOut.success = false;                  
					dataOut.error = error;                
				}                                         
            
				if(login) {
					dataOut.success = true;
					dataOut.message = 'Success!'
					dataOut.nextUrl = login.redirecturl;
				}
			}
			else if(+drupalCode === 404) {
				// TODO 9/2/16: Handle 404 Error from Drupal
				dataOut.success = false;
				error.message = 'The email or password you entered is invalid';
				dataOut.error = error;
			}
			

		} else {
			error.message = "Unable to Validate. Please try again";
			dataOut.error = error;
		}
		
	}	
	
	nlapiLogExecution('DEBUG', 'dataOut', JSON.stringify(dataOut));
	response.setContentType('JSON');
	response.writeLine(JSON.stringify(dataOut));
}

function Credentials() {
	this.email = 'web.service@tax.org';
	this.account = '1257021';
	this.role = '3';
	this.sandbox_password = 'Ingenia##1';
	this.prod_password = 'Ingenia##1';
}
