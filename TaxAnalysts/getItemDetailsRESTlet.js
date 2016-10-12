/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       21 Jul 2016     Chan
 *
 */

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
function getItemInfo(dataIn) {
	nlapiLogExecution('DEBUG', 'Datain', typeof dataIn.id);
	if(!dataIn.hasOwnProperty('id')) {
		return {success: false};
	}
	var dataOut;
	var context = nlapiGetContext();
	var env = context.getEnvironment();
	
	var itemId = itemIdResolve(itemsMap, env, +dataIn.id);
	
	var FIELDS_TO_RETURN = ['storedisplayname', 'storedescription', 'storedetaileddescription', 'featureddescription'];
	
	var itemType = nlapiLookupField('item', itemId, 'type');
	
	// If itemType is null, it means there is no item for the given item id
	if(!itemType) {
		return { 
			success: false, 
			message: "No item found for the given ID" 
		};
	}
	
	
	try {
		dataOut = nlapiLookupField('item', itemId, FIELDS_TO_RETURN);
	} catch(e) {
		dataOut.success = false;
		dataOut.message = e;
	}
	
	if(dataOut.hasOwnProperty('storedisplayname')) {
		dataOut.success = true;
		dataOut.price = itemType == 'Kit' ? nlapiLoadRecord('kititem', itemId).getLineItemMatrixValue('price', 'price', 4, 1) :
				 nlapiLoadRecord('noninventoryitem', itemId).getLineItemMatrixValue('price', 'price', 4, 1);
	}
	return dataOut;

}

var itemsMap = [{
	// TN GEO
	"sandbox" : 2078,
	"production" : 2079
},
{
	//TNS-BEPS
	"sandbox" : 2137,
	"production" : 2135
},
{
	//TNS-DPT
	"sandbox" : 2138,
	"production" : 2136
},
{
	//TNS-PE
	"sandbox" : 2139,
	"production" : 2138
},
{
	//TNS-Clinton
	"sandbox" : 2140,
	"production" : 2136
},
{
	//TNL-Trump
	"sandbox" : 2141,
	"production" : 2134
},
{
	//TNL-UP
	"sandbox" : 2142,
	"production" : 2139	
}];

function itemIdResolve(itemsMap, env, itemId) {
	var productionId;
	if (env.toLowerCase() == 'sandbox') {
		return itemId;
	}  
	itemsMap.forEach(function(obj) {
		if(obj['sandbox'] == itemId) {
			productionId = obj['production'];
		}
	});
	
	if(typeof productionId === 'undefined') {
		return itemId;
	} else {
		return productionId;
	}
}

