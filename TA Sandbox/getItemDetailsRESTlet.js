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
	nlapiLogExecution('DEBUG', 'Datain', dataIn.id);
	if(!dataIn.hasOwnProperty('id')) {
		return {success: false};
	}
	var dataOut;
	var FIELDS_TO_RETURN = ['storedisplayname', 'storedescription', 'storedetaileddescription', 'featureddescription'];
	
	var itemType = nlapiLookupField('item', dataIn.id, 'type');
	
	// If itemType is null, it means there is no item for the given item id
	if(!itemType) {
		return { 
			success: false, 
			message: "No item found for the given ID" 
		};
	}
	
	try {
		dataOut = nlapiLookupField('item', dataIn.id, FIELDS_TO_RETURN);
	} catch(e) {
		dataOut.success = false;
		dataOut.message = e;
	}
	
	if(dataOut.hasOwnProperty('storedisplayname')) {
		dataOut.success = true;
		dataOut.price = itemType == 'Kit' ? nlapiLoadRecord('kititem', dataIn.id).getLineItemMatrixValue('price', 'price', 4, 1) :
				 nlapiLoadRecord('noninventoryitem', dataIn.id).getLineItemMatrixValue('price', 'price', 4, 1);
	}
	return dataOut;

}
