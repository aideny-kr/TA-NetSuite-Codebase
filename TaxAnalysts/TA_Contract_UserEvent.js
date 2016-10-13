/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 Sep 2016     Chan
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function taContractAfterSubmit(type){
	var context = nlapiGetContext();
	var contract_id = nlapiGetRecordId();
	if(type == 'edit' && +nlapiGetFieldValue('custrecord_ta_full_renewal_value') > 0) {
	  var renewal_tran_id = nlapiGetFieldValue('custrecord_contract_renewal_tran');
	  var ta_renewal_value = +nlapiGetFieldValue('custrecord_ta_full_renewal_value');
	  var ta_sales_renewal_value = +nlapiGetFieldValue('custrecord_ta_contract_value');
	  if(renewal_tran_id) {
		  var FIELDS_TO_LOOKUP = ['custbody_cotermcontracttotal', 'total'];
		  var lookup_flds = nlapiLookupField('salesorder', renewal_tran_id, FIELDS_TO_LOOKUP);
		  
		  if(lookup_flds.custbody_cotermcontracttotal) {
			  nlapiSubmitField('customrecord_contracts', contract_id, 'custrecord_ta_renewed_coterm_value', lookup_flds.custbody_cotermcontracttotal);
		  }
		  +lookup_flds.total >= ta_sales_renewal_value ?
				  nlapiSubmitField('customrecord_contracts', contract_id, 'custrecord_ta_sales_renewed_value', ta_sales_renewal_value) : 
					  nlapiSubmitField('customrecord_contracts', contract_id, 'custrecord_ta_sales_renewed_value', lookup_flds.total);  
		  
		  +lookup_flds.total >= ta_renewal_value ? 
				 nlapiSubmitField('customrecord_contracts', contract_id, 'custrecord_ta_renewed_value', ta_renewal_value) : 
					 nlapiSubmitField('customrecord_contracts', contract_id, 'custrecord_ta_renewed_value', lookup_flds.total); 
				 
		  
	  }	else {
		  nlapiSubmitField('customrecord_contracts', contract_id, ['custrecord_ta_sales_renewed_value', 'custrecord_ta_renewed_value'], ['','']);
	  }
	  
  }
}
