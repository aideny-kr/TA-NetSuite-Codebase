/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       17 Feb 2016     Dana
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */


function service(request, response){
	var url = 'https://checkout.sandbox.netsuite.com/app/center/nlvisitor.nl?c=1257021&sc=6&ext=F';
	var isPwdChange = nlapiGetWebContainer().getShoppingSession().isChangePasswordRequest();
	var siteJSON = nlapiGetWebContainer().getShoppingSession().getSiteSettings()
	var siteJSONtxt = JSON.stringify(siteJSON);
	//nlapiLogExecution('debug','siteJSONtxt ',siteJSONtxt);
	nlapiLogExecution('debug','isPwdChange '+isPwdChange);
	if (isPwdChange != true){
		nlapiSetRedirectURL('EXTERNAL',url)
		
	}
}
