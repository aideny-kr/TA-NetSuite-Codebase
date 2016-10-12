/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       02 Mar 2015     huichanyi
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


// After user submits the form this will be executed on server-side
function afterSubmitEmailChange(type) {
	nlapiLogExecution('debug', 'afterSubmit'+type);
	
	if( type == 'edit' || type == 'xedit' ){	
		if( nlapiGetFieldValue('custentity_email_update_flag') == 'T' ){
			var customerId = nlapiGetFieldValue('entityid');
			var customerEmail = nlapiGetFieldValue('email');
			var custid = nlapiGetRecordId();
			
			//removing flag
			nlapiSubmitField('customer', custid, 'custentity_email_update_flag', 'F', false);
			
			//setting entity id filter for the search
			var filter = [];
			filter.push(new nlobjSearchFilter('internalid','customer','anyof', custid));
			
			//running search and referencing the results to variable
			var searchResult = nlapiSearchRecord(null, 'customsearch_chan_email_update', filter);
			
			//update search and update tobeEmailed field for each record found
			if( isNotEmpty(searchResult) ){
				for(var i = 0; i < searchResult.length; i++){
					var internalId = searchResult[i].getId();
					nlapiLogExecution('debug', 'afterSubmitEmailChange', 'Transaction Interna ID = ' + internalId);
					var recordType = searchResult[i].getValue('recordtype');
					nlapiSubmitField(recordType, internalId, 'email', customerEmail, false);
				} // end loop for updating the searh results
			} //end if statement for isNotEmpty
		} //end if statement for checking flag value
	} //end if statement for edit || xedit 
} //end function afterSubmitEmailChange	