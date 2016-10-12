/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       26 Apr 2016     Chan
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
function userEventBeforeSubmit(type){
 
}

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
function taCaseAfterSubmit(type){
	if(type == 'edit' || type == 'create') {
		
		// Find the company of the user based on the email address provided
		
		var user_email = nlapiGetFieldValue('email');
		
		// if user email is there and the company is set as anonymous customer
		if(isNotEmpty(user_email) && nlapiGetFieldValue('company') == '5') {
			var filters = [ new nlobjSearchFilter('email', null, 'is', user_email) ]
			var results = nlapiSearchRecord('contact', null, filters);
			
			var contact_ids = [];
			var company_id = '';
			
			if(results) {
				for(var i = 0; i < results.length; i += 1) {
					contact_ids.push(results[i].getId());
				}
			}
			
			// find company id 
			for(var i = 0; i < contact_ids.length; i += 1) {
				company_id = company_id || nlapiLookupField('contact', contact_ids[i], 'company');
			}
			// if company id is not found the user can be an individual customer
			if(!company_id) {
				for(var i = 0; i < contact_ids.length; i += 1) {
					if(nlapiLookupField('customer', contact_ids[i], 'email') == user_email) {
						company_id = contact_ids[i];
					}
				}
			}
			
			nlapiSubmitField('supportcase', nlapiGetRecordId(), ['company', 'email'], [company_id, user_email]);
			
		}
	}
}
