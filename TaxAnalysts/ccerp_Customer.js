/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       02 May 2015     Dana
 *
 */
function ta_customer_Field_changed(type, name, linenum) {
	var emailAddr = nlapiGetFieldValue('email');
	
	// setting flag to update email address 
	
	if(type == 'edit' || name == 'email'){
		if(confirm('This will update all Email addresses of open Sales Order/Quote/Invoice of this customer. Do you to proceed?')){
			nlapiSetFieldValue('custentity_email_update_flag', 'T');
		}else{
			nlapiSetFieldValue('email', emailAddr, false, true);
		}
		
	}
}

function customer_BeforeLoad(type, form, request){
	if (type == 'view' || type == 'edit'){
		form.setScript('customscript_ta_customer_client');
		var webuser_sublist = form.getSubList('recmachcustrecord_contractuser_customer')
	
		if(isNotEmpty(webuser_sublist)){
			webuser_sublist.addButton('custpage_freetrialimport_btn', 'Create Free Trial Users', 'triggerFreeTrialSuitelet()');
			webuser_sublist.addButton('custpage_usermanage_btn', 'User Management', 'triggerUserManagement()');
		}
		
		// Set Credit Status Field Based on custentity_credit_on_hold
		
		if(nlapiGetFieldValue('creditholdoverride') == 'ON') {
			nlapiSetFieldValue('custentity_credit_on_hold', 'On Hold');
		}else {
			nlapiSetFieldValue('custentity_credit_on_hold', 'Good');
		}
		
	}	
}

function triggerUserManagement() {
	var custId = nlapiGetRecordId();
	var url = nlapiResolveURL('SUITELET', 'customscript_webuser_management', 'customdeploy1');
	url += '&custId='+custId;
	window.open(url, '_self');
}

function triggerFreeTrialSuitelet() {
	var custId = nlapiGetRecordId();
	var url = nlapiResolveURL('SUITELET', 'customscript_ta_freetrial_suitelet', 'customdeploy1');
	url += '&custId='+custId;
	window.open(url, '_self');
}

function updateContractUsers_Btn(){
	var custId = nlapiGetRecordId();
	var url = nlapiResolveURL('SUITELET','customscript_ccerp_updatecontractusers_s','customdeploy1');
	url += '&custId='+custId;
	window.open(url,'_self');
}

function triggerWebUserSuitelet() {
	var custId = nlapiGetRecordId();
	var url = nlapiResolveURL('SUITELET', 'customscript_webuser_assistant_suitelet', 'customdeploy1');
	url += '&custId='+custId;
	window.open(url,'_self');
}

function ta_customer_SaveRecord(){
	var invmeth = nlapiGetFieldValue('custentity_ta_invoice_method');
	var eml = nlapiGetFieldValue('email');
	nlapiLogExecution('debug', 'ta_customer_SaveRecord: Method: ' + invmeth + 'Eml: ' + eml.length);

	if (invmeth !=2  && eml.length < 4) {
	alert('When Invoices are set to be emailed, the record email address must be completed.');
	return false;
	}
	return true;
}

//function addJS(element) {
//	var webUserButton = document.getElementById(element);
//	webUserButton.value = "New Free Trial";
//}

function ta_Customer_BeforeSubmit(type) {
	if(type == 'create' || type == 'edit'){
		// Set Uplift Type to Default
		var uplift_value = nlapiGetFieldValue('custentity_uplift');
		if(uplift_value === '') nlapiSetFieldValue('custentity_uplift_type', '6');
		
		// Update Billing Contact Email if not filled in
		
		var billingEmail = nlapiGetFieldValue('email');
		var invoiceEmail = nlapiGetFieldValue('custentity_ta_invoice_email_address');
		if(!billingEmail && invoiceEmail) {
			nlapiSetFieldValue('email', invoiceEmail, true);
		} 
		
	}
}

function ta_Customer_AfterSave(type) {
	var customer_id = nlapiGetRecordId();
	// Perform separating entity id and customer name 
	if(type == 'edit' || type == 'create') {
		var cust_rec = nlapiLoadRecord('customer', customer_id);
		var company_name = cust_rec.getFieldValue('entityid');
		if(isNotEmpty(company_name)){
			var entity = cust_rec.getFieldValue('entityid');
			var entity_num = entity.substr(0, entity.indexOf(" ")).trim();
			var entity_name = entity.substr(entity.indexOf(" ") + 1, entity.length);
			
			nlapiSubmitField('customer', customer_id, ['custentity_entity_name', 'custentity_entity_number'], [entity_name, entity_num]);
		}
	}
	
	// Perform email updates to all open invoices, sales orders and quotes
	// if email has been changed on the customer form
	if( type == 'edit' || type == 'xedit' ) {	
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
				} 
			} 
		} 
	} 
}
