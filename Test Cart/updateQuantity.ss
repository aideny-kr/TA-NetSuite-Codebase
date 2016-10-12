/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       08 Mar 2016     Chan
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function service(request, response){
	var quantity = request.getParameter('quantity');
	
	// get active order in web container
	var order = nlapiGetWebContainer().getShoppingSession().getOrder();
	
	// get the items out of the order
	var items = order.items;
	var orderItemId = items[0].orderitemid;
	var currentQuantityLine1 = items[0].quantity;
	
	var updatedItem = new Object();
	updatedItem.orderitemid = orderItemId;
	updatedItem.quantity = quantity;
	
	order.updateItemQuantity(updatedItem);
	
	var itemJSON = JSON.stringify(order.getItems());
	
	//send back as JSON
	response.setContentType('JSON');
	response.writeLine(itemJSON);
}
