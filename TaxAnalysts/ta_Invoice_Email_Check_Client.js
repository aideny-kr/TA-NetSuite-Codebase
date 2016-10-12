/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       17 Nov 2015     Chan
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

function pageInit(){
	AddStyle('https://system.na1.netsuite.com/core/media/media.nl?id=460245&c=1257021&h=1dfd9023815b08328aab&_xt=.css', 'head');
	//AddStyle('https://system.sandbox.netsuite.com/core/media/media.nl?id=460245&c=1257021&h=1dfd9023815b08328aab&_xt=.css','head');
	jQuery('#primary_email').click(function(){
		var primary_email = nlapiLookupField('customer', nlapiGetFieldValue('cust_id_fld'), 'email');
		nlapiSetFieldValue('invoice_email', primary_email, true, true);
		
	});
	
	jQuery('.table_fields').css('padding', '10px');
}

function saveRecord(){
	if(isEmpty(nlapiGetFieldValue('invoice_email')) || isEmpty(nlapiGetFieldValue('invoice_name'))){
		swal("Error", "Invoice Email and Name must be filled in", "error");
		return false;
	}else{
		return true;
	}
}

function clientFieldChanged(type, name, linenum){
	if(name == 'contact_select'){
		var contact_id = nlapiGetFieldValue('contact_select');
		if(contact_id){
			var arr1 = nlapiLookupField('contact', contact_id, ['email', 'entityid']); 
			if(arr1){
				nlapiSetFieldValue('invoice_email', arr1.email, true, true);
				nlapiSetFieldValue('invoice_name', arr1.entityid, true, true);
			}
		}else{
			nlapiSetFieldValue('invoice_email', '', true, true);
			nlapiSetFieldValue('invoice_name', '', true, true);
		}
	}
}
