/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Jan 2016     Chan
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function ta_Google_Analytics_suitelet(request, response){
	var contact_id = request.getParameter('contactid');
	var context = nlapiGetContext();
	var user_id = context.getUser();
	
	nlapiLogExecution('DEBUG', 'Initial Log', contact_id + " " + user_id);
	
	var google_link = nlapiLookupField('employee', user_id, 'custentity_ga_custom_link');
	
	nlapiLogExecution('DEBUG', 'GA Link Log', google_link);
	
	if(isNotEmpty(google_link)){
		var html = "<script>window.open('"+ google_link + contact_id +"', '_self');</script>";
		response.write(html);
	}else{
		var html = "<h3>You have not set up your URL yet. Please contact your administrator</h3>";
		response.write(html);
	}
}