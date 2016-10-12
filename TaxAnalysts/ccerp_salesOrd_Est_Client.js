/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       29 Aug 2014     Dana
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function ccerp_sales_FieldChanged(type, name, linenum){
	
	if (name == 'custbody_contract_name'){
		var contractid = nlapiGetFieldValue('custbody_contract_name');
		if (isNotEmpty(contractid)){
			var enddate = nlapiLookupField('customrecord_contracts', contractid, 'custrecord_contracts_end_date');
			nlapiSetFieldValue('custbody_enddate',enddate);
		}
		else{
			nlapiSetFieldValue('custbody_enddate','');
			nlapiSetFieldValue('custbody_startdate','');
			nlapiSetFieldValue('custbody_tran_term_in_months','12');
		}
	}
	
	var ordtype = nlapiGetFieldValue('custbody_order_type');
	if (ordtype != 3){
		if (name == 'custbody_startdate'){
			var startdate = nlapiGetFieldValue('custbody_startdate');
			if (isNotEmpty(startdate)){
				var term = nlapiGetFieldValue('custbody_tran_term_in_months');
				if (isNotEmpty(term)){
					var enddate = SWE.Library.dates.addMonths2(term, startdate);
					//alert (nlapiStringToDate(enddate));
					nlapiSetFieldValue('custbody_enddate',nlapiDateToString(enddate));
				}
			}
		}
	}
		
		var startdate = nlapiGetFieldValue('custbody_startdate');
	
		if (name == 'custbody_enddate'){
			if (isNotEmpty(startdate)){
				var enddate = nlapiGetFieldValue('custbody_enddate');
				if (isNotEmpty(enddate)){
					var contractterm = SWE.Library.dates.dateDiff(startdate,enddate);
				if (isNotEmpty(contractterm))
				nlapiSetFieldValue('custbody_tran_term_in_months',contractterm);
				}
			}
		}
	if (ordtype==3){
		if (name == 'custbody_startdate'){
			if (isNotEmpty(startdate)){
				var enddate = nlapiGetFieldValue('custbody_enddate');
				if (isNotEmpty(enddate)){
					var contractterm = SWE.Library.dates.dateDiff(startdate,enddate);
				if (isNotEmpty(contractterm))
				nlapiSetFieldValue('custbody_tran_term_in_months',contractterm);
				}
			}
		}
	} 
	
		
	var term = nlapiGetFieldValue('custbody_tran_term_in_months');
	if (type == 'item' && name == 'custcol_userrate'){
		var pricelevel = nlapiGetCurrentLineItemValue('item','price');
		if (pricelevel != -1){
			alert ('Please set price level to custom');
			return false;
		}
		var userrate = nlapiGetCurrentLineItemValue('item','custcol_userrate');
		if (isNotEmpty(userrate)){
			var listrate = userrate/12;
			nlapiSetCurrentLineItemValue('item', 'custcol_list_rate', listrate);
						
		}
		return true;
	}
}

function ccerp_sales_validateLine(type){
	var rectype = nlapiGetRecordType();
	if (rectype == 'opportunity'){
		var startdate = nlapiGetFieldValue('custbody_startdate');
		if (isEmpty(startdate)){
			alert ('Please Enter Contract Start Date');
			return false;
		}
		else{
			nlapiSetCurrentLineItemValue('item', 'custcol_swe_contract_start_date', nlapiDateToString(nlapiStringToDate(startdate)));
		}
	}
	return true;
}
