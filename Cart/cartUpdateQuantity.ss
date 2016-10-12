/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       06 Sep 2016     Chan
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function service(request, response){
	
	var itemId = request.getBody();
	
	nlapiLogExecution('DEBUG', 'itemId type', typeof itemId);
	
	var order = nlapiGetWebContainer().getShoppingSession().getOrder();
	
	order.removeItem(itemId);
	
	var newOrder = order.getFieldValues({'items': ['name', 'salesdesc', 'quantity', 'rate', 'amount'], 'summary': ''})
	
	response.writeLine(JSON.stringify(newOrder));
}
